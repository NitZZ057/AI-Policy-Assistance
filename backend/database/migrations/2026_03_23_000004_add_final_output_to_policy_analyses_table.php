<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policy_analyses', function (Blueprint $table) {
            $table->json('final_output_payload')->nullable()->after('output_payload');
            $table->timestamp('reviewed_at')->nullable()->after('error_code');
        });
    }

    public function down(): void
    {
        Schema::table('policy_analyses', function (Blueprint $table) {
            $table->dropColumn(['final_output_payload', 'reviewed_at']);
        });
    }
};
