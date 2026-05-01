import { useRef, useState, useCallback, useEffect } from "react";

export type DashcamStatus = "off" | "standby" | "saving";

interface DashcamChunk {
  blob: Blob;
  timestamp: number;
}

interface SavedIncident {
  incidentId: string;
  savedAt: Date;
  chunks: number;
  durationSeconds: number;
}

const MAX_CHUNKS = 40;          // 40 × 15s = 10 minutes rolling window
const CHUNK_INTERVAL_MS = 15000; // 15 seconds per chunk

export function useDashcam() {
  const [status, setStatus] = useState<DashcamStatus>("off");
  const [bufferChunks, setBufferChunks] = useState(0);    // how many chunks buffered
  const [bufferSeconds, setBufferSeconds] = useState(0);  // total seconds buffered
  const [savedIncidents, setSavedIncidents] = useState<SavedIncident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<DashcamChunk[]>([]);
  const statusRef = useRef<DashcamStatus>("off");

  // Keep statusRef in sync
  useEffect(() => { statusRef.current = status; }, [status]);

  const stopStream = useCallback(() => {
    if (recorderRef.current) {
      try { recorderRef.current.stop(); } catch {}
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startDashcam = useCallback(async (deviceId?: string) => {
    setError(null);
    try {
      const videoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } };
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 800000 });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (!e.data || e.data.size === 0) return;
        bufferRef.current.push({ blob: e.data, timestamp: Date.now() });
        // Rolling window — drop oldest if over limit
        if (bufferRef.current.length > MAX_CHUNKS) {
          bufferRef.current.shift();
        }
        const count = bufferRef.current.length;
        setBufferChunks(count);
        setBufferSeconds(count * (CHUNK_INTERVAL_MS / 1000));
      };

      recorder.onerror = () => {
        setError("Dashcam recording error — restarting…");
        setStatus("off");
      };

      recorder.start(CHUNK_INTERVAL_MS);
      setStatus("standby");
      bufferRef.current = [];
      setBufferChunks(0);
      setBufferSeconds(0);
    } catch (err: any) {
      setError(err?.message ?? "Could not access camera");
      setStatus("off");
    }
  }, []);

  const stopDashcam = useCallback(() => {
    stopStream();
    bufferRef.current = [];
    setStatus("off");
    setBufferChunks(0);
    setBufferSeconds(0);
    setError(null);
  }, [stopStream]);

  const saveIncident = useCallback(async () => {
    if (isSaving) return;
    const chunks = [...bufferRef.current];
    if (chunks.length === 0) {
      setError("No footage buffered yet — wait a few seconds.");
      return;
    }

    setIsSaving(true);
    setStatus("saving");

    try {
      // 1. Get location
      let lat: number | null = null;
      let lng: number | null = null;
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      }

      // 2. Create incident
      const startRes = await fetch("/api/incidents/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ latitude: lat, longitude: lng, triggerType: "dashcam" }),
      });
      if (!startRes.ok) throw new Error(`Start failed: ${startRes.status}`);
      const { incidentId } = await startRes.json();

      // 3. Upload each chunk sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const urlRes = await fetch("/api/incidents/chunk-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ incidentId, chunkIndex: i, contentType: chunk.blob.type || "video/webm" }),
        });
        if (!urlRes.ok) throw new Error(`chunk-url failed at index ${i}`);
        const { uploadUrl } = await urlRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": chunk.blob.type || "video/webm" },
          body: chunk.blob,
        });
        if (!uploadRes.ok) throw new Error(`R2 upload failed at chunk ${i}: ${uploadRes.status}`);
      }

      // 4. Mark complete
      const durationSeconds = chunks.length * (CHUNK_INTERVAL_MS / 1000);
      await fetch("/api/incidents/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ incidentId, durationSeconds }),
      });

      // 5. Clear buffer, return to standby
      bufferRef.current = [];
      setBufferChunks(0);
      setBufferSeconds(0);
      setSavedIncidents(prev => [
        { incidentId, savedAt: new Date(), chunks: chunks.length, durationSeconds },
        ...prev,
      ]);
      setStatus(statusRef.current === "saving" ? "standby" : "off");
    } catch (err: any) {
      setError(`Save failed: ${err?.message ?? "unknown error"}`);
      setStatus("standby");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  // Cleanup on unmount
  useEffect(() => () => { stopStream(); }, [stopStream]);

  return {
    status,
    bufferChunks,
    bufferSeconds,
    savedIncidents,
    error,
    isSaving,
    startDashcam,
    stopDashcam,
    saveIncident,
  };
}
