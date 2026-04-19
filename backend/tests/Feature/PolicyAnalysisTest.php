<?php

namespace Tests\Feature;

use App\Models\PolicyAnalysis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
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

    public function test_user_can_upload_text_document_and_generate_grounded_analysis_with_sources(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'api_token' => hash('sha256', 'rag-token'),
        ]);

        Http::fake([
            'https://api.openai.com/v1/embeddings' => Http::response([
                'data' => [
                    [
                        'embedding' => [1.0, 0.0, 0.0],
                    ],
                ],
            ]),
            'https://api.openai.com/v1/responses' => Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'summary' => 'The policy document confirms flood exclusions need manual review.',
                                    'risk_analysis' => 'Flood exposure is the primary risk because the uploaded document limits water damage coverage.',
                                    'email' => 'Hello, we reviewed the document and recommend checking the flood exclusion language.',
                                ]),
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $documentResponse = $this
            ->withHeader('Authorization', 'Bearer rag-token')
            ->post('/api/documents', [
                'document' => UploadedFile::fake()->createWithContent(
                    'policy.txt',
                    str_repeat('Flood exclusion applies unless the insured purchases a separate endorsement. ', 40)
                ),
            ]);

        $documentResponse
            ->assertCreated()
            ->assertJsonPath('data.status', 'ready');

        $documentId = $documentResponse->json('data.id');

        $analysisResponse = $this
            ->withHeader('Authorization', 'Bearer rag-token')
            ->postJson('/api/policy/analyze', [
                'type' => 'Commercial Property',
                'coverage' => 'Building and contents up to $500,000',
                'location' => 'Pune',
                'risk' => 'Flood risk',
                'document_id' => $documentId,
            ]);

        $analysisResponse
            ->assertOk()
            ->assertJsonPath('meta.status', 'completed')
            ->assertJsonStructure([
                'references' => [
                    '*' => ['document', 'section', 'score'],
                ],
            ]);

        $this->assertNotEmpty($analysisResponse->json('references'));

        $this->assertDatabaseHas('analysis_sources', [
            'policy_analysis_id' => $analysisResponse->json('meta.analysis_id'),
        ]);
    }

    public function test_duplicate_document_upload_returns_existing_document(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'api_token' => hash('sha256', 'duplicate-token'),
        ]);

        Http::fake([
            'https://api.openai.com/v1/embeddings' => Http::response([
                'data' => [
                    [
                        'embedding' => [1.0, 0.0, 0.0],
                    ],
                ],
            ]),
        ]);

        $content = str_repeat('Flood exclusion applies unless endorsed. ', 40);

        $firstResponse = $this
            ->withHeader('Authorization', 'Bearer duplicate-token')
            ->post('/api/document/upload', [
                'document' => UploadedFile::fake()->createWithContent('policy.txt', $content),
            ]);

        $secondResponse = $this
            ->withHeader('Authorization', 'Bearer duplicate-token')
            ->post('/api/document/upload', [
                'document' => UploadedFile::fake()->createWithContent('policy-copy.txt', $content),
            ]);

        $firstResponse->assertCreated();

        $secondResponse
            ->assertOk()
            ->assertJsonPath('duplicate', true)
            ->assertJsonPath('data.id', $firstResponse->json('data.id'));

        $this->assertDatabaseCount('policy_documents', 1);
    }

    public function test_user_can_ask_document_question_without_raw_chunks_in_response(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'api_token' => hash('sha256', 'qa-token'),
        ]);

        Http::fake([
            'https://api.openai.com/v1/embeddings' => Http::response([
                'data' => [
                    [
                        'embedding' => [1.0, 0.0, 0.0],
                    ],
                ],
            ]),
            'https://api.openai.com/v1/responses' => Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => 'The selected policy requires a separate endorsement for flood coverage.',
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $documentResponse = $this
            ->withHeader('Authorization', 'Bearer qa-token')
            ->post('/api/document/upload', [
                'document' => UploadedFile::fake()->createWithContent(
                    'policy.txt',
                    str_repeat('Flood exclusion applies unless the insured purchases a separate endorsement. ', 40)
                ),
            ]);

        $queryResponse = $this
            ->withHeader('Authorization', 'Bearer qa-token')
            ->postJson('/api/document/query', [
                'document_id' => $documentResponse->json('data.id'),
                'question' => 'Is flood covered?',
            ]);

        $queryResponse
            ->assertOk()
            ->assertJsonPath('answer', 'The selected policy requires a separate endorsement for flood coverage.')
            ->assertJsonStructure([
                'references' => [
                    '*' => ['document', 'section', 'score'],
                ],
            ])
            ->assertJsonMissing(['content' => 'Flood exclusion applies unless the insured purchases a separate endorsement.']);
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
