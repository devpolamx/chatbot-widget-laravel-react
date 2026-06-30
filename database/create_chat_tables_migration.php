<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla para historial de chat
        Schema::create('chat_mensajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role'); // 'user' | 'model'
            $table->longText('content');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        // Tabla para auditoría de inyecciones / restricciones
        Schema::create('chat_incidencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('mensaje_usuario');
            $table->string('tipo_incidencia'); // 'jailbreak' | 'extraccion_datos' | 'generacion_restringida'
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('tipo_incidencia');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_incidencias');
        Schema::dropIfExists('chat_mensajes');
    }
};
