import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Maximize2, Send, Sparkles, Trash2, X } from 'lucide-react';
import axios from 'axios';

interface ChatMessage {
    id?: number;
    role: 'user' | 'model';
    content: string;
}

/* ─── Inline Markdown renderer (compact, xs text) ─── */
function MarkdownLine({ text }: { text: string }) {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
        }
        if (match[2] !== undefined) {
            parts.push(<strong key={key++}>{match[2]}</strong>);
        } else if (match[3] !== undefined) {
            parts.push(<em key={key++}>{match[3]}</em>);
        } else if (match[4] !== undefined) {
            parts.push(
                <code key={key++} className="rounded bg-gray-200/70 px-1 font-mono text-[10px] dark:bg-zinc-700/70">
                    {match[4]}
                </code>,
            );
        }
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }
    return <>{parts}</>;
}

function MarkdownContent({ content }: { content: string }) {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.startsWith('```')) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <pre key={i} className="my-1 overflow-x-auto rounded bg-gray-800 p-2 text-[10px] text-gray-200">
                    <code>{codeLines.join('\n')}</code>
                </pre>,
            );
        } else if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
            const level = line.startsWith('### ') ? 4 : line.startsWith('## ') ? 3 : 2;
            const txt = line.slice(level);
            elements.push(
                <p key={i} className="mt-1.5 text-xs font-bold leading-snug">
                    <MarkdownLine text={txt} />
                </p>,
            );
        } else if (line.match(/^[\-\*]\s/)) {
            const items: string[] = [];
            while (i < lines.length && lines[i].match(/^[\-\*]\s/)) {
                items.push(lines[i].slice(2));
                i++;
            }
            elements.push(
                <ul key={i} className="my-1 list-disc space-y-0.5 pl-4">
                    {items.map((item, j) => (
                        <li key={j} className="text-xs leading-snug">
                            <MarkdownLine text={item} />
                        </li>
                    ))}
                </ul>,
            );
            continue;
        } else if (line.match(/^\d+\.\s/)) {
            const items: string[] = [];
            while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
                items.push(lines[i].replace(/^\d+\.\s/, ''));
                i++;
            }
            elements.push(
                <ol key={i} className="my-1 list-decimal space-y-0.5 pl-4">
                    {items.map((item, j) => (
                        <li key={j} className="text-xs leading-snug">
                            <MarkdownLine text={item} />
                        </li>
                    ))}
                </ol>,
            );
            continue;
        } else if (line === '') {
            elements.push(<div key={i} className="h-1" />);
        } else {
            elements.push(
                <p key={i} className="text-xs leading-relaxed">
                    <MarkdownLine text={line} />
                </p>,
            );
        }

        i++;
    }

    return <div>{elements}</div>;
}

/* ─── Typing indicator ─── */
function TypingBubble() {
    return (
        <div className="flex justify-start">
            <div className="mr-2 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4006A] to-[#9B00A0]">
                <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 dark:bg-zinc-800">
                <div className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                        <span
                            key={delay}
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500"
                            style={{ animationDelay: `${delay}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Main Widget ─── */
export default function FloatingChatWidget() {
    const { url } = usePage();

    const [isOpen, setIsOpen]           = useState(false);
    const [messages, setMessages]       = useState<ChatMessage[]>([]);
    const [input, setInput]             = useState('');
    const [isLoading, setIsLoading]     = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef       = useRef<HTMLInputElement>(null);

    // Hide on the dedicated chat page (configure route prefix as needed)
    if (url.startsWith('/chat')) return null;

    useEffect(() => {
        if (isOpen && !historyLoaded) {
            // Reemplazar 'api.chat.history' con tu ruta si no usas Ziggy
            axios
                .get(route('api.chat.history'))
                .then(res => setMessages(res.data.messages ?? []))
                .catch(() => {})
                .finally(() => setHistoryLoaded(true));
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
    }, [isOpen]);

    const sendMessage = async (text?: string) => {
        const msg = (text ?? input).trim();
        if (!msg || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setIsLoading(true);

        try {
            // Reemplazar 'api.chat.preguntar' con tu ruta si no usas Ziggy
            const res = await axios.post(route('api.chat.preguntar'), { message: msg });
            if (res.data.error) {
                setMessages(prev => [...prev, { role: 'model', content: `**Error:** ${res.data.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: res.data.message }]);
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.error || 'El asistente no está disponible. Intenta de nuevo.';
            setMessages(prev => [
                ...prev,
                { role: 'model', content: `_${errMsg}_` },
            ]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const clearHistory = async () => {
        if (!window.confirm('¿Borrar el historial de conversación?')) return;
        // Reemplazar 'api.chat.clear' con tu ruta si no usas Ziggy
        await axios.delete(route('api.chat.clear'));
        setMessages([]);
    };

    return (
        <>
            {/* Chat window */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 z-50 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-900/92"
                    style={{ height: '500px' }}
                >
                    {/* Header */}
                    <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-pink-900/20 bg-gradient-to-r from-[#D4006A] to-[#9B00A0] px-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-white/90" />
                            <span className="text-sm font-semibold text-white">Asistente Virtual</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={clearHistory}
                                className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                                title="Limpiar historial"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <Link
                                href={route('chat.index')}
                                className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                                title="Pantalla completa"
                            >
                                <Maximize2 className="h-3.5 w-3.5" />
                            </Link>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                                title="Cerrar"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-3 overflow-y-auto p-3">
                        {messages.length === 0 && !isLoading && (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <Sparkles className="mb-3 h-10 w-10 text-pink-200 dark:text-pink-900" />
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    ¡Hola! ¿En qué puedo ayudarte hoy?
                                </p>
                                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                    Pregúntame cualquier duda y con gusto te asesoraré.
                                </p>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.role === 'model' && (
                                    <div className="mr-2 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4006A] to-[#9B00A0]">
                                        <Sparkles className="h-3 w-3 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                                        m.role === 'user'
                                            ? 'rounded-tr-sm bg-gradient-to-r from-[#D4006A] to-[#9B00A0] text-white'
                                            : 'rounded-tl-sm bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-100'
                                    }`}
                                >
                                    <MarkdownContent content={m.content} />
                                </div>
                            </div>
                        ))}
                        {isLoading && <TypingBubble />}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            sendMessage();
                        }}
                        className="flex h-14 flex-shrink-0 items-center gap-2 border-t border-gray-100 bg-gray-50/50 px-3 dark:border-zinc-800 dark:bg-zinc-900/40"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Escribe tu mensaje..."
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 outline-none transition focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-pink-500"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#D4006A] to-[#9B00A0] text-white shadow-sm transition hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </button>
                    </form>
                </div>
            )}

            {/* Bubble Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#D4006A] to-[#9B00A0] text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
                >
                    <Sparkles className="h-6 w-6 animate-pulse" />
                </button>
            )}
        </>
    );
}
