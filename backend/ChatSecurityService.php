<?php

namespace App\Services;

class ChatSecurityService
{
    /**
     * Detects if a message is restricted (jailbreak, data extraction, or restricted generation).
     *
     * @param string $message
     * @return string|null The type of incidence, or null if legitimate.
     */
    public function detectarIncidencia(string $message): ?string
    {
        $msg = mb_strtolower($message, 'UTF-8');

        // 1. Jailbreak / Prompt Injection
        $jailbreak = [
            'ignora\s+(las|tus|todas\s+las|mis)\s+instrucciones',
            'olvida\s+(todo|lo\s+anterior|tus\s+instrucciones)',
            'olvida\s+qui[eé]n\s+eres',
            'act[uú]a\s+como\s+\w',
            'eres\s+ahora\s+\w',
            'you\s+are\s+now',
            'from\s+now\s+on',
            'pretend\s+(you\s+are|to\s+be)',
            '\bsystem\s*prompt\b',
            '\bjailbreak\b',
            '\bdan\s+mode\b',
            'modo\s+(sin\s+restricciones|libre|desarrollador|sin\s+censura|hack)',
            'sin\s+(restricciones|filtros|l[ií]mites)\s+(ahora|eres|act[uú]a|responde)',
            'nueva\s+(instrucci[oó]n|personalidad|identidad|directiva)',
            'ignora\s+(todo|tus\s+reglas)',
            'haz\s+como\s+que\s+(eres|no\s+tienes)',
            'desactiva\s+(tus\s+)?(filtros|restricciones|reglas)',
        ];

        foreach ($jailbreak as $pattern) {
            if (preg_match('/' . $pattern . '/iu', $msg)) {
                return 'jailbreak';
            }
        }

        // 2. Data Extraction / SQL injection
        $datosPatterns = [
            '\bselect\b.{0,40}\bfrom\b',
            '\bdrop\s+table\b',
            '\binsert\s+into\b',
            '\bdelete\s+from\b',
            '\bupdate\b.{0,30}\bset\b',
            '\bshow\s+tables?\b',
            '\binformation_schema\b',
            'sql\s+injection',
            'inyecci[oó]n\s+sql',
            '(contrase[nñ]a|password|token|api.?key)\s+de\s+(sistema|admin|plataforma)',
            '(mostrar|listar|dame|ver|obtener)\s+(todos?\s+los\s+)?(usuarios|correos|emails|tokens)',
            'datos\s+de\s+(otros\s+)?usuarios',
        ];

        foreach ($datosPatterns as $pattern) {
            if (preg_match('/' . $pattern . '/iu', $msg)) {
                return 'extraccion_datos';
            }
        }

        // 3a. Restricted Generation — explicit markers
        $completaPatterns = [
            'planeaci[oó]n\s+(did[aá]ctica\s+)?completa',
            'examen\s+completo',
            'secuencia\s+(did[aá]ctica\s+)?completa',
            'proyecto\s+(escolar\s+)?completo',
            'plan\s+de\s+clases?\s+completo',
            'actividades?\s+completas?\s+(para|de)\b',
            'todas\s+las\s+(sesiones|actividades)\s+de\s+(un\s+)?(proyecto|planeaci[oó]n)',
        ];

        foreach ($completaPatterns as $pattern) {
            if (preg_match('/' . $pattern . '/iu', $msg)) {
                return 'generacion_restringida';
            }
        }

        // 3b. Restricted Generation — verb + noun command without qualifiers
        $hasQualifier = (bool) preg_match(
            '/\b(idea|ideas|ejemplo|ejemplos|sugerencia|sugerencias|consejo|consejos|orientaci[oó]n|breve|corto|r[aá]pido|c[oó]mo|qu[eé]|cu[aá]les?|tip|tips|estrategia|estrategias|ayuda|din[aá]micas?|ejercicio\s+breve)\b/iu',
            $msg,
        );

        if (! $hasQualifier) {
            $verbos      = '(crea|genera|haz|hazme|dame|quiero|necesito|elabora|desarrolla|dise[nñ]a|prepara|redacta|escr[ií]beme|realiza|prop[oó]rciona|produc[ae])';
            $sustantivos = '(planeaci[oó]n|plan\s+de\s+clase|examen|prueba\s+de\s+conocimientos|secuencia\s+did[aá]ctica|proyecto\s+escolar)';

            if (preg_match('/' . $verbos . '\b.{0,120}\b' . $sustantivos . '/iu', $msg) ||
                preg_match('/' . $sustantivos . '\b.{0,60}\b' . $verbos . '/iu', $msg)) {
                return 'generacion_restringida';
            }
        }

        return null;
    }

    /**
     * Builds a warning message for safety incidences.
     *
     * @param string $tipo
     * @param int $count
     * @return string
     */
    public function buildWarningMessage(string $tipo, int $count): string
    {
        if ($tipo === 'jailbreak') {
            return "Solo puedo ayudarte con temas relacionados con la educación y la planeación didáctica.";
        }
        if ($tipo === 'extraccion_datos') {
            return "Lo siento, no tengo acceso a información del sistema o base de datos.";
        }
        if ($tipo === 'generacion_restringida') {
            return "Mi función es orientarte y darte ideas creativas. Para generar planeaciones, actividades y exámenes completos estructurados, utiliza las herramientas dedicadas en el menú principal.";
        }
        return "Mensaje restringido por políticas de seguridad.";
    }
}
