<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policy_documents', function (Blueprint $table): void {
            $table->string('file_hash', 64)->nullable()->after('mime_type');
            $table->unique(['user_id', 'file_hash']);
        });
    }

    public function down(): void
    {
        Schema::table('policy_documents', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'file_hash']);
            $table->dropColumn('file_hash');
        });
    }
};
