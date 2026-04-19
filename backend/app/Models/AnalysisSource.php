<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalysisSource extends Model
{
    protected $fillable = [
        'policy_analysis_id',
        'document_chunk_id',
        'score',
        'excerpt',
    ];

    protected $casts = [
        'score' => 'float',
    ];

    public function analysis()
    {
        return $this->belongsTo(PolicyAnalysis::class, 'policy_analysis_id');
    }

    public function chunk()
    {
        return $this->belongsTo(DocumentChunk::class, 'document_chunk_id');
    }
}
