# 🚀 Laravel + React AI Chatbot Widget (Gemini API)

Este repositorio contiene un paquete completo, listo para producción, para integrar un **Chatbot de Inteligencia Artificial Flotante** en aplicaciones que utilicen **Laravel** en el backend y **React (con Inertia.js y Tailwind CSS)** en el frontend.

El sistema está optimizado para conectarse de manera fluida con la API de **Google Gemini** (usando por defecto `gemini-2.5-flash`) y cuenta con características avanzadas de persistencia de datos y seguridad preventiva en tiempo real.

## Instalar

```bash
git clone https://github.com/devpolamx/chatbot-widget-laravel-react.git
```

---

## ☕ Apóyame

Si este proyecto te fue útil y quieres apoyar mi trabajo:

- ❤️ GitHub Sponsors: https://github.com/sponsors/devpolamx
- ☕ Invítame un café: https://www.paypal.me/poladevmx

---

## 🌟 Características Clave

- 💬 **Widget Flotante Premium**: Interfaz moderna con animaciones fluidas, indicador de escritura ("typing indicator") y modo oscuro integrado.
- 🧠 **Motor de IA (Google Gemini)**: Conexión optimizada con la API oficial de Gemini para respuestas rápidas y contextuales.
- 🛡️ **Seguridad y Prevención de Abusos**: Servicio `ChatSecurityService` integrado que intercepta el mensaje del usuario antes de enviarlo a la API para detectar:
  - Intentos de _Jailbreak_ o alteración de instrucciones del sistema.
  - Intentos de extracción de datos o _Inyección SQL_.
  - Generación de contenido restringido o pesado.
- 💾 **Historial de Conversación Persistente**: Los mensajes se guardan en base de datos y se limitan de forma inteligente para proveer el contexto correcto a la IA sin exceder límites de tokens.
- 📋 **Auditoría de Incidencias**: Registro automático de intentos de vulneración en la tabla `chat_incidencias` para auditoría y posible baneo de usuarios malintencionados.
- 📝 **Renderizador de Markdown Nativo**: El frontend interpreta y formatea negritas, cursivas, listas ordenadas/desordenadas y bloques de código de forma nativa sin añadir librerías externas pesadas.

---

## 📂 Estructura del Paquete

El paquete está diseñado para ser copiado directamente en la estructura de directorios estándar de un proyecto Laravel + React (Inertia):

```text
├── database/
│   └── create_chat_tables_migration.php  # Migración para base de datos (mensajes e incidencias)
├── backend/
│   ├── ChatController.php               # Controlador principal de la API del chat
│   ├── ChatSecurityService.php          # Lógica de detección de prompt injections y abusos
│   ├── ChatMensaje.php                  # Modelo Eloquent para el historial de mensajes
│   └── ChatIncidencia.php               # Modelo Eloquent para el registro de auditoría de seguridad
└── frontend/
    └── FloatingChatWidget.tsx           # Componente React (Tailwind CSS + Lucide Icons + Axios)
```

---

## ⚙️ Requisitos Previos

Asegúrate de contar con los siguientes elementos antes de comenzar con la integración:

