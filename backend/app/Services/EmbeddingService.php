<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

class EmbeddingService extends BaseAiService
{
    /**
     * @return list<float>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function embed(string $text): array
    {
        $response = $this
            ->postOpenAi('/embeddings', [
                'model' => config('services.openai.embedding_model'),
                'input' => $this->normalizeInput($text),
                'encoding_format' => 'float',
            ])
            ->throw()
            ->json();

        return $response['data'][0]['embedding'] ?? [];
    }

    private function normalizeInput(string $text): string
    {
        $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');

        // Keep embedding requests comfortably below model limits while retaining enough context per chunk.
        return mb_substr($text, 0, 12000);
    }
}
