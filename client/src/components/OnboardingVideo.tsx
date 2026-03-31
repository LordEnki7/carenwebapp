import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, X, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'wouter';

interface OnboardingVideoProps {
  onComplete?: () => void;
  onSkip?: () => void;
  autoPlay?: boolean;
  showLanguageSelector?: boolean;
  redirectToSignIn?: boolean;
}

// Module-level timestamp — changes on every app restart, busting browser cache
const CACHE_BUST = `t=${Date.now()}`;

const VIDEOS = {
  en: `/videos/onboarding-en.mp4?${CACHE_BUST}`,
  es: `/videos/onboarding-es.mp4?${CACHE_BUST}`,
};

const TITLES = {
  en: 'Welcome to C.A.R.E.N.™ — Your Legal Protection Platform',
  es: 'Bienvenido a C.A.R.E.N.™ — Su Plataforma de Protección Legal',
};

const OnboardingVideo: React.FC<OnboardingVideoProps> = ({
  onComplete,
  onSkip,
  autoPlay = false,
  showLanguageSelector = true,
  redirectToSignIn = false,
}) => {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [videoSrc, setVideoSrc] = useState(VIDEOS.en);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(!autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasWatched, setHasWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hasAutoPlayed = React.useRef(false);
  const [, setLocation] = useLocation();

  // Wire up video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDuration = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setHasWatched(true);
      if (onComplete) onComplete();
      if (redirectToSignIn) setTimeout(() => setLocation('/signin'), 1000);
    };
    const onCanPlay = () => setIsLoading(false);
    const onLoadStart = () => setIsLoading(true);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('loadeddata', onCanPlay);
    video.addEventListener('loadstart', onLoadStart);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadeddata', onCanPlay);
      video.removeEventListener('loadstart', onLoadStart);
    };
  }, [onComplete, redirectToSignIn]);

  // Auto-play once on initial mount only
  useEffect(() => {
    if (!autoPlay || hasAutoPlayed.current) return;
    const timer = setTimeout(async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        video.muted = isMuted;
        video.volume = isMuted ? 0 : 0.8;
        await video.play();
        hasAutoPlayed.current = true;
      } catch {
        // Browser blocked autoplay — user can press play
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [autoPlay, isMuted]);

  // Switch language: pause, unload, show spinner, load new video
  const handleLanguageChange = (newLang: 'en' | 'es') => {
    if (newLang === lang) return;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.src = '';
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasWatched(false);
    setIsLoading(true);
    setLang(newLang);
    setTimeout(() => setVideoSrc(VIDEOS[newLang]), 150);
  };

  const togglePlay = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video || isLoading) return;
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (err) {
      console.error('Play/pause error:', err);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    setIsMuted(next);
    video.muted = next;
    video.volume = next ? 0 : 0.8;
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(console.error);
    setHasWatched(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    video.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-gray-900/95 border-gray-700">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-xl font-semibold text-white">{TITLES[lang]}</h2>
              {showLanguageSelector && (
                <Select value={lang} onValueChange={(v: 'en' | 'es') => handleLanguageChange(v)}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                    <Languages className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="en" className="text-white hover:bg-gray-700">English</SelectItem>
                    <SelectItem value="es" className="text-white hover:bg-gray-700">Español</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              variant="ghost" size="sm" type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSkip) { onSkip(); }
                else if (window.history.length > 1) { window.history.back(); }
                else { window.location.href = '/signin'; }
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full aspect-video"
              playsInline
              preload="metadata"
            />

            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-cyan-400 text-sm">
                    {lang === 'es' ? 'Cargando video...' : 'Loading video...'}
                  </span>
                </div>
              </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-4" onClick={handleSeek}>
                  <div className="h-full bg-cyan-400 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" type="button" onClick={togglePlay}
                      className="text-white hover:bg-white/20" disabled={isLoading}>
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" type="button" onClick={toggleMute}
                      className="text-white hover:bg-white/20">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <span className="text-white text-sm">{fmt(currentTime)} / {fmt(duration)}</span>
                  </div>
                  <Button variant="ghost" size="sm" type="button" onClick={replay}
                    className="text-white hover:bg-white/20">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {lang === 'es' ? 'Repetir' : 'Replay'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 mt-6">
            {hasWatched && (
              <div className="text-center">
                <span className="text-green-400 text-sm flex items-center justify-center">
                  ✓ {lang === 'es' ? 'Video Completado' : 'Video Completed'}
                </span>
              </div>
            )}
            <div className="flex gap-3 justify-center flex-wrap">
              <Button type="button" variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => { if (onSkip) onSkip(); if (redirectToSignIn) setLocation('/signin'); }}>
                {lang === 'es' ? 'Saltar Video' : 'Skip Video'}
              </Button>
              <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setLocation('/signin')}>
                Sign In / Create Account
              </Button>
              <Button type="button" className="bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={!hasWatched} onClick={onComplete}>
                {lang === 'es' ? 'Continuar al Panel' : 'Continue to Dashboard'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingVideo;
