import React, { useCallback, useEffect, useRef, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mic, Send, PhoneOff, VolumeX, Clock, X, Sparkles, User, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { normalizeImageUrl } from '@/lib/api';

type ChatMessage = {
  id: string;
  role: 'ai' | 'user';
  text: string;
  products?: Array<{
    id: number;
    title: string;
    price: number;
    currency: string;
    location?: string;
    image: string;
  }>;
};

const DEFAULT_CHAT_TITLE = '校物圈';

const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    createAiSession,
    sendAiSessionMessage,
    getAiSessionMessages,
    getAiHistory,
    deleteAiHistory,
    renameAiHistory,
  } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; updatedAt: string }>>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), role: 'ai', text: 'What are you looking for?' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'speaking'>('listening');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const callAiBtnRef = useRef<HTMLButtonElement | null>(null);
  const endCallBtnRef = useRef<HTMLButtonElement | null>(null);
  const [chatTitle, setChatTitle] = useState(DEFAULT_CHAT_TITLE);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, voiceOpen]);

  useEffect(() => {
    if (!voiceOpen) return;
    setMuted(false);
    setVoiceStatus('listening');
    const toSpeaking = setTimeout(() => setVoiceStatus('speaking'), 1500);
    return () => clearTimeout(toSpeaking);
  }, [voiceOpen]);

  useEffect(() => {
    if (!voiceOpen) return;
    // In UI-only mode, muting only affects status label, not behavior
    setVoiceStatus(muted ? 'speaking' : 'listening');
  }, [muted, voiceOpen]);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(m.matches);
    update();
    m.addEventListener?.('change', update);
    return () => m.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (voiceOpen) {
      // move focus into dialog
      endCallBtnRef.current?.focus();
    } else {
      // restore focus to Call AI button
      callAiBtnRef.current?.focus();
    }
  }, [voiceOpen]);

  const mapProducts = useCallback((value: unknown): ChatMessage['products'] => {
    if (!Array.isArray(value)) return undefined;
    const mapped = value
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;
        const maybeId = typeof record.id === 'number' ? record.id : Number(record.id);
        const id = Number.isFinite(maybeId) ? maybeId : index + 1;
        const title = typeof record.title === 'string' ? record.title : 'Untitled';
        const maybePrice = typeof record.price === 'number' ? record.price : Number(record.price);
        const price = Number.isFinite(maybePrice) ? maybePrice : 0;
        const currency = typeof record.currency === 'string' ? record.currency : 'CNY';
        const location = typeof record.location === 'string' ? record.location : undefined;
        const rawImage =
          (typeof record.image_thumbnail_url === 'string' && record.image_thumbnail_url) ||
          (typeof record.image_url === 'string' && record.image_url) ||
          (typeof record.image === 'string' && record.image) ||
          '';
        const image = rawImage ? normalizeImageUrl(rawImage) || rawImage : '';
        return { id, title, price, currency, location, image };
      })
      .filter((item): item is NonNullable<typeof item> => !!item);
    return mapped.length ? mapped : undefined;
  }, []);

  const mapStoredMessages = useCallback((value: unknown): ChatMessage[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;
        const roleRaw =
          typeof record.message_type === 'string'
            ? record.message_type
            : typeof record.role === 'string'
              ? record.role
              : 'assistant';
        const role: ChatMessage['role'] = roleRaw === 'user' ? 'user' : 'ai';
        const text =
          typeof record.content === 'string'
            ? record.content
            : typeof record.message === 'string'
              ? record.message
              : typeof record.response === 'string'
                ? record.response
                : '';
        return {
          id: typeof record.id === 'string' ? record.id : crypto.randomUUID(),
          role,
          text,
          products: mapProducts(record.products),
        };
      })
      .filter((item): item is ChatMessage => !!item);
  }, [mapProducts]);

  const createSession = useCallback(async (title?: string) => {
    if (!isAuthenticated) return null;
    setIsSessionLoading(true);
    try {
      const result = await createAiSession({ title: title || undefined });
      if (!result.session_id) throw new Error('Missing session id');
      const now = new Date().toLocaleString();
      setActiveSessionId(result.session_id);
      setConversations((prev) => {
        if (prev.some((item) => item.id === result.session_id)) return prev;
        return [{ id: result.session_id, title: title || DEFAULT_CHAT_TITLE, updatedAt: now }, ...prev];
      });
      return result.session_id;
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      toast({
        title: maybe?.message || 'Unable to start AI chat',
        description: Object.values(maybe?.errors || {})[0]?.[0] || 'Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSessionLoading(false);
    }
  }, [isAuthenticated, createAiSession]);

  const startNewChat = useCallback(async () => {
    setMessages([{ id: crypto.randomUUID(), role: 'ai', text: 'What are you looking for?' }]);
    setActiveSessionId(null);
    setChatTitle(DEFAULT_CHAT_TITLE);
    await createSession();
  }, [createSession]);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsSessionLoading(true);
    try {
      const result = await getAiHistory({ page: 1, page_size: 20, include_messages: false });
      const history = Array.isArray(result.history) ? result.history : [];
      const mappedConversations = history
        .map((item) => {
          const sessionId = typeof item.session_id === 'string' ? item.session_id : '';
          if (!sessionId) return null;
          const title = (item.title || '').trim() || 'Untitled chat';
          const updatedAt = item.updated_at
            ? new Date(item.updated_at).toLocaleString()
            : item.created_at
              ? new Date(item.created_at).toLocaleString()
              : new Date().toLocaleString();
          return { id: sessionId, title, updatedAt };
        })
        .filter((item): item is NonNullable<typeof item> => !!item);
      setConversations(mappedConversations);

      if (history.length > 0) {
        const first = history[0];
        const firstSessionId = typeof first.session_id === 'string' ? first.session_id : null;
        const firstTitle = (first.title || '').trim() || DEFAULT_CHAT_TITLE;
        setActiveSessionId(firstSessionId);
        setChatTitle(firstTitle);
        if (firstSessionId) {
          try {
            const details = await getAiSessionMessages(firstSessionId);
            const mappedMessages = mapStoredMessages(details.messages);
            setMessages(mappedMessages.length ? mappedMessages : [{ id: crypto.randomUUID(), role: 'ai', text: 'What are you looking for?' }]);
          } catch {
            setMessages([{ id: crypto.randomUUID(), role: 'ai', text: 'What are you looking for?' }]);
          }
        } else {
          setMessages([{ id: crypto.randomUUID(), role: 'ai', text: 'What are you looking for?' }]);
        }
        return;
      }

      await startNewChat();
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      toast({
        title: maybe?.message || 'Unable to load chat history',
        description: Object.values(maybe?.errors || {})[0]?.[0] || 'Please try again.',
        variant: 'destructive',
      });
      await startNewChat();
    } finally {
      setIsSessionLoading(false);
    }
  }, [getAiHistory, getAiSessionMessages, isAuthenticated, mapStoredMessages, startNewChat]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadHistory();
  }, [isAuthenticated, loadHistory]);

  useEffect(() => {
    if (!activeSessionId) {
      sessionStorage.removeItem('ai_active_session_id');
      return;
    }
    sessionStorage.setItem('ai_active_session_id', activeSessionId);
  }, [activeSessionId]);

  const handleOpenConversation = async (sessionId: string, title: string) => {
    if (!isAuthenticated) return;
    setActiveSessionId(sessionId);
    setChatTitle(title);
    setTyping(true);
    try {
      const result = await getAiSessionMessages(sessionId);
      const mapped = mapStoredMessages(result.messages);
      setMessages(mapped.length ? mapped : [{ id: crypto.randomUUID(), role: 'ai', text: 'What are you looking for?' }]);
      setConversations((prev) =>
        prev.map((item) => (item.id === sessionId ? { ...item, updatedAt: new Date().toLocaleString() } : item)),
      );
    } catch (error) {
      const maybe = error as { message?: string } | undefined;
      toast({
        title: maybe?.message || 'Unable to load messages',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTyping(false);
      setShowHistory(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending || isSessionLoading || !isAuthenticated) return;
    setIsSending(true);
    setTyping(true);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }]);
    setInput('');

    try {
      const sessionId = activeSessionId || (await createSession());
      if (!sessionId) throw new Error('Unable to create session');

      const result = await sendAiSessionMessage({
        session_id: sessionId,
        message: text,
        message_type: 'text',
      });
      const responseText = result.response || 'I could not generate a response.';
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'ai',
          text: responseText,
          products: mapProducts(result.products),
        },
      ]);
      setConversations((prev) => {
        const current = prev.find((item) => item.id === sessionId);
        const updatedAt = new Date().toLocaleString();
        if (!current) return [{ id: sessionId, title: DEFAULT_CHAT_TITLE, updatedAt }, ...prev];
        return prev.map((item) => (item.id === sessionId ? { ...item, updatedAt } : item));
      });
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'ai',
          text: maybe?.message || Object.values(maybe?.errors || {})[0]?.[0] || 'AI service unavailable.',
        },
      ]);
      toast({
        title: maybe?.message || 'Unable to send message',
        description: Object.values(maybe?.errors || {})[0]?.[0] || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTyping(false);
      setIsSending(false);
    }
  };

  const bubbleBase =
    'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm';
  const userBubble =
    'bg-gradient-to-br from-primary/10 to-primary/5 text-foreground';
  const aiBubble =
    'bg-card/80 text-foreground';
  const statusText = muted ? 'Muted' : (voiceStatus === 'listening' ? 'Listening...' : 'Speaking...');

  const handleRenameChat = () => {
    if (!activeSessionId) {
      toast({
        title: 'No active chat',
        description: 'Please open a chat session first.',
        variant: 'destructive',
      });
      return;
    }
    const next = window.prompt('Rename chat', chatTitle);
    if (next && next.trim()) {
      const title = next.trim();
      setIsSessionLoading(true);
      void (async () => {
        try {
          const result = await renameAiHistory({ session_id: activeSessionId, title });
          const resolvedTitle = (result.title || title).trim() || title;
          setChatTitle(resolvedTitle);
          setConversations((prev) =>
            prev.map((item) =>
              item.id === activeSessionId
                ? { ...item, title: resolvedTitle, updatedAt: new Date().toLocaleString() }
                : item,
            ),
          );
          toast({
            title: 'Chat renamed',
            description: result.message || 'Chat title updated successfully.',
          });
        } catch (error) {
          const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
          toast({
            title: maybe?.message || 'Unable to rename chat',
            description: Object.values(maybe?.errors || {})[0]?.[0] || 'Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsSessionLoading(false);
        }
      })();
    }
  };

  const handleClearConversation = () => {
    void startNewChat();
  };

  const handleExportConversation = () => {
    const payload = {
      title: chatTitle,
      messages,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `ai-chat-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteChat = async () => {
    if (!activeSessionId) {
      toast({
        title: 'No active chat',
        description: 'Please open a chat session first.',
        variant: 'destructive',
      });
      return;
    }

    const sessionId = activeSessionId;
    setIsSessionLoading(true);
    try {
      const result = await deleteAiHistory(sessionId);
      const remaining = conversations.filter((item) => item.id !== sessionId);
      setConversations(remaining);
      toast({
        title: 'Chat deleted',
        description: result.message || 'Chat history deleted successfully.',
      });

      if (remaining.length > 0) {
        await handleOpenConversation(remaining[0].id, remaining[0].title);
        return;
      }

      await startNewChat();
    } catch (error) {
      const maybe = error as { message?: string } | undefined;
      toast({
        title: maybe?.message || 'Unable to delete chat',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSessionLoading(false);
    }
  };

  return (
    <MainLayout showFooter={false}>
      <a href="#chat-main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground">
        Skip to chat
      </a>
      <div className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        <div className="absolute inset-0 flex">
          <aside className="hidden w-[300px] bg-card/70 p-4 backdrop-blur md:flex md:flex-col" aria-label="Chat history">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold tracking-wide">Chat History</div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full px-3 py-1 text-xs"
                disabled={isSessionLoading}
                onClick={() => {
                  void startNewChat();
                }}
              >
                New
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full rounded-xl bg-background p-3 text-left shadow-sm transition hover:bg-primary/5 flex items-start gap-3"
                  onClick={() => {
                    void handleOpenConversation(c.id, c.title);
                  }}
                  aria-label={`Open conversation: ${c.title}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{c.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{c.updatedAt}</div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col" role="main" id="chat-main" aria-label="AI Assistant chat">
            <div className="flex items-center gap-3 bg-card/70 p-3 backdrop-blur" role="region" aria-label="Chat header">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="text-base font-semibold tracking-tight">{chatTitle}</div>
                  <div className="text-xs text-muted-foreground">AI Assistant</div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full md:hidden"
                  onClick={() => setShowHistory(true)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  History
                </Button>
                <Button
                  type="button"
                  variant="default"
                  className="rounded-full"
                  onClick={() => navigate('/ai/voice', { state: { sessionId: activeSessionId } })}
                  ref={callAiBtnRef}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Call AI
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label="Chat settings">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onSelect={handleRenameChat} disabled={!activeSessionId || isSessionLoading}>
                      Rename chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowHistory(true)}>
                      Open history
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleExportConversation}>
                      Export conversation (JSON)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleClearConversation}>
                      Clear conversation
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={handleDeleteChat}
                      disabled={!activeSessionId || isSessionLoading}
                      className="text-destructive focus:text-destructive"
                    >
                      Delete chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div
              ref={containerRef}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4 sm:px-4"
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              aria-busy={isSending || typing}
            >
              {messages.map((m) => (
                <div key={m.id} className={m.role === 'ai' ? 'flex items-start gap-2' : 'flex items-start gap-2 justify-end'}>
                  {m.role === 'ai' ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/20 text-foreground order-2">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <div className={[bubbleBase, m.role === 'ai' ? aiBubble : userBubble, m.role === 'ai' ? '' : 'order-1'].join(' ')}>
                    {m.text != null ? (
                      <div className="whitespace-pre-line leading-relaxed">
                        {m.text}
                      </div>
                    ) : null}
                    {m.products && m.products.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {m.products.map((p) => (
                          <Card
                            key={p.id}
                            className="flex items-stretch gap-4 overflow-hidden rounded-2xl shadow-card"
                          >
                            <div className="relative aspect-square w-24 shrink-0 bg-muted">
                              <img
                                src={p.image}
                                alt={p.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex min-w-0 flex-1 items-center justify-between pr-3">
                              <div className="min-w-0 py-3">
                                <div className="truncate text-[13px] font-semibold">{p.title}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                  {p.currency} {p.price}{p.location ? ` · ${p.location}` : ''}
                                </div>
                              </div>
                              <Button asChild size="sm" className="h-8 rounded-lg" variant="secondary">
                                <a href={`/product/${p.id}`}>View Details</a>
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {typing ? (
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className={[bubbleBase, aiBubble].join(' ')} aria-live="polite">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs">AI is typing</span>
                      {!reducedMotion ? (
                        <span className="inline-flex gap-1">
                          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-200ms]" />
                          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-100ms]" />
                          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Composer returned to bottom, nudged upward slightly */}
            <div className="bg-card/70 p-3 backdrop-blur -mt-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about products or selling tips..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="h-11 rounded-full px-4"
                    aria-label="Message input"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-11 w-11 rounded-full"
                  onClick={() => navigate('/ai/voice', { state: { sessionId: activeSessionId } })}
                  aria-label="Call AI"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className="h-11 w-11 rounded-full"
                  onClick={handleSend}
                  aria-label="Send"
                  disabled={isSending || isSessionLoading || !isAuthenticated}
                >
                  {isSending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            
          </div>
        </div>

        {showHistory ? (
          <div className="fixed inset-0 z-40 bg-black/30 p-3 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile chat history">
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] rounded-r-2xl bg-card p-4 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Chat History</div>
                <Button size="icon" variant="outline" onClick={() => setShowHistory(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-h-0 max-h-[80vh] overflow-y-auto space-y-2 pr-1">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full rounded-xl bg-background p-3 text-left shadow-sm transition hover:bg-primary/5 flex items-start gap-3"
                    onClick={() => {
                      void handleOpenConversation(c.id, c.title);
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{c.updatedAt}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {voiceOpen ? (
          <div className="fixed inset-0 z-50 flex items-stretch bg-background" role="dialog" aria-modal="true" aria-label="AI Voice Assistant">
            <div className="flex w-full flex-col">
              <div className="sticky top-0 bg-card/80 backdrop-blur">
                <div className="flex items-center justify-between p-3">
                  <div className="text-base font-semibold">AI Voice Assistant</div>
                  <div className="text-xs text-muted-foreground">{statusText}</div>
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
                <div className="relative">
                  <div className="h-40 w-40 rounded-full bg-primary/10" />
                  {!reducedMotion ? (
                    <>
                      <div className="absolute inset-0 m-auto h-32 w-32 animate-ping rounded-full bg-primary/20" />
                      <div className="absolute inset-0 m-auto h-24 w-24 rounded-full bg-primary/30" />
                    </>
                  ) : null}
                  <div className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Mic className="h-7 w-7" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span>{statusText}</span>
                </div>
                <div className="w-full max-w-screen-sm rounded-xl bg-card/60 p-3 text-center text-sm text-foreground shadow-sm backdrop-blur">
                  <div className="min-h-[72px] whitespace-pre-wrap break-words">
                    Say something… (voice capture disabled in this UI-only version)
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-card/80 backdrop-blur">
                <div className="flex items-center justify-center gap-4 p-4">
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 rounded-full bg-red-600 text-white hover:bg-red-700"
                    onClick={() => setVoiceOpen(false)}
                    ref={endCallBtnRef}
                  >
                    <PhoneOff className="mr-2 h-5 w-5" />
                    End Call
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-12 rounded-full"
                    onClick={() => setMuted((v) => !v)}
                  >
                    <VolumeX className="mr-2 h-5 w-5" />
                    {muted ? 'Unmute' : 'Mute'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default AIAssistantPage;
