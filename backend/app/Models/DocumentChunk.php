<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentChunk extends Model
{
    protected $fillable = [
        'policy_document_id',
        'chunk_index',
        'content',
        'embedding',
        'token_count',
        'metadata',
    ];

    protected $casts = [
        'embedding' => 'array',
        'metadata' => 'array',
    ];

    public function document()
    {
        return $this->belongsTo(PolicyDocument::class, 'policy_document_id');
    }

    public function sources()
    {
        return $this->hasMany(AnalysisSource::class);
    }
}
