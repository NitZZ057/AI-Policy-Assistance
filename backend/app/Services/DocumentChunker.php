<?php

namespace App\Services;

class DocumentChunker
{
    /**
     * @return list<array{content: string, token_count: int}>
     */
    public function chunk(string $text, int $targetWords = 380, int $overlapWords = 60): array
    {
        $normalized = trim(preg_replace('/\s+/', ' ', $text) ?? '');

        if ($normalized === '') {
            return [];
        }

        $words = preg_split('/\s+/', $normalized) ?: [];
        $step = max(1, $targetWords - $overlapWords);
        $chunks = [];

        for ($offset = 0; $offset < count($words); $offset += $step) {
            $slice = array_slice($words, $offset, $targetWords);

            if (count($slice) < 25 && count($chunks) > 0) {
                break;
            }

            $chunks[] = [
                'content' => implode(' ', $slice),
                'token_count' => (int) ceil(count($slice) * 1.33),
            ];
        }

        return $chunks;
    }
}
