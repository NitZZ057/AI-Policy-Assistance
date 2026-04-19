<?php

namespace App\Services;

class PolicyAnalysisService
{
    public function __construct(private readonly PolicyAnalysisAgentService $agent)
    {
    }

    public function generate(array $policy, int $userId, ?int $documentId = null): array
    {
        return $this->agent->analyze($policy, $userId, $documentId);
    }
}
