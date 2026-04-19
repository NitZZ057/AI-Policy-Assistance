<?php

namespace App\Http\Controllers;

use App\Models\PolicyDocument;
use App\Services\DocumentQAAgentService;
use App\Services\DocumentTextExtractor;
use App\Services\RagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $documents = PolicyDocument::query()
            ->where('user_id', $request->user()->id)
            ->withCount('chunks')
            ->latest()
            ->get(['id', 'original_name', 'mime_type', 'status', 'metadata', 'created_at']);

        return response()->json(['data' => $documents]);
    }

    public function store(Request $request, DocumentTextExtractor $extractor, RagService $ragService): JsonResponse
    {
        $validated = $request->validate([
            'document' => ['required', 'file', 'mimes:pdf,txt', 'max:10240'],
        ]);

        $file = $validated['document'];
        $fileHash = hash_file('sha256', $file->getRealPath());

        $existingDocument = PolicyDocument::query()
            ->where('user_id', $request->user()->id)
            ->where('file_hash', $fileHash)
            ->withCount('chunks')
            ->first();

        if ($existingDocument !== null) {
            return response()->json([
                'data' => $existingDocument,
                'duplicate' => true,
                'message' => 'This document is already uploaded and indexed.',
            ]);
        }

        $path = $file->store('policy-documents');

        $document = PolicyDocument::create([
            'user_id' => $request->user()->id,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'file_hash' => $fileHash,
            'storage_path' => $path,
            'raw_text' => '',
            'status' => 'processing',
            'metadata' => [
                'size' => $file->getSize(),
            ],
        ]);

        try {
            $rawText = $extractor->extract(Storage::path($path), $document->mime_type);

            if ($rawText === '') {
                throw new \RuntimeException('The uploaded document did not contain extractable text.');
            }

            $document->update(['raw_text' => $rawText]);
            $chunkCount = $ragService->storeChunks($document, $rawText);

            $document->update([
                'status' => 'ready',
                'metadata' => array_merge($document->metadata ?? [], ['chunk_count' => $chunkCount]),
            ]);
        } catch (Throwable $exception) {
            $document->update([
                'status' => 'failed',
                'metadata' => array_merge($document->metadata ?? [], ['error' => $exception->getMessage()]),
            ]);

            return response()->json([
                'message' => $exception->getMessage(),
                'data' => $document->loadCount('chunks'),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json([
            'data' => $document->loadCount('chunks'),
            'message' => 'Document uploaded and indexed.',
        ], Response::HTTP_CREATED);
    }

    public function query(Request $request, DocumentQAAgentService $agent): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => ['required', 'integer', 'exists:policy_documents,id'],
            'question' => ['required', 'string', 'max:2000'],
        ]);

        PolicyDocument::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'ready')
            ->findOrFail($validated['document_id']);

        $result = $agent->answer(
            question: $validated['question'],
            userId: $request->user()->id,
            documentId: (int) $validated['document_id'],
        );

        if (! $result['ok']) {
            return response()->json([
                'message' => $result['message'],
                'answer' => '',
                'references' => [],
                'meta' => [
                    'attempts' => $result['attempts'],
                    'error_code' => $result['code'],
                    'prompt_version' => $result['prompt_version'],
                ],
            ], $result['status']);
        }

        return response()->json([
            'answer' => $result['answer'],
            'references' => $result['references'] ?? [],
            'meta' => [
                'attempts' => $result['attempts'],
                'prompt_version' => $result['prompt_version'],
            ],
        ]);
    }
}
