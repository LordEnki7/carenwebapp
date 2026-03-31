import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Camera, Check, X, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FacialRecognitionProps {
  onSuccess: (userId: string) => void;
  onFailure: () => void;
  mode: 'authenticate' | 'register';
}

export function FacialRecognition({ onSuccess, onFailure, mode }: FacialRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [lightingQuality, setLightingQuality] = useState<'poor' | 'good' | 'excellent'>('poor');
  const [facePositionGood, setFacePositionGood] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
        setIsInitialized(true);
        
        // Start quality assessment
        setTimeout(() => {
          const qualityInterval = setInterval(() => {
            assessImageQuality();
          }, 500);
          
          // Store interval for cleanup
          (videoRef.current as any).qualityInterval = qualityInterval;
        }, 1000);
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      toast({
        title: "Camera Access Required",
        description: "Please allow camera access for facial recognition",
        variant: "destructive",
      });
      onFailure();
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      // Clear quality assessment interval
      if ((videoRef.current as any).qualityInterval) {
        clearInterval((videoRef.current as any).qualityInterval);
      }
      
      // Stop camera stream
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const assessImageQuality = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0) return;

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    // Assess lighting quality
    let totalBrightness = 0;
    let pixelCount = 0;
    let darkPixels = 0;
    let brightPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
      pixelCount++;
      
      if (brightness < 50) darkPixels++;
      if (brightness > 200) brightPixels++;
    }

    const avgBrightness = totalBrightness / pixelCount;
    const darkRatio = darkPixels / pixelCount;
    const brightRatio = brightPixels / pixelCount;

    // Determine lighting quality
    let lighting: 'poor' | 'good' | 'excellent' = 'poor';
    if (avgBrightness > 80 && avgBrightness < 180 && darkRatio < 0.3 && brightRatio < 0.2) {
      lighting = 'excellent';
    } else if (avgBrightness > 60 && avgBrightness < 200 && darkRatio < 0.5) {
      lighting = 'good';
    }

    // Assess face position (center detection)
    const centerX = width / 2;
    const centerY = height / 2;
    const faceRegion = {
      x: centerX - width * 0.15,
      y: centerY - height * 0.15,
      w: width * 0.3,
      h: height * 0.3
    };

    let faceRegionBrightness = 0;
    let facePixelCount = 0;
    let faceVariance = 0;

    for (let y = Math.floor(faceRegion.y); y < Math.floor(faceRegion.y + faceRegion.h) && y < height; y++) {
      for (let x = Math.floor(faceRegion.x); x < Math.floor(faceRegion.x + faceRegion.w) && x < width; x++) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        faceRegionBrightness += brightness;
        facePixelCount++;
      }
    }

    const avgFaceBrightness = faceRegionBrightness / facePixelCount;
    
    // Calculate variance in face region for texture detection
    for (let y = Math.floor(faceRegion.y); y < Math.floor(faceRegion.y + faceRegion.h) && y < height; y++) {
      for (let x = Math.floor(faceRegion.x); x < Math.floor(faceRegion.x + faceRegion.w) && x < width; x++) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        faceVariance += Math.pow(brightness - avgFaceBrightness, 2);
      }
    }
    
    const faceStdDev = Math.sqrt(faceVariance / facePixelCount);
    const hasFaceTexture = faceStdDev > 15; // Sufficient texture variation indicates face presence
    const facePositionOK = avgFaceBrightness > 40 && avgFaceBrightness < 220 && hasFaceTexture;

    // Calculate overall quality score
    let score = 0;
    if (lighting === 'excellent') score += 40;
    else if (lighting === 'good') score += 25;
    else score += 10;

    if (facePositionOK) score += 40;
    if (hasFaceTexture) score += 20;

    setLightingQuality(lighting);
    setFacePositionGood(facePositionOK);
    setFaceDetected(facePositionOK && hasFaceTexture);
    setQualityScore(score);
  };

  const extractFacialFeatures = (imageData: ImageData): number[] => {
    const { data, width, height } = imageData;
    const features: number[] = [];
    
    // Convert to grayscale for better feature extraction
    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      grayscale[i / 4] = gray;
    }

    // Enhanced facial landmark regions with more precision
    const landmarks = [
      // Forehead region
      { x: 0.25, y: 0.1, w: 0.5, h: 0.15 },
      // Left eye region  
      { x: 0.2, y: 0.25, w: 0.15, h: 0.1 },
      // Right eye region
      { x: 0.65, y: 0.25, w: 0.15, h: 0.1 },
      // Between eyes (glabella)
      { x: 0.45, y: 0.25, w: 0.1, h: 0.1 },
      // Nose bridge upper
      { x: 0.42, y: 0.35, w: 0.16, h: 0.1 },
      // Nose bridge lower
      { x: 0.4, y: 0.45, w: 0.2, h: 0.1 },
      // Nose tip
      { x: 0.38, y: 0.5, w: 0.24, h: 0.08 },
      // Left nostril
      { x: 0.35, y: 0.52, w: 0.08, h: 0.06 },
      // Right nostril
      { x: 0.57, y: 0.52, w: 0.08, h: 0.06 },
      // Upper lip
      { x: 0.35, y: 0.62, w: 0.3, h: 0.06 },
      // Lower lip
      { x: 0.37, y: 0.68, w: 0.26, h: 0.08 },
      // Left mouth corner
      { x: 0.3, y: 0.64, w: 0.08, h: 0.08 },
      // Right mouth corner
      { x: 0.62, y: 0.64, w: 0.08, h: 0.08 },
      // Left cheek high
      { x: 0.1, y: 0.35, w: 0.15, h: 0.2 },
      // Right cheek high
      { x: 0.75, y: 0.35, w: 0.15, h: 0.2 },
      // Left cheek low
      { x: 0.15, y: 0.55, w: 0.15, h: 0.15 },
      // Right cheek low
      { x: 0.7, y: 0.55, w: 0.15, h: 0.15 },
      // Chin center
      { x: 0.4, y: 0.8, w: 0.2, h: 0.15 },
      // Left jaw
      { x: 0.15, y: 0.7, w: 0.2, h: 0.2 },
      // Right jaw
      { x: 0.65, y: 0.7, w: 0.2, h: 0.2 }
    ];

    // Extract multiple features per landmark for robustness
    landmarks.forEach((landmark, idx) => {
      const startX = Math.floor(landmark.x * width);
      const startY = Math.floor(landmark.y * height);
      const endX = Math.min(startX + Math.floor(landmark.w * width), width - 1);
      const endY = Math.min(startY + Math.floor(landmark.h * height), height - 1);
      
      let sum = 0, sumSquared = 0, count = 0;
      let minVal = 255, maxVal = 0;
      let edgeStrength = 0;
      
      // Calculate statistical features for this region
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const val = grayscale[y * width + x];
          sum += val;
          sumSquared += val * val;
          count++;
          minVal = Math.min(minVal, val);
          maxVal = Math.max(maxVal, val);
          
          // Edge detection (Sobel-like)
          if (x > startX && y > startY) {
            const dx = grayscale[y * width + x] - grayscale[y * width + (x - 1)];
            const dy = grayscale[y * width + x] - grayscale[(y - 1) * width + x];
            edgeStrength += Math.sqrt(dx * dx + dy * dy);
          }
        }
      }
      
      if (count > 0) {
        const mean = sum / count;
        const variance = (sumSquared / count) - (mean * mean);
        const std = Math.sqrt(variance);
        const range = maxVal - minVal;
        const avgEdgeStrength = edgeStrength / count;
        
        // Add multiple discriminative features
        features.push(mean / 255);           // Mean intensity
        features.push(std / 255);            // Standard deviation
        features.push(range / 255);          // Intensity range
        features.push(avgEdgeStrength / 255); // Edge strength
        features.push(minVal / 255);         // Minimum intensity
        features.push(maxVal / 255);         // Maximum intensity
      } else {
        features.push(0, 0, 0, 0, 0, 0);
      }
    });

    // Add global image features
    let totalSum = 0, totalSumSquared = 0;
    let globalEdgeStrength = 0;
    const totalPixels = width * height;
    
    for (let i = 0; i < grayscale.length; i++) {
      const val = grayscale[i];
      totalSum += val;
      totalSumSquared += val * val;
      
      // Global edge detection
      if (i > width && i % width > 0) {
        const dx = grayscale[i] - grayscale[i - 1];
        const dy = grayscale[i] - grayscale[i - width];
        globalEdgeStrength += Math.sqrt(dx * dx + dy * dy);
      }
    }
    
    const globalMean = totalSum / totalPixels;
    const globalVariance = (totalSumSquared / totalPixels) - (globalMean * globalMean);
    const globalStd = Math.sqrt(globalVariance);
    
    features.push(globalMean / 255);
    features.push(globalStd / 255);
    features.push(globalEdgeStrength / (totalPixels * 255));

    // Add histogram features for texture analysis
    const histogramBins = 32;
    const histogram = new Array(histogramBins).fill(0);
    for (let i = 0; i < grayscale.length; i++) {
      const bin = Math.min(Math.floor((grayscale[i] / 255) * histogramBins), histogramBins - 1);
      histogram[bin]++;
    }
    
    // Normalize histogram and add entropy
    let entropy = 0;
    for (let i = 0; i < histogramBins; i++) {
      const prob = histogram[i] / totalPixels;
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
        features.push(prob);
      } else {
        features.push(0);
      }
    }
    features.push(entropy / Math.log2(histogramBins)); // Normalized entropy

    // Geometric ratios between facial landmarks for additional uniqueness
    const eyeDistance = Math.abs(landmarks[1].x - landmarks[2].x);
    const noseToMouthDistance = Math.abs(landmarks[6].y - landmarks[9].y);
    const faceWidth = landmarks[14].x - landmarks[13].x;
    const faceHeight = landmarks[17].y - landmarks[0].y;
    
    features.push(eyeDistance);
    features.push(noseToMouthDistance);
    features.push(faceWidth);
    features.push(faceHeight);
    features.push(faceWidth / faceHeight); // Aspect ratio

    console.log(`Extracted ${features.length} facial features`);
    return features;
  };

  const captureAndProcessFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Unable to get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Extract facial features instead of raw image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const facialFeatures = extractFacialFeatures(imageData);
      
      // Convert features to a consistent string representation
      const faceData = facialFeatures.map(f => f.toFixed(6)).join(',');

      console.log('Extracted facial features:', facialFeatures.length, 'points');
      console.log('Feature values:', facialFeatures.slice(0, 3).map(f => f.toFixed(3)));

      // Send to backend for processing
      await processWithBackend(faceData);

    } catch (error) {
      console.error('Face capture failed:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture face data. Please try again.",
        variant: "destructive",
      });
      onFailure();
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithBackend = async (faceData: string) => {
    try {
      const response = await fetch('/api/auth/facial-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          faceData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (mode === 'register') {
          toast({
            title: "Registration Successful",
            description: "Your face has been registered successfully!",
          });
        } else {
          toast({
            title: "Authentication Successful", 
            description: `Welcome back, ${result.user?.firstName || 'User'}!`,
          });
        }
        onSuccess(result.userId);
      } else {
        throw new Error(result.message || `${mode} failed`);
      }
    } catch (error) {
      console.error(`Face ${mode} failed:`, error);
      toast({
        title: `${mode === 'register' ? 'Registration' : 'Authentication'} Failed`,
        description: error instanceof Error ? error.message : `Failed to ${mode} face. Please try again.`,
        variant: "destructive",
      });
      onFailure();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Face {mode === 'register' ? 'Registration' : 'Recognition'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {!hasPermission && (
            <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Camera access required</p>
              </div>
            </div>
          )}

          {/* Face detection overlay with quality indicators */}
          {hasPermission && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Face positioning guide */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 rounded-full border-white/50">
                <div className={`absolute inset-0 rounded-full border-2 border-dashed animate-pulse ${
                  faceDetected ? 'border-green-400' : 'border-orange-400'
                }`}></div>
              </div>
              
              {/* Quality status indicators */}
              <div className="absolute top-2 left-2 space-y-1">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  lightingQuality === 'excellent' ? 'bg-green-500 text-white' :
                  lightingQuality === 'good' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  Lighting: {lightingQuality}
                </div>
                
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  facePositionGood ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  Position: {facePositionGood ? 'Good' : 'Center face'}
                </div>
              </div>
              
              {/* Overall quality score */}
              <div className="absolute top-2 right-2 bg-black/75 text-white px-3 py-2 rounded-lg">
                <div className="text-xs text-center">Quality</div>
                <div className="text-lg font-bold text-center">{qualityScore}%</div>
                <div className={`w-8 h-1 rounded mx-auto ${
                  qualityScore >= 80 ? 'bg-green-400' : 
                  qualityScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
              </div>
            </div>
          )}
        </div>

        {/* User guidance messages */}
        {hasPermission && qualityScore < 70 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="font-medium text-blue-800 mb-2">Improve your facial recognition quality:</div>
            <ul className="text-blue-700 space-y-1">
              {lightingQuality === 'poor' && <li>• Move to better lighting or face a window</li>}
              {!facePositionGood && <li>• Center your face in the circle guide</li>}
              {!faceDetected && <li>• Look directly at the camera</li>}
              {qualityScore < 50 && <li>• Remove glasses or hat if wearing</li>}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={captureAndProcessFace}
            disabled={!isInitialized || isProcessing || !faceDetected || qualityScore < 60}
            className="flex-1"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                {mode === 'register' ? 'Register Face' : 'Authenticate'}
              </div>
            )}
          </Button>
          
          <Button
            onClick={onFailure}
            variant="outline"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quality requirement notice */}
        {hasPermission && qualityScore < 60 && (
          <p className="text-xs text-gray-500 text-center">
            Quality score must be 60% or higher to {mode === 'register' ? 'register' : 'authenticate'}
          </p>
        )}

        <p className="text-sm text-muted-foreground text-center">
          {mode === 'register' 
            ? 'Position your face in the camera and wait for detection'
            : 'Look directly at the camera for authentication'
          }
        </p>
      </CardContent>
    </Card>
  );
}