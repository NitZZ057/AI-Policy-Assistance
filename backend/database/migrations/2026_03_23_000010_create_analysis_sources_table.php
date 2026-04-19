<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analysis_sources', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('policy_analysis_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_chunk_id')->constrained()->cascadeOnDelete();
            $table->decimal('score', 10, 8)->default(0);
            $table->text('excerpt');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analysis_sources');
    }
};
