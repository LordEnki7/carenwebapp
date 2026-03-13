import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw, Home } from 'lucide-react';
import { Link } from 'wouter';

interface MediaPlayerProps {
  src?: string;
  type: 'audio' | 'video';
  title?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  showBackButton?: boolean;
}

export function MediaPlayer({ 
  src, 
  type, 
  title = 'Media Player',
  onTimeUpdate,
  showBackButton = true 
}: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
      setIsLoading(false);
      setError(null);
      
      // Ensure audio is properly configured
      media.muted = false;
      media.volume = volume;
      
      console.log(`Media loaded: ${type}, duration: ${media.duration}s, volume: ${media.volume}`);
    };

    const handleTimeUpdate = () => {
      const current = media.currentTime;
      setCurrentTime(current);
      onTimeUpdate?.(current, media.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      setError('Failed to load media file');
      setIsLoading(false);
      toast({
        title: "Playback Error",
        description: "Unable to play this media file. The file may be corrupted or in an unsupported format.",
        variant: "destructive",
      });
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('error', handleError);
    media.addEventListener('loadstart', handleLoadStart);

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('error', handleError);
      media.removeEventListener('loadstart', handleLoadStart);
    };
  }, [src, onTimeUpdate, toast]);

  const togglePlayPause = async () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
      setIsPlaying(false);
    } else {
      try {
        // Ensure audio is not muted and volume is set
        media.muted = false;
        if (media.volume === 0) {
          media.volume = volume || 0.5;
        }
        
        await media.play();
        setIsPlaying(true);
        
        toast({
          title: "Playback Started",
          description: `Playing ${type} file`,
        });
      } catch (error) {
        console.error('Playback failed:', error);
        setError(`Playback failed: ${error.message}`);
        toast({
          title: "Playback Failed",
          description: `Error: ${error.message}. Try clicking play again or check browser permissions.`,
          variant: "destructive",
        });
      }
    }
  };

  const handleSeek = (newTime: number[]) => {
    const media = mediaRef.current;
    if (!media) return;
    
    const seekTime = newTime[0];
    media.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const media = mediaRef.current;
    if (!media) return;
    
    const vol = newVolume[0];
    media.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    
    if (isMuted) {
      media.volume = volume;
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  const restart = () => {
    const media = mediaRef.current;
    if (!media) return;
    
    media.currentTime = 0;
    setCurrentTime(0);
  };

  const downloadMedia = () => {
    if (!src) {
      toast({
        title: "Download Failed",
        description: "No media source available for download.",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement('a');
    link.href = src;
    link.download = `caren-recording-${Date.now()}.${type === 'video' ? 'mp4' : 'mp3'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Your media file is being downloaded.",
    });
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header with Back Button */}
      {showBackButton && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <Link href="/dashboard">
            <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      )}

      <Card className="bg-gray-800/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center justify-between">
            <span>{type === 'video' ? 'Video Player' : 'Audio Player'}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={downloadMedia}
                disabled={!src}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Media Element */}
          <div className="relative">
            {type === 'video' ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={src}
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '400px' }}
                controls={false}
                preload="metadata"
              />
            ) : (
              <div className="w-full h-32 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-lg flex items-center justify-center">
                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  src={src}
                  preload="metadata"
                />
                <div className="text-center">
                  <Volume2 className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                  <p className="text-gray-300">Audio Recording</p>
                </div>
              </div>
            )}
            
            {/* Loading/Error Overlay */}
            {(isLoading || error) && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                {isLoading && (
                  <div className="text-center text-white">
                    <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Loading media...</p>
                  </div>
                )}
                {error && (
                  <div className="text-center text-red-400">
                    <p className="font-medium">Playback Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
                disabled={!src || isLoading || !!error}
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={restart}
                  variant="outline"
                  size="sm"
                  disabled={!src || isLoading || !!error}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={togglePlayPause}
                  size="lg"
                  disabled={!src || isLoading || !!error}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white w-12 h-12 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
              </div>

              {/* Volume Controls */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                
                <div className="w-24">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Information */}
          {!src && (
            <div className="text-center py-8 text-gray-400">
              <p>No media file loaded</p>
              <p className="text-sm">Upload or record a file to begin playback</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}