<?php

namespace App\Http\Controllers;

use App\Models\PolicyAnalysis;
use App\Services\PolicyAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class PolicyController extends Controller
{
    public function __construct(
        private readonly PolicyAnalysisService $policyAnalysisService
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
        ]);

        $analysis = PolicyAnalysis::create([
            'user_id' => $user->id,
            'policy_type' => $validated['type'],
            'input_payload' => $validated,
            'status' => 'pending',
        ]);

        $result = $this->policyAnalysisService->generate($validated);

        if ($result['ok']) {
            $analysis->update([
                'status' => 'completed',
                'output_payload' => $result['data'],
                'error_message' => null,
                'error_code' => null,
            ]);

            return response()->json([
                'result' => $result['data'],
                'meta' => [
                    'analysis_id' => $analysis->id,
                    'status' => $analysis->status,
                    'attempts' => $result['attempts'],
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
            'meta' => [
                'analysis_id' => $analysis->id,
                'status' => $analysis->status,
                'attempts' => $result['attempts'],
                'error_code' => $result['code'],
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
                'reviewed_at',
                'created_at',
            ]);

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
