<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;

class DocumentQAAgentService extends BaseAiService
{
    public function __construct(private readonly RagService $ragService)
    {
    }

    /**
     * @return array{
     *     ok: bool,
     *     status: int,
     *     attempts: int,
     *     prompt_version: string,
     *     answer?: string,
     *     references?: list<array{document: string, section: string, score: float}>,
     *     message: string,
     *     code: string
     * }
     */
    public function answer(string $question, int $userId, int $documentId): array
    {
        $promptVersion = $this->promptVersion('document_qa');

        try {
            $chunks = $this->ragService->retrieve(
                query: $question,
                userId: $userId,
                documentId: $documentId,
                limit: 6,
            );
        } catch (ConnectionException $exception) {
            return $this->failure(503, 1, $promptVersion, 'OpenAI is temporarily unreachable while searching this document.', 'embedding_unreachable');
        } catch (RequestException $exception) {
            $failure = $this->mapRequestException($exception);

            return $this->failure($failure['status'], 1, $promptVersion, 'Document retrieval failed before the assistant could answer.', $failure['code']);
        }

        if ($chunks->isEmpty()) {
            return [
                'ok' => true,
                'status' => 200,
                'attempts' => 0,
                'prompt_version' => $promptVersion,
                'answer' => 'I could not find enough indexed document context to answer that from the selected policy document.',
                'references' => [],
                'message' => 'No matching document context was found.',
                'code' => 'no_context',
            ];
        }

        foreach (range(1, 2) as $attempt) {
            try {
                $response = $this->makeRequest($question, $chunks, $promptVersion);
                $response->throw();

                $answer = trim((string) $this->extractOutputText($response));

                if ($answer !== '') {
                    return [
                        'ok' => true,
                        'status' => 200,
                        'attempts' => $attempt,
                        'prompt_version' => $promptVersion,
                        'answer' => $answer,
                        'references' => $this->referencePayload($chunks),
                        'message' => 'Document answer generated successfully.',
                        'code' => 'ok',
                    ];
                }
            } catch (ConnectionException $exception) {
                if ($attempt === 2) {
                    return $this->failure(503, $attempt, $promptVersion, 'OpenAI is temporarily unreachable. Please try again shortly.', 'upstream_unreachable');
                }
            } catch (RequestException $exception) {
                $failure = $this->mapRequestException($exception);

                if (! $failure['retryable'] || $attempt === 2) {
                    return $this->failure($failure['status'], $attempt, $promptVersion, $failure['message'], $failure['code']);
                }
            }
        }

        return $this->failure(502, 2, $promptVersion, 'The AI response was returned in an unexpected format.', 'invalid_response_format');
    }

    private function makeRequest(string $question, mixed $chunks, string $promptVersion): Response
    {
        return $this->postOpenAi('/responses', [
            'model' => config('services.openai.model'),
            'input' => [
                [
                    'role' => 'system',
                    'content' => [
                        [
                            'type' => 'input_text',
                            'text' => 'You are the Document Q&A Agent for a policy assistant. Answer only from the supplied document context. Be concise and explicit when the context is insufficient.',
                        ],
                    ],
                ],
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'input_text',
                            'text' => view('prompts.agents.document-qa', [
                                'question' => $question,
                                'chunks' => $chunks,
                                'promptVersion' => $promptVersion,
                            ])->render(),
                        ],
                    ],
                ],
            ],
        ]);
    }

    private function failure(int $status, int $attempts, string $promptVersion, string $message, string $code): array
    {
        return [
            'ok' => false,
            'status' => $status,
            'attempts' => $attempts,
            'prompt_version' => $promptVersion,
            'message' => $message,
            'code' => $code,
        ];
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
}
