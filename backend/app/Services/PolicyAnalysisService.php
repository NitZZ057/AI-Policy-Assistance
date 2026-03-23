<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class PolicyAnalysisService
{
    /**
     * @param  array{type: string, coverage: string, location: string, risk: string}  $policy
     * @return array{
     *     ok: bool,
     *     status: int,
     *     attempts: int,
     *     data?: array{summary: string, risk_analysis: string, email: string},
     *     fallback: array{summary: string, risk_analysis: string, email: string},
     *     message: string,
     *     code: string
     * }
     */
    public function generate(array $policy): array
    {
        $attempts = 0;
        $lastFailure = [
            'status' => 502,
            'message' => 'We could not generate policy insights right now.',
            'code' => 'generation_failed',
        ];

        foreach (range(1, 2) as $attempt) {
            $attempts = $attempt;

            try {
                $response = $this->makeRequest($policy);
                $response->throw();

                $result = $this->extractStructuredResult($response);

                if ($result !== null) {
                    return [
                        'ok' => true,
                        'status' => 200,
                        'attempts' => $attempts,
                        'data' => $result,
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

                if ($attempt < 2) {
                    usleep(250000);
                    continue;
                }
            } catch (RequestException $exception) {
                $failure = $this->mapRequestException($exception);
                $lastFailure = $failure;

                if ($failure['retryable'] && $attempt < 2) {
                    usleep(250000);
                    continue;
                }
            }
        }

        return [
            'ok' => false,
            'status' => $lastFailure['status'],
            'attempts' => $attempts,
            'fallback' => $this->fallbackPayload(),
            'message' => $lastFailure['message'],
            'code' => $lastFailure['code'],
        ];
    }

    /**
     * @param  array{type: string, coverage: string, location: string, risk: string}  $policy
     */
    private function makeRequest(array $policy): Response
    {
        return Http::baseUrl(config('services.openai.base_url'))
            ->withToken(config('services.openai.api_key'))
            ->timeout(config('services.openai.timeout'))
            ->acceptJson()
            ->post('/responses', [
                'model' => config('services.openai.model'),
                'input' => [
                    [
                        'role' => 'system',
                        'content' => [
                            [
                                'type' => 'input_text',
                                'text' => 'You are an insurance policy assistant. Analyze the provided policy details and return concise, practical output for an internal operations team. Keep the summary and risk analysis professional, and make the client email clear and friendly.',
                            ],
                        ],
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'input_text',
                                'text' => view('prompts.policy-analysis', ['policy' => $policy])->render(),
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
        $payload = $response->json();
        $content = $payload['output'][0]['content'][0] ?? null;

        if (! is_array($content)) {
            return null;
        }

        $json = $content['text'] ?? $content['json'] ?? null;

        if (is_array($json)) {
            $parsed = $json;
        } elseif (is_string($json)) {
            $parsed = json_decode($json, true);
        } else {
            return null;
        }

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

    /**
     * @return array{status: int, message: string, code: string, retryable: bool}
     */
    private function mapRequestException(RequestException $exception): array
    {
        $status = $exception->response?->status() ?? 502;
        $error = $exception->response?->json('error') ?? [];
        $code = is_string($error['code'] ?? null) ? $error['code'] : 'upstream_error';

        if ($status === 401) {
            return [
                'status' => 502,
                'message' => 'The OpenAI API key is invalid or unauthorized.',
                'code' => $code,
                'retryable' => false,
            ];
        }

        if ($code === 'insufficient_quota' || $status === 429) {
            return [
                'status' => 503,
                'message' => 'OpenAI quota is unavailable right now. Check billing or try a different key.',
                'code' => $code,
                'retryable' => false,
            ];
        }

        if ($status >= 500) {
            return [
                'status' => 503,
                'message' => 'OpenAI had a temporary issue while generating the analysis.',
                'code' => $code,
                'retryable' => true,
            ];
        }

        return [
            'status' => 502,
            'message' => 'OpenAI rejected the request.',
            'code' => $code,
            'retryable' => false,
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
}