- **Backend**: Laravel 10.x o superior.
- **Frontend**: React 18.x, Tailwind CSS v3 o superior.
- **Dependencias NPM**: `lucide-react`, `axios`, `@inertiajs/react`.
- **Credenciales**: Una clave de API de **Google Gemini** (puedes obtener una gratis en [Google AI Studio](https://aistudio.google.com/)).

---

## 🚀 Guía de Integración Paso a Paso

### Paso 1: Migración de la Base de Datos

1. En tu proyecto Laravel, crea una nueva migración ejecutando:
   ```bash
   php artisan make:migration create_chat_tables
   ```
2. Abre el archivo de migración creado en `database/migrations/` y reemplaza todo su contenido con el código de [create_chat_tables_migration.php](file:///d:/www/chatbot-widget-ia/database/create_chat_tables_migration.php).
3. Corre la migración para crear las tablas `chat_mensajes` y `chat_incidencias`:
   ```bash
   php artisan migrate
   ```

### Paso 2: Copiar Modelos y Servicios del Backend

1. Copia los modelos Eloquent a tu carpeta de modelos de Laravel:
   - Copia `backend/ChatMensaje.php` a [app/Models/ChatMensaje.php](file:///d:/www/chatbot-widget-ia/backend/ChatMensaje.php)
   - Copia `backend/ChatIncidencia.php` a [app/Models/ChatIncidencia.php](file:///d:/www/chatbot-widget-ia/backend/ChatIncidencia.php)
2. Copia el servicio de seguridad a tu carpeta de servicios:
   - Copia `backend/ChatSecurityService.php` a [app/Services/ChatSecurityService.php](file:///d:/www/chatbot-widget-ia/backend/ChatSecurityService.php) (Si no tienes el directorio `app/Services`, créalo).

### Paso 3: Configurar Credenciales en tu archivo `.env`

Añade las siguientes variables al final de tu archivo `.env` en la raíz de tu proyecto Laravel:

```env
GEMINI_API_KEY="TU_CLAVE_API_DE_GEMINI"
GEMINI_API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
```

A continuación, puedes registrar estas variables de configuración en tu archivo `config/services.php` o crear un archivo de configuración dedicado en `config/gemini.php`:

```php
// config/gemini.php
return [
    'api_key' => env('GEMINI_API_KEY'),
    'api_url' => env('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'),
];
```

### Paso 4: Agregar el Controlador de Laravel

1. Copia `backend/ChatController.php` a [app/Http/Controllers/ChatController.php](file:///d:/www/chatbot-widget-ia/backend/ChatController.php).
2. Modifica el espacio de nombres (`namespace`) y los _imports_ si la estructura de tu proyecto difiere del estándar.

### Paso 5: Registrar las Rutas del Chat

Añade las siguientes rutas a tu archivo de rutas de Laravel (usualmente `routes/web.php` si utilizas Inertia, o `routes/api.php` si la autenticación se gestiona de otra forma):

```php
use App\Http\Controllers\ChatController;

Route::middleware(['auth'])->group(function () {
    // API del chatbot flotante
    Route::get('/api/chat/history',    [ChatController::class, 'getHistory'])->name('api.chat.history');
    Route::post('/api/chat/preguntar',  [ChatController::class, 'preguntar'])->name('api.chat.preguntar');
    Route::delete('/api/chat/clear',   [ChatController::class, 'clearHistory'])->name('api.chat.clear');

    // Ruta de chat de pantalla completa (opcional)
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
});
```

> [!NOTE]
> Por defecto, el componente frontend asume que estás usando **Ziggy** en Laravel para resolver rutas dinámicamente con `route()`. Si no utilizas Ziggy, puedes reemplazar las llamadas a `route('api.chat.*')` por strings estáticos (ej. `"/api/chat/history"`) en el archivo del widget frontend.

### Paso 6: Configurar y Renderizar el Widget en React

1. Instala las dependencias necesarias en tu proyecto frontend:
   ```bash
   npm install lucide-react axios @inertiajs/react
   ```
2. Copia el componente `frontend/FloatingChatWidget.tsx` a tu directorio de componentes, por ejemplo en `resources/js/Components/FloatingChatWidget.tsx`.
3. Importa y renderiza el widget dentro de tu Layout principal (ej. `AuthenticatedLayout.tsx` o similar) para que esté visible en todo el sistema:

```tsx
import FloatingChatWidget from "@/Components/FloatingChatWidget";

export default function AuthenticatedLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900">
      {/* ... contenido principal de tu aplicación ... */}
      <main>{children}</main>

      {/* Widget del Chatbot IA */}
      <FloatingChatWidget />
    </div>
  );
}
```

---

## 🛠️ Opciones de Personalización

### 1. Cambiar las Instrucciones del Sistema (System Instructions)

Puedes modificar el comportamiento de la IA cambiando la constante `SYSTEM_INSTRUCTION` al inicio de [ChatController.php](file:///d:/www/chatbot-widget-ia/backend/ChatController.php#L18-L23):

```php
private const SYSTEM_INSTRUCTION = <<<'INST'
Eres un Asistente Virtual experto en desarrollo web y soporte técnico.
Responde de forma clara, amigable y proporciona ejemplos de código cuando sea posible.
INST;
```

### 2. Modificar Reglas de Seguridad

El archivo [ChatSecurityService.php](file:///d:/www/chatbot-widget-ia/backend/ChatSecurityService.php) contiene expresiones regulares para filtrar comportamientos. Si deseas flexibilizar o endurecer las restricciones de entrada de los usuarios, edita los arrays en dicho archivo:

- `$jailbreak`: Para prevenir inyecciones de prompts ("olvida tus instrucciones", "actúa como...", etc.).
- `$datosPatterns`: Filtros básicos de prevención de inyección SQL y acceso a tablas internas del sistema.

### 3. Personalizar la Estética del Widget

El widget tiene estilos basados en Tailwind CSS y utiliza un degradado de rosa a violeta (`bg-gradient-to-r from-[#D4006A] to-[#9B00A0]`). Puedes adaptar fácilmente los colores editando las clases de Tailwind en [FloatingChatWidget.tsx](file:///d:/www/chatbot-widget-ia/frontend/FloatingChatWidget.tsx) para que coincidan con la paleta de colores de tu marca.

---

## 🛡️ Seguridad y Auditoría

Cada vez que un usuario ingresa una frase catalogada como sospechosa por `ChatSecurityService`, la aplicación realiza el siguiente flujo:

1. Bloquea el envío a la API de Gemini para ahorrar tokens y proteger el sistema.
2. Registra la incidencia en la tabla `chat_incidencias` almacenando el ID del usuario, el texto ofensivo o sospechoso y el tipo de violación (`jailbreak`, `extraccion_datos`, `generacion_restringida`).
3. Retorna un mensaje de advertencia amigable al usuario en la interfaz del chat.

Esto te permite monitorear de cerca el uso del chatbot y detectar intentos maliciosos desde tu panel de administración.

---

## ☕ Apoya este Proyecto

Si este paquete te ha sido útil y te ha ayudado a ahorrar tiempo de desarrollo, considera apoyar su mantenimiento continuo. ¡Cualquier contribución es muy apreciada!

## ☕ Apóyame

Si este proyecto te fue útil y quieres apoyar mi trabajo:

- ❤️ GitHub Sponsors: https://github.com/sponsors/devpolamx
- ☕ Invítame un café: https://www.paypal.me/poladevmx

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de clonarlo, modificarlo y usarlo de manera personal o comercial. ¡Las contribuciones son bienvenidas!
