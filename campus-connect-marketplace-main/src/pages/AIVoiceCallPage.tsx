import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mic, PhoneOff, VolumeX, Volume2, Languages } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeImageUrl } from '@/lib/api';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: '🇵🇹' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'th-TH', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id-ID', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
  { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da-DK', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi-FI', name: 'Finnish', flag: '🇫🇮' },
  { code: 'no-NO', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'cs-CZ', name: 'Czech', flag: '🇨🇿' },
  { code: 'el-GR', name: 'Greek', flag: '🇬🇷' },
  { code: 'he-IL', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'ro-RO', name: 'Romanian', flag: '🇷🇴' },
  { code: 'uk-UA', name: 'Ukrainian', flag: '🇺🇦' },
];

type ProductCardItem = {
  id: number;
  title: string;
  price: number;
  currency: string;
  location?: string;
  image: string;
};

type TtsProvider = 'kokoro' | 'system';

type KokoroInstance = {
  voices: Record<string, { name?: string; language?: string }>;
  generate: (text: string, options?: { voice?: string; speed?: number }) => Promise<{ toBlob: () => Blob }>;
};

const getKokoroLanguageGroup = (langCode: string): 'en' | 'zh' | 'other' => {
  const normalized = langCode.toLowerCase();
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('en')) return 'en';
  return 'other';
};

const getDefaultKokoroVoice = (langCode: string, voiceIds: string[]): string => {
  const languageGroup = getKokoroLanguageGroup(langCode);
  if (languageGroup === 'zh') {
    if (voiceIds.includes('zf_xiaobei')) return 'zf_xiaobei';
    if (voiceIds.includes('zf_xiaoni')) return 'zf_xiaoni';
    if (voiceIds.includes('zm_yunjian')) return 'zm_yunjian';
  }
  if (languageGroup === 'en') {
    if (voiceIds.includes('af_heart')) return 'af_heart';
    if (voiceIds.includes('af_bella')) return 'af_bella';
    if (voiceIds.includes('bf_emma')) return 'bf_emma';
  }
  return voiceIds[0] || 'af_heart';
};

