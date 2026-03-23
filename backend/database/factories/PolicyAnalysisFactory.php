<?php

namespace Database\Factories;

use App\Models\PolicyAnalysis;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PolicyAnalysis>
 */
class PolicyAnalysisFactory extends Factory
{
    protected $model = PolicyAnalysis::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'policy_type' => $this->faker->randomElement(['Commercial Property', 'Health', 'Auto']),
            'input_payload' => [
                'type' => 'Commercial Property',
                'coverage' => 'Building and contents up to $500,000',
                'location' => $this->faker->city(),
                'risk' => 'Moderate flood risk',
            ],
            'output_payload' => [
                'summary' => 'AI generated summary',
                'risk_analysis' => 'AI generated risk analysis',
                'email' => 'AI generated email',
            ],
            'final_output_payload' => null,
            'status' => 'completed',
            'error_message' => null,
            'error_code' => null,
            'reviewed_at' => null,
        ];
    }
}
