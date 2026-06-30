<?php

namespace App\Http\Controllers;

use App\Models\ChatIncidencia;
use App\Models\ChatMensaje;
use App\Services\ChatSecurityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    private const SYSTEM_INSTRUCTION = <<<'INST'
Eres un Asistente Virtual inteligente, servicial y experto.
Ayuda al usuario a resolver dudas generales, proporcionar explicaciones claras y sugerencias útiles.

FORMATO: Usa Markdown para estructurar respuestas (listas, negritas, secciones). Sé conciso y profesional. Responde siempre en español.
INST;

    public function index(): Response
    {
        abort_unless(Auth::check(), 401);

        // Retorna la vista Inertia correspondiente a la pantalla completa de chat
        return Inertia::render('Chat/Index');
    }

    public function getHistory(): JsonResponse
    {
        abort_unless(Auth::check(), 401);

        $messages = ChatMensaje::where('user_id', Auth::id())
            ->orderBy('created_at', 'asc')
            ->limit(50)
            ->get()
            ->map(fn(ChatMensaje $m) => [
                'id'         => $m->id,
                'role'       => $m->role,
                'content'    => $m->content,
                'created_at' => $m->created_at->toIso8601String(),
            ]);

        return response()->json(['messages' => $messages]);
    }

    public function clearHistory(): JsonResponse
    {
        abort_unless(Auth::check(), 401);

        ChatMensaje::where('user_id', Auth::id())->delete();

        return response()->json(['success' => true]);
    }

    public function preguntar(Request $request, ChatSecurityService $securityService): JsonResponse
    {
        abort_unless(Auth::check(), 401);

        $request->validate(['message' => 'required|string|max:4000']);

        $user = Auth::user();
        $userId  = Auth::id();
        $message = trim($request->input('message'));

        /* 
         * ── Opcional: Validación de límites de suscripción/tokens ──
         * Si tu proyecto tiene límites por usuario, impleméntalo aquí.
         */

        // Intercepta contenido restringido (prompt injections) antes de llamar a la API
        $tipoIncidencia = $securityService->detectarIncidencia($message);

        if ($tipoIncidencia !== null) {
            $prevCount = ChatIncidencia::where('user_id', $userId)->count();

            ChatIncidencia::create([
                'user_id'          => $userId,
                'mensaje_usuario'  => $message,
                'tipo_incidencia'  => $tipoIncidencia,
            ]);

            $warning = $securityService->buildWarningMessage($tipoIncidencia, $prevCount + 1);

            ChatMensaje::create(['user_id' => $userId, 'role' => 'user',  'content' => $message]);
            ChatMensaje::create(['user_id' => $userId, 'role' => 'model', 'content' => $warning]);

            return response()->json(['message' => $warning, 'incidencia' => $tipoIncidencia]);
        }

        // Construir historial de mensajes (últimos 19 intercambios)
        $history = ChatMensaje::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(19)
            ->get()
            ->reverse()
            ->values();

        $contents = $history->map(fn(ChatMensaje $m) => [
            'role'  => $m->role,
            'parts' => [['text' => $m->content]],
        ])->toArray();

        // Agregar el mensaje actual del usuario
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

        $apiKey = config('gemini.api_key') ?? config('services.gemini.api_key');
        $apiUrl = config('gemini.api_url') ?? config('services.gemini.api_url');

        try {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->timeout(60)
                ->post("{$apiUrl}?key={$apiKey}", [
                    'systemInstruction' => [
                        'parts' => [['text' => self::SYSTEM_INSTRUCTION]],
                    ],
                    'contents'         => $contents,
                    'generationConfig' => [
                        'temperature'     => 0.8,
                        'maxOutputTokens' => 2048,
                    ],
                ]);

            $response->throw();

            $responseText = $response->json('candidates.0.content.parts.0.text', '');

            if (empty(trim($responseText))) {
                throw new \Exception('Respuesta vacía del asistente de IA.');
            }

            // Persistir mensajes en base de datos al tener éxito
            ChatMensaje::create(['user_id' => $userId, 'role' => 'user',  'content' => $message]);
            ChatMensaje::create(['user_id' => $userId, 'role' => 'model', 'content' => $responseText]);

            return response()->json(['message' => $responseText]);
        } catch (\Throwable $e) {
            Log::error('ChatController@preguntar', ['error' => $e->getMessage()]);

            return response()->json(
                ['error' => 'El asistente no está disponible en este momento. Intenta de nuevo.'],
                500,
            );
        }
    }
}
