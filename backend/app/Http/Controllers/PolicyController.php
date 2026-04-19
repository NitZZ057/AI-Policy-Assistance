<?php

namespace App\Http\Controllers;

use App\Models\PolicyAnalysis;
use App\Models\PolicyDocument;
use App\Services\PolicyAnalysisAgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class PolicyController extends Controller
{
    public function __construct(
        private readonly PolicyAnalysisAgentService $policyAnalysisAgent
    ) {
    }

    public function analyze(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'type' => ['required', 'string', 'max:255'],
            'coverage' => ['required', 'string', 'max:1000'],
            'location' => ['required', 'string', 'max:255'],
            'risk' => ['required', 'string', 'max:1000'],
            'document_id' => ['nullable', 'integer', 'exists:policy_documents,id'],
        ]);

        $documentId = $validated['document_id'] ?? null;

        if ($documentId !== null) {
            PolicyDocument::query()
                ->where('user_id', $user->id)
                ->where('status', 'ready')
                ->findOrFail($documentId);
        }

        $policyInput = collect($validated)->except('document_id')->all();

        $result = $this->policyAnalysisAgent->analyze($policyInput, $user->id, $documentId);

        $analysis = PolicyAnalysis::create([
            'user_id' => $user->id,
            'policy_document_id' => $documentId,
            'policy_type' => $validated['type'],
            'prompt_version' => $result['prompt_version'],
            'input_payload' => $validated,
            'status' => 'pending',
        ]);

        if ($result['ok']) {
            $analysis->update([
                'status' => 'completed',
                'output_payload' => $result['data'],
                'error_message' => null,
                'error_code' => null,
            ]);

            foreach ($result['sources'] ?? [] as $source) {
                $analysis->sources()->create($source);
            }

            return response()->json([
                'result' => $result['data'],
                'references' => $result['references'] ?? [],
                'meta' => [
                    'analysis_id' => $analysis->id,
                    'status' => $analysis->status,
                    'attempts' => $result['attempts'],
                    'prompt_version' => $analysis->prompt_version,
                ],
            ]);
        }

        $analysis->update([
            'status' => 'failed',
            'output_payload' => $result['fallback'],
            'error_message' => $result['message'],
            'error_code' => $result['code'],
        ]);

        return response()->json([
            'message' => $result['message'],
            'result' => $result['fallback'],
            'references' => [],
            'meta' => [
                'analysis_id' => $analysis->id,
                'status' => $analysis->status,
                'attempts' => $result['attempts'],
                'error_code' => $result['code'],
                'prompt_version' => $analysis->prompt_version,
            ],
        ], $result['status']);
    }

    public function index(): JsonResponse
    {
        $history = PolicyAnalysis::query()
            ->where('user_id', request()->user()->id)
            ->latest()
            ->limit(10)
            ->get([
                'id',
                'policy_type',
                'status',
                'input_payload',
                'output_payload',
                'error_message',
                'error_code',
                'final_output_payload',
                'policy_document_id',
                'prompt_version',
                'reviewed_at',
                'created_at',
            ])
            ->load(['sources.chunk.document:id,original_name']);

        return response()->json([
            'data' => $history,
        ]);
    }

    public function finalize(Request $request, PolicyAnalysis $policyAnalysis): JsonResponse
    {
        abort_if($policyAnalysis->user_id !== $request->user()->id, Response::HTTP_FORBIDDEN);

        $validated = $request->validate([
            'summary' => ['required', 'string'],
            'risk_analysis' => ['required', 'string'],
            'email' => ['required', 'string'],
        ]);

        $policyAnalysis->update([
            'final_output_payload' => $validated,
            'reviewed_at' => Carbon::now(),
        ]);

        return response()->json([
            'data' => [
                'id' => $policyAnalysis->id,
                'status' => $policyAnalysis->status,
                'final_output_payload' => $policyAnalysis->final_output_payload,
                'reviewed_at' => $policyAnalysis->reviewed_at,
            ],
            'message' => 'Final reviewed output saved successfully.',
        ]);
    }
}
