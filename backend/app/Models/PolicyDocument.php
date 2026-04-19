<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PolicyDocument extends Model
{
    protected $fillable = [
        'user_id',
        'original_name',
        'mime_type',
        'file_hash',
        'storage_path',
        'raw_text',
        'status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function chunks()
    {
        return $this->hasMany(DocumentChunk::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
