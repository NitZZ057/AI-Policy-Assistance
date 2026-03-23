<?php

namespace Tests\Feature;

use App\Models\PolicyAnalysis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PolicyAnalysisTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_generate_analysis_and_log_it(): void
    {
        $user = User::factory()->create([
            'api_token' => hash('sha256', 'valid-token'),
        ]);

        Http::fake([
            'https://api.openai.com/v1/responses' => Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'summary' => 'Commercial property coverage for a small office in Pune.',
                                    'risk_analysis' => 'Flood exposure is moderate and should be reviewed against deductible limits.',
                                    'email' => 'Hello, here is a quick overview of your policy and the main risk areas to review.',
                                ]),
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $response = $this
            ->withHeader('Authorization', 'Bearer valid-token')
            ->postJson('/api/policy/analyze', [
                'type' => 'Commercial Property',
                'coverage' => 'Building and contents up to $500,000',
                'location' => 'Pune',
                'risk' => 'Moderate flood risk',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('meta.status', 'completed');

        $this->assertDatabaseHas('policy_analyses', [
            'policy_type' => 'Commercial Property',
            'status' => 'completed',
            'user_id' => $user->id,
        ]);
    }

    public function test_policy_routes_require_authentication(): void
    {
        $response = $this->getJson('/api/policy/history');

        $response
            ->assertStatus(401)
            ->assertJsonPath('message', 'Authentication token is missing.');
    }

    public function test_user_only_sees_their_own_history(): void
    {
        $user = User::factory()->create([
            'api_token' => hash('sha256', 'owner-token'),
        ]);
        PolicyAnalysis::factory()->create(['user_id' => $user->id]);
        PolicyAnalysis::factory()->create();

        $response = $this
            ->withHeader('Authorization', 'Bearer owner-token')
            ->getJson('/api/policy/history');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_user_can_save_reviewed_output_for_their_own_analysis(): void
    {
        $user = User::factory()->create([
            'api_token' => hash('sha256', 'review-token'),
        ]);
        $analysis = PolicyAnalysis::factory()->create([
            'user_id' => $user->id,
            'final_output_payload' => null,
            'reviewed_at' => null,
        ]);

        $response = $this
            ->withHeader('Authorization', 'Bearer review-token')
            ->putJson("/api/policy/{$analysis->id}/finalize", [
                'summary' => 'Approved summary',
                'risk_analysis' => 'Approved risk analysis',
                'email' => 'Approved email',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $analysis->id)
            ->assertJsonPath('data.final_output_payload.summary', 'Approved summary');
    }
}
