<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_analyses', function (Blueprint $table) {
            $table->id();
            $table->string('policy_type');
            $table->json('input_payload');
            $table->json('output_payload')->nullable();
            $table->string('status')->default('pending');
            $table->text('error_message')->nullable();
            $table->string('error_code')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_analyses');
    }
};
