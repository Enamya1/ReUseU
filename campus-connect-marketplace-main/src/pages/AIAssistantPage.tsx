import React, { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mic, Send, PhoneOff, VolumeX, Clock, X, Sparkles, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ChatMessage = {
  id: string;
  role: 'ai' | 'user';
  text?: string;
  products?: Array<{
    id: number;
    title: string;
    price: number;
    currency: string;
    location?: string;
    image: string;
  }>;
};

const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; updatedAt: string }>>([
    { id: 'c1', title: 'Cheap laptop', updatedAt: 'Today 10:24' },
    { id: 'c2', title: 'Kitchen items', updatedAt: 'Yesterday 19:02' },
    { id: 'c3', title: 'Bicycle under 300', updatedAt: 'Mon 11:45' },
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm1', role: 'ai', text: 'What are you looking for?' },
    { id: 'm2', role: 'user', text: 'Cheap laptop' },
    {
      id: 'm3',
      role: 'ai',
      text: 'Here are some budget-friendly options near you.',
      products: [
        {
          id: 1,
          title: 'MacBook Air 2017',
          price: 2200,
          currency: 'CNY',
          location: 'Xinghai Residence',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',
        },
        {
          id: 10,
          title: 'Lenovo ThinkPad E14',
          price: 1800,
          currency: 'CNY',
          location: 'Maple Hall',
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
        },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'speaking'>('listening');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const callAiBtnRef = useRef<HTMLButtonElement | null>(null);
  const endCallBtnRef = useRef<HTMLButtonElement | null>(null);

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

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setIsSending(true);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setIsSending(false);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'ai',
          text: 'Got it. I will look for the best matches.',
        },
      ]);
    }, 900);
  };

  const bubbleBase =
    'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm';
  const userBubble =
    'bg-gradient-to-br from-primary/10 to-primary/5 text-foreground';
  const aiBubble =
    'bg-card/80 text-foreground';
  const statusText = muted ? 'Muted' : (voiceStatus === 'listening' ? 'Listening...' : 'Speaking...');

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
              <Button size="sm" variant="outline" className="rounded-full px-3 py-1 text-xs">New</Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full rounded-xl bg-background p-3 text-left shadow-sm transition hover:bg-primary/5 flex items-start gap-3"
                  onClick={() => {
                    setMessages([
                      { id: crypto.randomUUID(), role: 'ai', text: `Continuing: ${c.title}` },
                    ]);
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
                  <div className="text-base font-semibold tracking-tight">校物圈</div>
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
                  onClick={() => setVoiceOpen(true)}
                  ref={callAiBtnRef}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Call AI
                </Button>
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
                        {typeof m.text === 'string'
                          ? m.text
                          : (m.text as any)?.message
                          ? String((m.text as any).message)
                          : String(m.text)}
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
                  onClick={() => setVoiceOpen(true)}
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
                  disabled={isSending}
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
                      setMessages([{ id: crypto.randomUUID(), role: 'ai', text: `Continuing: ${c.title}` }]);
                      setShowHistory(false);
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
