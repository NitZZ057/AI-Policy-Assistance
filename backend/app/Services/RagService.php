<?php

namespace App\Services;

use App\Models\DocumentChunk;
use App\Models\PolicyDocument;
use Illuminate\Support\Collection;

class RagService
{
    public function __construct(private readonly EmbeddingService $embeddingService)
    {
    }

    /**
     * @return Collection<int, DocumentChunk>
     */
    public function retrieve(string $query, int $userId, ?int $documentId = null, int $limit = 5): Collection
    {
        if ($documentId === null) {
            return collect();
        }

        $queryEmbedding = $this->embeddingService->embed($query);

        return DocumentChunk::query()
            ->where('policy_document_id', $documentId)
            ->whereNotNull('embedding')
            ->whereHas('document', fn ($query) => $query->where('user_id', $userId)->where('status', 'ready'))
            ->with('document:id,user_id,original_name')
            ->get()
            ->map(function (DocumentChunk $chunk) use ($queryEmbedding): DocumentChunk {
                $chunk->similarity_score = $this->cosineSimilarity($queryEmbedding, $chunk->embedding ?? []);

                return $chunk;
            })
            ->sortByDesc('similarity_score')
            ->take($limit)
            ->values();
    }

    public function storeChunks(PolicyDocument $document, string $rawText): int
    {
        $chunker = app(DocumentChunker::class);
        $created = 0;

        foreach ($chunker->chunk($rawText) as $index => $chunk) {
            $document->chunks()->create([
                'chunk_index' => $index,
                'content' => $chunk['content'],
                'token_count' => $chunk['token_count'],
                'embedding' => $this->embeddingService->embed($chunk['content']),
            ]);

            $created++;
        }

        return $created;
    }

    /**
     * @param  list<float>  $a
     * @param  list<float>  $b
     */
    private function cosineSimilarity(array $a, array $b): float
    {
        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($a as $index => $value) {
            $other = (float) ($b[$index] ?? 0);
            $dot += (float) $value * $other;
            $normA += (float) $value ** 2;
            $normB += $other ** 2;
        }

        if ($normA <= 0.0 || $normB <= 0.0) {
            return 0.0;
        }

        return $dot / (sqrt($normA) * sqrt($normB));
    }
}
