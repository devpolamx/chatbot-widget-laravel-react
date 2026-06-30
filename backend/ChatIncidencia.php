<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatIncidencia extends Model
{
    protected $fillable = ['user_id', 'mensaje_usuario', 'tipo_incidencia'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
