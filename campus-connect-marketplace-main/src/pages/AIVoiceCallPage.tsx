import React, { useEffect, useRef, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, PhoneOff, VolumeX, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIVoiceCallPage: React.FC = () => {
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<'listening' | 'speaking'>('listening');
  const [transcript, setTranscript] = useState('Say something to start...');
  const endCallBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    endCallBtnRef.current?.focus();
    const timer = setTimeout(() => setStatus('speaking'), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEndCall = () => navigate('/ai');

  return (
    <MainLayout showFooter={false}>
      <div className="fixed inset-0 z-50 flex items-stretch bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex w-full flex-col">
          <div className="bg-card/80 backdrop-blur border-b">
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="icon" onClick={handleEndCall} aria-label="Back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-base font-semibold">AI Voice Assistant</div>
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
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AIVoiceCallPage;
