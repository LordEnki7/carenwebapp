import { useState } from 'react';
import { MediaPlayer } from '@/components/MediaPlayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Play, Video, Music, TestTube, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function MediaTest() {
  const [testAudioUrl, setTestAudioUrl] = useState<string>('');
  const [testVideoUrl, setTestVideoUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Create blob URL for playback
    const url = URL.createObjectURL(file);
    
    if (file.type.startsWith('audio/')) {
      setTestAudioUrl(url);
      setMediaType('audio');
      toast({
        title: "Audio File Loaded",
        description: `Loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    } else if (file.type.startsWith('video/')) {
      setTestVideoUrl(url);
      setMediaType('video');
      toast({
        title: "Video File Loaded", 
        description: `Loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    } else {
      toast({
        title: "Unsupported File Type",
        description: "Please select an audio or video file.",
        variant: "destructive",
      });
    }
  };

  const generateTestAudio = () => {
    // Create a simple test tone using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 3; // 3 seconds
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Generate a 440Hz sine wave (A note)
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.sin((440 * 2 * Math.PI * i) / sampleRate) * 0.3;
    }

    // Convert to blob URL
    const offlineContext = new OfflineAudioContext(1, duration * sampleRate, sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineContext.destination);
    source.start();

    offlineContext.startRendering().then((renderedBuffer) => {
      // Convert AudioBuffer to WAV blob
      const wav = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      setTestAudioUrl(url);
      setMediaType('audio');
      toast({
        title: "Test Audio Generated",
        description: "Generated 440Hz test tone for 3 seconds",
      });
    });
  };

  // Simple AudioBuffer to WAV conversion
  const audioBufferToWav = (buffer: AudioBuffer) => {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convert samples
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  };

  const clearMedia = () => {
    if (testAudioUrl) URL.revokeObjectURL(testAudioUrl);
    if (testVideoUrl) URL.revokeObjectURL(testVideoUrl);
    
    setTestAudioUrl('');
    setTestVideoUrl('');
    setSelectedFile(null);
    
    toast({
      title: "Media Cleared",
      description: "All test media has been cleared",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Media Playback Test
            </h1>
            <p className="text-gray-300 text-lg">
              Test audio and video playback functionality
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Test Controls */}
        {/* Audio Context Diagnostics */}
        <Card className="bg-gray-800/30 border-yellow-500/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-yellow-400 font-medium">Audio System Status</h3>
                <p className="text-sm text-gray-400">Browser audio capabilities</p>
              </div>
              <Button
                onClick={() => {
                  const diagnostics = {
                    audioContext: !!window.AudioContext || !!(window as any).webkitAudioContext,
                    mediaRecorder: !!window.MediaRecorder,
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    permissions: 'testing...'
                  };
                  
                  // Test audio permissions
                  navigator.mediaDevices?.getUserMedia({ audio: true })
                    .then(() => {
                      diagnostics.permissions = 'granted';
                      toast({
                        title: "Audio Diagnostics",
                        description: `Audio Context: ${diagnostics.audioContext ? 'Available' : 'Missing'}, Permissions: ${diagnostics.permissions}`,
                      });
                    })
                    .catch(() => {
                      diagnostics.permissions = 'denied';
                      toast({
                        title: "Audio Diagnostics",
                        description: `Audio Context: ${diagnostics.audioContext ? 'Available' : 'Missing'}, Permissions: ${diagnostics.permissions}`,
                        variant: "destructive",
                      });
                    });
                  
                  console.log('Audio Diagnostics:', diagnostics);
                }}
                variant="outline"
                size="sm"
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                Test Audio System
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileSelect}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white"
                />
              </div>
              {selectedFile && (
                <div className="space-y-2">
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    {selectedFile.type}
                  </Badge>
                  <p className="text-sm text-gray-300">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center">
                <TestTube className="w-5 h-5 mr-2" />
                Generate Test Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={generateTestAudio}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                <Music className="w-4 h-4 mr-2" />
                Generate Test Audio
              </Button>
              <p className="text-sm text-gray-400">
                Creates a 3-second 440Hz test tone
              </p>
              <Button
                onClick={() => {
                  // Test direct audio playback
                  const audio = new Audio();
                  audio.src = testAudioUrl;
                  audio.volume = 0.8;
                  audio.muted = false;
                  audio.play().then(() => {
                    toast({
                      title: "Direct Audio Test",
                      description: "Playing audio directly via HTML5 Audio API",
                    });
                  }).catch((err) => {
                    toast({
                      title: "Direct Audio Failed",
                      description: `Error: ${err.message}`,
                      variant: "destructive",
                    });
                  });
                }}
                variant="outline"
                className="w-full mt-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                disabled={!testAudioUrl}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Direct Audio
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center">
                <Play className="w-5 h-5 mr-2" />
                Playback Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant={testAudioUrl ? "default" : "secondary"}>
                  Audio: {testAudioUrl ? "Ready" : "Not Loaded"}
                </Badge>
                <Badge variant={testVideoUrl ? "default" : "secondary"}>
                  Video: {testVideoUrl ? "Ready" : "Not Loaded"}
                </Badge>
              </div>
              <Button
                onClick={clearMedia}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                disabled={!testAudioUrl && !testVideoUrl}
              >
                Clear All Media
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Media Players */}
        {testAudioUrl && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-cyan-400 flex items-center">
              <Music className="w-6 h-6 mr-2" />
              Audio Player Test
            </h2>
            <MediaPlayer
              src={testAudioUrl}
              type="audio"
              title="Audio Playback Test"
              showBackButton={false}
              onTimeUpdate={(current, duration) => {
                // Optional: Log playback progress
                console.log(`Audio playback: ${current.toFixed(1)}s / ${duration.toFixed(1)}s`);
              }}
            />
          </div>
        )}

        {testVideoUrl && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-purple-400 flex items-center">
              <Video className="w-6 h-6 mr-2" />
              Video Player Test
            </h2>
            <MediaPlayer
              src={testVideoUrl}
              type="video"
              title="Video Playback Test"
              showBackButton={false}
              onTimeUpdate={(current, duration) => {
                // Optional: Log playback progress
                console.log(`Video playback: ${current.toFixed(1)}s / ${duration.toFixed(1)}s`);
              }}
            />
          </div>
        )}

        {/* Instructions */}
        {!testAudioUrl && !testVideoUrl && (
          <Card className="bg-gray-800/30 border-gray-600/30">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <TestTube className="w-16 h-16 text-gray-400 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-300">
                  Ready to Test Media Playback
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Upload your own audio/video files or generate a test audio tone to verify
                  that the media playback system is working correctly.
                </p>
                <div className="flex justify-center gap-4 mt-6">
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    Supports: MP3, WAV, MP4, WebM
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    Controls: Play, Pause, Seek, Volume
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}