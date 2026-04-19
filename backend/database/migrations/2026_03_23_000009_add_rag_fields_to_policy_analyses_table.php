<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policy_analyses', function (Blueprint $table): void {
            $table->foreignId('policy_document_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->string('prompt_version')->default('v1')->after('policy_type');
        });
    }

    public function down(): void
    {
        Schema::table('policy_analyses', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('policy_document_id');
            $table->dropColumn('prompt_version');
        });
    }
};
