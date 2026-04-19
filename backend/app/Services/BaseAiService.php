<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class BaseAiService
{
    protected function openAi(): PendingRequest
    {
        return Http::baseUrl(config('services.openai.base_url'))
            ->withToken(config('services.openai.api_key'))
            ->timeout(config('services.openai.timeout'))
            ->acceptJson();
    }

    /**
     * @throws ConnectionException
     */
    protected function postOpenAi(string $endpoint, array $payload): Response
    {
        $attempts = (int) config('services.openai.retry_attempts', 2);
        $delay = (int) config('services.openai.retry_delay_ms', 250);

        $response = $this->openAi()
            ->retry($attempts, $delay, throw: false)
            ->post($endpoint, $payload);

        Log::info('OpenAI request completed.', [
            'endpoint' => $endpoint,
            'status' => $response->status(),
        ]);

        return $response;
    }

    /**
     * @return array{status: int, message: string, code: string, retryable: bool}
     */
    protected function mapRequestException(RequestException $exception): array
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
                'message' => 'OpenAI had a temporary issue while generating the response.',
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

    protected function extractOutputText(Response $response): ?string
    {
        $payload = $response->json();
        $content = $payload['output'][0]['content'][0] ?? null;

        if (! is_array($content)) {
            return null;
        }

        $text = $content['text'] ?? $content['json'] ?? null;

        if (is_array($text)) {
            return json_encode($text);
        }

        return is_string($text) ? $text : null;
    }

    protected function promptVersion(string $agent): string
    {
        return (string) config("services.ai_agents.{$agent}_prompt_version", 'v1');
    }
}