const getPreferredSystemVoiceId = (voices: SpeechSynthesisVoice[]): string | null => {
  if (!voices.length) return null;
  const byPriority = [
    (voice: SpeechSynthesisVoice) =>
      voice.lang.toLowerCase() === 'en-us' &&
      voice.name.toLowerCase().includes('google us english'),
    (voice: SpeechSynthesisVoice) =>
      voice.lang.toLowerCase() === 'en-us' &&
      voice.name.toLowerCase().includes('google') &&
      voice.name.toLowerCase().includes('english'),
    (voice: SpeechSynthesisVoice) =>
      voice.lang.toLowerCase() === 'en-us' &&
      voice.name.toLowerCase().includes('google'),
    (voice: SpeechSynthesisVoice) =>
      voice.lang.toLowerCase() === 'en-us' &&
      voice.default,
    (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase() === 'en-us',
    (voice: SpeechSynthesisVoice) =>
      voice.name.toLowerCase().includes('google') &&
      voice.name.toLowerCase().includes('english'),
  ];
  for (const selector of byPriority) {
    const match = voices.find(selector);
    if (match?.voiceURI) return match.voiceURI;
  }
  return null;
};

const SILENCE_SLEEP_MS = 7000;
const WAKE_THRESHOLD = 0.045;
const WAKE_FRAMES_REQUIRED = 5;
const RESTART_DELAY_MS = 180;

const AIVoiceCallPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, createAiSession, sendAiVoiceCallMessage } = useAuth();
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<'inactive' | 'listening' | 'speaking' | 'processing'>('listening');
  const [transcript, setTranscript] = useState('Connecting voice session...');
  const [isListening, setIsListening] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isWindowVisible, setIsWindowVisible] = useState(() => document.visibilityState === 'visible');
  const [language, setLanguage] = useState('en-US');
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>('system');
  const [systemVoiceId, setSystemVoiceId] = useState('auto');
  const [kokoroVoiceId, setKokoroVoiceId] = useState('auto');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [kokoroVoices, setKokoroVoices] = useState<Array<{ id: string; name: string; language: string }>>([]);
  const [kokoroLoading, setKokoroLoading] = useState(false);
  const [isKokoroReady, setIsKokoroReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [voiceProducts, setVoiceProducts] = useState<ProductCardItem[]>([]);
  const endCallBtnRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isProcessingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const kokoroRef = useRef<KokoroInstance | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const soundMonitorFrameRef = useRef<number | null>(null);
  const soundMonitorStreamRef = useRef<MediaStream | null>(null);
  const soundMonitorContextRef = useRef<AudioContext | null>(null);
  const soundMonitorAnalyserRef = useRef<AnalyserNode | null>(null);
  const soundMonitorBufferRef = useRef<Uint8Array | null>(null);
  const lastVoiceActivityAtRef = useRef<number>(Date.now());
  const wakeFramesRef = useRef(0);
  const mountedRef = useRef(true);
  const isListeningRef = useRef(false);
  const isSleepingRef = useRef(false);
  const isRequestingRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isSleepingRef.current = isSleeping;
  }, [isSleeping]);

  useEffect(() => {
    isRequestingRef.current = isRequesting;
  }, [isRequesting]);

  const sessionIdFromRoute = useMemo(() => {
    const routeState = location.state;
    if (!routeState || typeof routeState !== 'object') return null;
    const maybe = (routeState as Record<string, unknown>).sessionId;
    return typeof maybe === 'string' && maybe.trim() ? maybe.trim() : null;
  }, [location.state]);

  const mapProducts = useCallback((value: unknown): ProductCardItem[] => {
    if (!Array.isArray(value)) return [];
    return value
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
      .filter((item): item is ProductCardItem => !!item);
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (!isWindowVisible || !sessionId || isProcessingRef.current || isRequesting || muted || isSleeping) return;
    clearRestartTimer();
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setStatus('listening');
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, [clearRestartTimer, isRequesting, isSleeping, isWindowVisible, muted, sessionId]);

  const scheduleRestartListening = useCallback(() => {
    if (!mountedRef.current) return;
    clearRestartTimer();
    restartTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      startListening();
    }, RESTART_DELAY_MS);
  }, [clearRestartTimer, startListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const stopSoundMonitor = useCallback(async () => {
    if (soundMonitorFrameRef.current !== null) {
      window.cancelAnimationFrame(soundMonitorFrameRef.current);
      soundMonitorFrameRef.current = null;
    }
    if (soundMonitorAnalyserRef.current) {
      soundMonitorAnalyserRef.current.disconnect();
      soundMonitorAnalyserRef.current = null;
    }
    if (soundMonitorContextRef.current) {
      try {
        await soundMonitorContextRef.current.close();
      } catch {
        soundMonitorContextRef.current = null;
      }
      soundMonitorContextRef.current = null;
    }
    if (soundMonitorStreamRef.current) {
      soundMonitorStreamRef.current.getTracks().forEach((track) => track.stop());
      soundMonitorStreamRef.current = null;
    }
    soundMonitorBufferRef.current = null;
    wakeFramesRef.current = 0;
  }, []);

  const voicesForLanguage = useMemo(() => {
    const exactMatches = availableVoices.filter((voice) => voice.lang.toLowerCase() === language.toLowerCase());
    if (exactMatches.length) return exactMatches;
    const base = language.split('-')[0]?.toLowerCase();
    return availableVoices.filter((voice) => voice.lang.toLowerCase().startsWith(base));
  }, [availableVoices, language]);

  const selectedVoice = useMemo(() => {
    if (systemVoiceId === 'auto') return null;
    return availableVoices.find((voice) => voice.voiceURI === systemVoiceId) ?? null;
  }, [availableVoices, systemVoiceId]);

  const kokoroVoicesForLanguage = useMemo(() => {
    const languageGroup = getKokoroLanguageGroup(language);
    if (languageGroup === 'zh') {
      return kokoroVoices.filter((voice) => voice.id.startsWith('z'));
    }
    if (languageGroup === 'en') {
      return kokoroVoices.filter((voice) => voice.id.startsWith('a') || voice.id.startsWith('b'));
    }
    return kokoroVoices;
  }, [kokoroVoices, language]);

  const ensureKokoroLoaded = useCallback(async (): Promise<KokoroInstance | null> => {
    if (kokoroRef.current) return kokoroRef.current;
    if (kokoroLoading) return null;
    setKokoroLoading(true);
    try {
      const module = (await import('kokoro-js')) as { KokoroTTS: { from_pretrained: (...args: unknown[]) => Promise<unknown> } };
      const instance = (await module.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: 'q8',
        device: 'wasm',
      })) as KokoroInstance;
      kokoroRef.current = instance;
      const voiceEntries = Object.entries(instance.voices || {}).map(([id, info]) => ({
        id,
        name: info?.name || id,
        language: info?.language || 'Unknown',
      }));
      setKokoroVoices(voiceEntries);
      setIsKokoroReady(true);
      return instance;
    } catch (error) {
      setIsKokoroReady(false);
      setTtsProvider('system');
      toast({
        title: 'Neural voice unavailable',
        description: 'Switched to system voice. You can continue the call normally.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setKokoroLoading(false);
    }
  }, [kokoroLoading]);

  const speakWithSystem = useCallback(
    async (text: string) => {
      if (!window.speechSynthesis) return;
      const voice = selectedVoice || voicesForLanguage.find((item) => item.default) || voicesForLanguage[0] || null;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.95;
      utterance.pitch = 1;
      if (voice) utterance.voice = voice;
      await new Promise<void>((resolve) => {
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
    },
    [language, selectedVoice, voicesForLanguage],
  );

  const speakWithKokoro = useCallback(
    async (text: string) => {
      const tts = await ensureKokoroLoaded();
      if (!tts) {
        await speakWithSystem(text);
        return;
      }
      const availableIds = kokoroVoicesForLanguage.map((voice) => voice.id);
      const selectedId =
        kokoroVoiceId === 'auto'
          ? getDefaultKokoroVoice(language, availableIds)
          : kokoroVoiceId;
      const audioData = await tts.generate(text, { voice: selectedId, speed: 1 });
      const blob = audioData.toBlob();
      const audioUrl = URL.createObjectURL(blob);
      const player = new Audio(audioUrl);
      audioRef.current = player;
      await new Promise<void>((resolve) => {
        player.onended = () => resolve();
        player.onerror = () => resolve();
        void player.play().catch(() => resolve());
      });
      URL.revokeObjectURL(audioUrl);
      if (audioRef.current === player) {
        audioRef.current = null;
      }
    },
    [ensureKokoroLoaded, kokoroVoiceId, kokoroVoicesForLanguage, language, speakWithSystem],
  );

  const speakText = useCallback(
    async (text: string, shouldSpeak = true) => {
      if (!shouldSpeak || muted || !text.trim() || !isWindowVisible) return;
      if (ttsProvider === 'kokoro') {
        try {
          await speakWithKokoro(text);
          return;
        } catch {
          await speakWithSystem(text);
          return;
        }
      }
      await speakWithSystem(text);
    },
    [isWindowVisible, muted, speakWithKokoro, speakWithSystem, ttsProvider],
  );

  const monitorSoundLevel = useCallback(() => {
    const analyser = soundMonitorAnalyserRef.current;
    const buffer = soundMonitorBufferRef.current;
    if (!analyser || !buffer || !mountedRef.current) return;

    analyser.getByteTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const sample = (buffer[i] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / buffer.length);
    const now = Date.now();
    const hasSound = rms >= WAKE_THRESHOLD;

    if (hasSound) {
      lastVoiceActivityAtRef.current = now;
      wakeFramesRef.current += 1;
    } else {
      wakeFramesRef.current = 0;
    }

    if (isSleepingRef.current && hasSound && wakeFramesRef.current >= WAKE_FRAMES_REQUIRED) {
      isSleepingRef.current = false;
      setIsSleeping(false);
      setStatus('listening');
      setTranscript('Sound detected. Listening...');
      scheduleRestartListening();
    }

    if (!isSleepingRef.current && isListeningRef.current && !isProcessingRef.current && !isRequestingRef.current) {
      const silenceDuration = now - lastVoiceActivityAtRef.current;
      if (silenceDuration >= SILENCE_SLEEP_MS) {
        isSleepingRef.current = true;
        setIsSleeping(true);
        setStatus('inactive');
        setTranscript('No voice activity. Sleeping until sound is detected.');
        stopListening();
      }
    }

    soundMonitorFrameRef.current = window.requestAnimationFrame(monitorSoundLevel);
  }, [scheduleRestartListening, stopListening]);

  const startSoundMonitor = useCallback(async () => {
    if (!mountedRef.current) return;
    if (soundMonitorFrameRef.current !== null && soundMonitorContextRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      soundMonitorStreamRef.current = stream;
      soundMonitorContextRef.current = audioContext;
      soundMonitorAnalyserRef.current = analyser;
      soundMonitorBufferRef.current = new Uint8Array(analyser.fftSize);
      lastVoiceActivityAtRef.current = Date.now();
      soundMonitorFrameRef.current = window.requestAnimationFrame(monitorSoundLevel);
    } catch {
      setTranscript('Microphone is not available. Please enable microphone access.');
    }
  }, [monitorSoundLevel]);

  const shutdownVoiceCall = useCallback(async () => {
    clearRestartTimer();
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {};
      recognitionRef.current.onresult = () => {};
      recognitionRef.current.onerror = () => {};
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    await stopSoundMonitor();
  }, [clearRestartTimer, stopSoundMonitor]);

  const processVoiceMessage = useCallback(
    async (message: string) => {
      const cleanMessage = message.trim();
      if (!cleanMessage || !sessionId || isProcessingRef.current || !isWindowVisible) return;
      isProcessingRef.current = true;
      clearRestartTimer();
      isSleepingRef.current = false;
      setIsSleeping(false);
      setIsRequesting(true);
      setStatus('processing');
      stopListening();
      setTranscript(`You: ${cleanMessage}`);
      lastVoiceActivityAtRef.current = Date.now();

      const estimatedDurationSeconds = Math.min(9999.99, Math.max(0, cleanMessage.split(/\s+/).length / 2.8));

      try {
        const result = await sendAiVoiceCallMessage({
          session_id: sessionId,
          message: cleanMessage,
          audio_duration_seconds: Number(estimatedDurationSeconds.toFixed(2)),
        });

        const responseText = (result.voice_response?.text || result.response || 'I could not generate a response.').trim();
        const displayProductsRaw = result.display_payload?.products || result.products || [];
        const mappedProducts = mapProducts(displayProductsRaw);
        const showProducts = Boolean(result.should_display_products && mappedProducts.length > 0);
        setVoiceProducts(showProducts ? mappedProducts : []);
        const nextTranscript = showProducts
          ? `${responseText}\n\nFound ${mappedProducts.length} products for this call.`
          : responseText;
        setTranscript(nextTranscript || 'I could not generate a response.');
        setStatus('speaking');
        await speakText(responseText, result.voice_response?.should_speak !== false);
      } catch (error) {
        const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
        const messageText = maybe?.message || Object.values(maybe?.errors || {})[0]?.[0] || 'AI service unavailable.';
        setTranscript(messageText);
        setVoiceProducts([]);
        toast({
          title: maybe?.message || 'Voice call failed',
          description: Object.values(maybe?.errors || {})[0]?.[0] || 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        isProcessingRef.current = false;
        setIsRequesting(false);
        setStatus(!isWindowVisible ? 'inactive' : muted ? 'speaking' : isSleeping ? 'inactive' : 'listening');
        if (!muted && isWindowVisible && !isSleeping) {
          scheduleRestartListening();
        }
      }
    },
    [
      clearRestartTimer,
      isSleeping,
      isWindowVisible,
      mapProducts,
      muted,
      scheduleRestartListening,
      sendAiVoiceCallMessage,
      sessionId,
      speakText,
      stopListening,
    ],
  );

  useEffect(() => {
    if (ttsProvider !== 'kokoro') return;
    void ensureKokoroLoaded();
  }, [ensureKokoroLoaded, ttsProvider]);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const applyVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        setAvailableVoices(voices);
      }
    };
    applyVoices();
    window.speechSynthesis.onvoiceschanged = applyVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (systemVoiceId !== 'auto') return;
    const preferredId = getPreferredSystemVoiceId(availableVoices);
    if (!preferredId) return;
    setSystemVoiceId(preferredId);
  }, [availableVoices, systemVoiceId]);

  useEffect(() => {
    if (systemVoiceId === 'auto') return;
    if (voicesForLanguage.some((voice) => voice.voiceURI === systemVoiceId)) return;
    setSystemVoiceId('auto');
  }, [systemVoiceId, voicesForLanguage]);

  useEffect(() => {
    if (kokoroVoiceId === 'auto') return;
    if (kokoroVoicesForLanguage.some((voice) => voice.id === kokoroVoiceId)) return;
    setKokoroVoiceId('auto');
  }, [kokoroVoiceId, kokoroVoicesForLanguage]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please sign in to start an AI voice call.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    const storedSessionId = sessionStorage.getItem('ai_active_session_id');
    const existingSessionId = sessionIdFromRoute || storedSessionId;
    if (existingSessionId) {
      setSessionId(existingSessionId);
      setTranscript('Connected to your current AI session. You can start speaking now.');
      return;
    }

    let cancelled = false;
    setIsSessionLoading(true);
    void (async () => {
      try {
        const created = await createAiSession({ title: 'Voice Call' });
        if (!created.session_id) throw new Error('Missing session id');
        if (cancelled) return;
        setSessionId(created.session_id);
        sessionStorage.setItem('ai_active_session_id', created.session_id);
        setTranscript('Connected. You can start speaking now.');
      } catch (error) {
        const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
        setTranscript(maybe?.message || Object.values(maybe?.errors || {})[0]?.[0] || 'Unable to start voice call.');
        toast({
          title: maybe?.message || 'Unable to start voice call',
          description: Object.values(maybe?.errors || {})[0]?.[0] || 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setIsSessionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [createAiSession, isAuthenticated, navigate, sessionIdFromRoute]);

  useEffect(() => {
    if (!sessionId) return;
    sessionStorage.setItem('ai_active_session_id', sessionId);
  }, [sessionId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void shutdownVoiceCall();
    };
  }, [shutdownVoiceCall]);

  useEffect(() => {
    const shouldMonitor = Boolean(sessionId && isWindowVisible && !isSessionLoading);
    if (!shouldMonitor) {
      void stopSoundMonitor();
      return;
    }
    void startSoundMonitor();
  }, [isSessionLoading, isWindowVisible, sessionId, startSoundMonitor, stopSoundMonitor]);

  useEffect(() => {
    const handlePageHide = () => {
      void shutdownVoiceCall();
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [shutdownVoiceCall]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsWindowVisible(visible);
      if (!visible) {
        clearRestartTimer();
        void shutdownVoiceCall();
        setStatus('inactive');
        setTranscript('Voice call paused because this window is not active.');
        return;
      }
      lastVoiceActivityAtRef.current = Date.now();
      if (!muted && sessionId && !isRequesting && !isProcessingRef.current && !isSleeping) {
        setStatus('listening');
        scheduleRestartListening();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearRestartTimer, isRequesting, isSleeping, muted, scheduleRestartListening, sessionId, shutdownVoiceCall]);

  useEffect(() => {
    endCallBtnRef.current?.focus();
    if (!sessionId || isSessionLoading || !isWindowVisible) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: 'Speech Recognition Not Supported',
        description: 'Your browser does not support speech recognition. Please use Chrome or Edge.',
        variant: 'destructive',
      });
      setTranscript('Speech recognition is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        lastVoiceActivityAtRef.current = Date.now();
        isSleepingRef.current = false;
        setIsSleeping(false);
        void processVoiceMessage(finalTranscript.trim());
      } else {
        const displayText = interimTranscript || 'Listening...';
        setTranscript(displayText);
        setStatus('listening');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        isSleepingRef.current = true;
        setIsSleeping(true);
        setStatus('inactive');
        setTranscript('No speech detected. Sleeping until sound is detected.');
      } else if (event.error === 'not-allowed') {
        toast({
          title: 'Microphone Access Denied',
          description: 'Please allow microphone access to use voice call.',
          variant: 'destructive',
        });
        setTranscript('Microphone access denied.');
      } else {
        setTranscript(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!muted && !isProcessingRef.current && isWindowVisible && !isSleeping) {
        scheduleRestartListening();
      }
    };

    recognitionRef.current = recognition;
    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => {};
        recognitionRef.current.onerror = () => {};
        recognitionRef.current.onresult = () => {};
        recognitionRef.current.abort();
      }
    };
  }, [
    isSessionLoading,
    isSleeping,
    isWindowVisible,
    language,
    muted,
    processVoiceMessage,
    scheduleRestartListening,
    sessionId,
    startListening,
  ]);

  useEffect(() => {
    if (muted) {
      stopListening();
      clearRestartTimer();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setStatus('speaking');
    } else if (!isListening && !isProcessingRef.current && !!sessionId && isWindowVisible && !isSleeping) {
      scheduleRestartListening();
    }
  }, [clearRestartTimer, isListening, isSleeping, isWindowVisible, muted, scheduleRestartListening, sessionId, stopListening]);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    isSleepingRef.current = false;
    setIsSleeping(false);
    lastVoiceActivityAtRef.current = Date.now();
    const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    toast({
      title: 'Language Changed',
      description: `Now listening in ${selectedLang?.name || langCode}`,
    });
    stopListening();
    if (!muted) scheduleRestartListening();
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const currentVoiceName = ttsProvider === 'kokoro'
    ? kokoroVoiceId === 'auto'
      ? 'Auto Neural'
      : kokoroVoices.find((voice) => voice.id === kokoroVoiceId)?.name || 'Auto Neural'
    : systemVoiceId === 'auto'
      ? 'Auto'
      : availableVoices.find((voice) => voice.voiceURI === systemVoiceId)?.name || 'Auto';
  const statusLabel = isSessionLoading
    ? 'Connecting...'
    : !isWindowVisible
      ? 'Inactive window'
      : muted
        ? 'Muted'
        : status === 'processing'
          ? 'Processing...'
          : status === 'inactive' || isSleeping
            ? 'Sleeping...'
            : status === 'listening'
              ? 'Listening...'
              : 'Speaking...';
  const activityLabel = isSessionLoading
    ? 'Connecting to AI...'
    : !isWindowVisible
      ? 'Voice paused (window inactive)'
      : isRequesting
        ? 'Waiting for AI response...'
        : muted
          ? 'Muted'
          : status === 'inactive' || isSleeping
            ? 'Sleeping until sound is detected...'
            : status === 'listening'
              ? 'Listening...'
              : 'Speaking...';

  const handleEndCall = () => {
    void shutdownVoiceCall();
    navigate('/ai');
  };

  return (
    <MainLayout showFooter={false}>
      <div className="fixed inset-0 z-50 flex items-stretch bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex w-full flex-col">
          <div className="bg-card/80 backdrop-blur border-b">
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="icon" onClick={handleEndCall} aria-label="Back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="text-base font-semibold">AI Voice Assistant</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full gap-2">
                      <Languages className="h-4 w-4" />
                      <span>{currentLanguage.flag}</span>
                      <span className="hidden sm:inline">{currentLanguage.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto">
                    <DropdownMenuLabel>Select Language</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={language === lang.code ? 'bg-primary/10' : ''}
                      >
                        <span className="mr-2">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full gap-2">
                      <Volume2 className="h-4 w-4" />
                      <span className="hidden sm:inline">{currentVoiceName}</span>
                      <span className="sm:hidden">Voice</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
                    <DropdownMenuLabel>Select Voice Engine</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setTtsProvider('kokoro')}
                      className={ttsProvider === 'kokoro' ? 'bg-primary/10' : ''}
                    >
                      Kokoro Neural
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTtsProvider('system')}
                      className={ttsProvider === 'system' ? 'bg-primary/10' : ''}
                    >
                      System Voice
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Select Voice Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => (ttsProvider === 'kokoro' ? setKokoroVoiceId('auto') : setSystemVoiceId('auto'))}
                      className={(ttsProvider === 'kokoro' ? kokoroVoiceId : systemVoiceId) === 'auto' ? 'bg-primary/10' : ''}
                    >
                      {ttsProvider === 'kokoro' ? 'Auto Neural (Best match)' : 'Auto (Best match for language)'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {ttsProvider === 'kokoro' && kokoroLoading ? (
                      <DropdownMenuItem disabled>
                        Loading neural voices...
                      </DropdownMenuItem>
                    ) : null}
                    {ttsProvider === 'kokoro' ? (
                      kokoroVoicesForLanguage.length ? (
                        kokoroVoicesForLanguage.map((voice) => (
                          <DropdownMenuItem
                            key={voice.id}
                            onClick={() => setKokoroVoiceId(voice.id)}
                            className={kokoroVoiceId === voice.id ? 'bg-primary/10' : ''}
                          >
                            {voice.name} ({voice.id})
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>
                          No neural voices for this language
                        </DropdownMenuItem>
                      )
                    ) : voicesForLanguage.length ? (
                      voicesForLanguage.map((voice) => (
                        <DropdownMenuItem
                          key={voice.voiceURI}
                          onClick={() => setSystemVoiceId(voice.voiceURI)}
                          className={systemVoiceId === voice.voiceURI ? 'bg-primary/10' : ''}
                        >
                          {voice.name} ({voice.lang})
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        No installed voices for this language
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-sm text-muted-foreground">
                {statusLabel}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
            <div className="relative">
              <div className="h-40 w-40 rounded-full bg-primary/10" />
              <div className="absolute inset-0 m-auto h-32 w-32 animate-ping rounded-full bg-primary/20" />
              <div className="absolute inset-0 m-auto h-24 w-24 rounded-full bg-primary/30" />
              <div className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <Mic className="h-7 w-7" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span>
                {activityLabel}
              </span>
            </div>

            <div className="w-full max-w-screen-sm rounded-xl bg-card/60 p-4 text-center shadow-sm backdrop-blur">
              <div className="min-h-[72px] whitespace-pre-wrap break-words text-sm text-foreground">
                {transcript}
              </div>
              {voiceProducts.length > 0 ? (
                <div className="mt-4 space-y-3 text-left">
                  {voiceProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="flex items-stretch gap-4 overflow-hidden rounded-2xl shadow-card"
                    >
                      <div className="relative aspect-square w-24 shrink-0 bg-muted">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 items-center justify-between pr-3">
                        <div className="min-w-0 py-3">
                          <div className="truncate text-[13px] font-semibold">{product.title}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {product.currency} {product.price}{product.location ? ` · ${product.location}` : ''}
                          </div>
                        </div>
                        <Button asChild size="sm" className="h-8 rounded-lg" variant="secondary">
                          <a href={`/product/${product.id}`}>View Details</a>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 text-xs text-muted-foreground">
                Session: {sessionId ? `${sessionId.slice(0, 8)}...` : 'Not connected'}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Voice: {ttsProvider === 'kokoro' ? `Kokoro Neural${isKokoroReady ? '' : ' (loading/fallback)'}` : 'System Voice'}
              </div>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur border-t">
            <div className="flex items-center justify-center gap-4 p-4">
              <Button
                type="button"
                size="lg"
                className="h-14 rounded-full bg-red-600 text-white hover:bg-red-700 px-8"
                onClick={handleEndCall}
                ref={endCallBtnRef}
              >
                <PhoneOff className="mr-2 h-5 w-5" />
                End Call
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-14 rounded-full px-8"
                onClick={() => setMuted(!muted)}
              >
                {muted ? <VolumeX className="mr-2 h-5 w-5" /> : <Volume2 className="mr-2 h-5 w-5" />}
                {muted ? 'Unmute' : 'Mute'}
              </Button>
              <div className="text-xs text-muted-foreground">
                {isListening ? '🎤 Active' : isRequesting ? '⏳ Processing' : '⏸️ Paused'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AIVoiceCallPage;
