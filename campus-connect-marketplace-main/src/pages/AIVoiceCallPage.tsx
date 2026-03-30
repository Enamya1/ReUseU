import React, { useEffect, useRef, useState, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, PhoneOff, VolumeX, Volume2, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

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

const AIVoiceCallPage: React.FC = () => {
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<'listening' | 'speaking'>('listening');
  const [transcript, setTranscript] = useState('Say something to start...');
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const endCallBtnRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setStatus('listening');
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    endCallBtnRef.current?.focus();

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

      const displayText = finalTranscript || interimTranscript || 'Listening...';
      setTranscript(displayText);
      setStatus('listening');
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setTranscript('No speech detected. Please try again.');
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
      if (!muted) {
        setTimeout(() => {
          startListening();
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [muted, startListening, language]);

  useEffect(() => {
    if (muted) {
      stopListening();
      setStatus('speaking');
    } else if (!isListening) {
      startListening();
    }
  }, [muted, isListening, startListening, stopListening]);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    toast({
      title: 'Language Changed',
      description: `Now listening in ${selectedLang?.name || langCode}`,
    });
    stopListening();
    setTimeout(() => {
      if (!muted) startListening();
    }, 100);
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleEndCall = () => {
    stopListening();
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
              </div>
              <div className="text-sm text-muted-foreground">{muted ? 'Muted' : status === 'listening' ? 'Listening...' : 'Speaking...'}</div>
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
              <span>{muted ? 'Muted' : status === 'listening' ? 'Listening...' : 'Speaking...'}</span>
            </div>

            <div className="w-full max-w-screen-sm rounded-xl bg-card/60 p-4 text-center shadow-sm backdrop-blur">
              <div className="min-h-[72px] whitespace-pre-wrap break-words text-sm text-foreground">
                {transcript}
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
                {isListening ? '🎤 Active' : '⏸️ Paused'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AIVoiceCallPage;
