<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;

class PolicyAnalysisAgentService extends BaseAiService
{
    public function __construct(private readonly RagService $ragService)
    {
    }

    /**
     * @param  array{type: string, coverage: string, location: string, risk: string}  $policy
     * @return array{
     *     ok: bool,
     *     status: int,
     *     attempts: int,
     *     prompt_version: string,
     *     data?: array{summary: string, risk_analysis: string, email: string},
     *     sources?: list<array{document_chunk_id: int, score: float, excerpt: string}>,
     *     references?: list<array{document: string, section: string, score: float}>,
     *     fallback: array{summary: string, risk_analysis: string, email: string},
     *     message: string,
     *     code: string
     * }
     */
    public function analyze(array $policy, int $userId, ?int $documentId = null): array
    {
        $attempts = 0;
        $promptVersion = $this->promptVersion('policy_analysis');
        $chunks = collect();
        $lastFailure = [
            'status' => 502,
            'message' => 'We could not generate policy insights right now.',
            'code' => 'generation_failed',
        ];

        try {
            $chunks = $this->ragService->retrieve(
                query: implode(' ', array_filter($policy)),
                userId: $userId,
                documentId: $documentId,
                limit: 5,
            );
        } catch (ConnectionException $exception) {
            return $this->failure(
                status: 503,
                attempts: 1,
                promptVersion: $promptVersion,
                message: 'OpenAI is temporarily unreachable while preparing document search.',
                code: 'embedding_unreachable',
            );
        } catch (RequestException $exception) {
            $failure = $this->mapRequestException($exception);

            return $this->failure(
                status: $failure['status'],
                attempts: 1,
                promptVersion: $promptVersion,
                message: 'Document retrieval failed before analysis could run.',
                code: $failure['code'],
            );
        }

        foreach (range(1, 2) as $attempt) {
            $attempts = $attempt;

            try {
                $response = $this->makeRequest($policy, $chunks, $promptVersion);
                $response->throw();

                $result = $this->extractStructuredResult($response);

                if ($result !== null) {
                    return [
                        'ok' => true,
                        'status' => 200,
                        'attempts' => $attempts,
                        'prompt_version' => $promptVersion,
                        'data' => $result,
                        'sources' => $this->sourcePayload($chunks),
                        'references' => $this->referencePayload($chunks),
                        'fallback' => $this->fallbackPayload(),
                        'message' => 'Policy analysis generated successfully.',
                        'code' => 'ok',
                    ];
                }

                $lastFailure = [
                    'status' => 502,
                    'message' => 'The AI response was returned in an unexpected format.',
                    'code' => 'invalid_response_format',
                ];
            } catch (ConnectionException $exception) {
                $lastFailure = [
                    'status' => 503,
                    'message' => 'OpenAI is temporarily unreachable. Please try again shortly.',
                    'code' => 'upstream_unreachable',
                ];
            } catch (RequestException $exception) {
                $failure = $this->mapRequestException($exception);
                $lastFailure = $failure;

                if (! $failure['retryable']) {
                    break;
                }
            }
        }

        return $this->failure(
            status: $lastFailure['status'],
            attempts: $attempts,
            promptVersion: $promptVersion,
            message: $lastFailure['message'],
            code: $lastFailure['code'],
        );
    }

    private function makeRequest(array $policy, mixed $chunks, string $promptVersion): Response
    {
        return $this->postOpenAi('/responses', [
            'model' => config('services.openai.model'),
            'input' => [
                [
                    'role' => 'system',
                    'content' => [
                        [
                            'type' => 'input_text',
                            'text' => 'You are the Policy Analysis Agent for an insurance operations product. Return structured, practical policy output for human review.',
                        ],
                    ],
                ],
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'input_text',
                            'text' => view('prompts.agents.policy-analysis', [
                                'policy' => $policy,
                                'chunks' => $chunks,
                                'promptVersion' => $promptVersion,
                            ])->render(),
                        ],
                    ],
                ],
            ],
            'text' => [
                'format' => [
                    'type' => 'json_schema',
                    'name' => 'policy_analysis',
                    'schema' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'required' => ['summary', 'risk_analysis', 'email'],
                        'properties' => [
                            'summary' => ['type' => 'string'],
                            'risk_analysis' => ['type' => 'string'],
                            'email' => ['type' => 'string'],
                        ],
                    ],
                    'strict' => true,
                ],
            ],
        ]);
    }

    /**
     * @return array{summary: string, risk_analysis: string, email: string}|null
     */
    private function extractStructuredResult(Response $response): ?array
    {
        $json = $this->extractOutputText($response);

        if ($json === null) {
            return null;
        }

        $parsed = json_decode($json, true);

        if (
            ! is_array($parsed) ||
            ! isset($parsed['summary'], $parsed['risk_analysis'], $parsed['email']) ||
            ! is_string($parsed['summary']) ||
            ! is_string($parsed['risk_analysis']) ||
            ! is_string($parsed['email'])
        ) {
            return null;
        }

        return [
            'summary' => $parsed['summary'],
            'risk_analysis' => $parsed['risk_analysis'],
            'email' => $parsed['email'],
        ];
    }

    private function failure(int $status, int $attempts, string $promptVersion, string $message, string $code): array
    {
        return [
            'ok' => false,
            'status' => $status,
            'attempts' => $attempts,
            'prompt_version' => $promptVersion,
            'fallback' => $this->fallbackPayload(),
            'message' => $message,
            'code' => $code,
        ];
    }

    /**
     * @return array{summary: string, risk_analysis: string, email: string}
     */
    private function fallbackPayload(): array
    {
        return [
            'summary' => 'No AI summary is available yet.',
            'risk_analysis' => 'Risk analysis could not be generated. Review the policy details manually and try again later.',
            'email' => '',
        ];
    }

    private function sourcePayload(mixed $chunks): array
    {
        return $chunks
            ->map(fn ($chunk): array => [
                'document_chunk_id' => $chunk->id,
                'score' => round((float) ($chunk->similarity_score ?? 0), 8),
                'excerpt' => $this->referenceLabel($chunk),
            ])
            ->values()
            ->all();
    }

    private function referencePayload(mixed $chunks): array
    {
        return $chunks
            ->map(fn ($chunk): array => [
                'document' => $chunk->document->original_name ?? 'Policy document',
                'section' => 'Section '.((int) $chunk->chunk_index + 1),
                'score' => round((float) ($chunk->similarity_score ?? 0), 3),
            ])
            ->values()
            ->all();
    }

    private function referenceLabel(mixed $chunk): string
    {
        $name = $chunk->document->original_name ?? 'Policy document';

        return $name.' - Section '.((int) $chunk->chunk_index + 1);
    }
}
