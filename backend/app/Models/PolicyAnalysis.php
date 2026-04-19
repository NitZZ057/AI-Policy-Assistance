<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PolicyAnalysis extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'policy_document_id',
        'policy_type',
        'prompt_version',
        'input_payload',
        'output_payload',
        'final_output_payload',
        'status',
        'error_message',
        'error_code',
        'reviewed_at',
    ];

    protected $casts = [
        'input_payload' => 'array',
        'output_payload' => 'array',
        'final_output_payload' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function document()
    {
        return $this->belongsTo(PolicyDocument::class, 'policy_document_id');
    }

    public function sources()
    {
        return $this->hasMany(AnalysisSource::class);
    }
}
