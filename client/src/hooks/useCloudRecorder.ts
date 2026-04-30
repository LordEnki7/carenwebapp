import { useState, useRef, useCallback } from "react";

interface CloudRecorderOptions {
  onChunkUploaded?: (chunkIndex: number) => void;
  onError?: (err: string) => void;
  chunkIntervalMs?: number;
}

interface StartOptions {
  latitude?: number | null;
  longitude?: number | null;
  state?: string | null;
  address?: string | null;
  triggerType?: string;
}

export function useCloudRecorder(opts: CloudRecorderOptions = {}) {
  const { onChunkUploaded, onError, chunkIntervalMs = 15000 } = opts;

  const [isRecording, setIsRecording] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [chunkCount, setChunkCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const incidentIdRef = useRef<string | null>(null);
  const chunkIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const uploadChunk = useCallback(async (blob: Blob, chunkIndex: number) => {
    if (!incidentIdRef.current) return;
    try {
      const res = await fetch("/api/incidents/chunk-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          incidentId: incidentIdRef.current,
          chunkIndex,
          contentType: blob.type || "video/webm",
        }),
      });

      if (!res.ok) throw new Error(`Chunk URL error ${res.status}`);
      const { uploadUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": blob.type || "video/webm" },
        body: blob,
      });

      if (!uploadRes.ok) throw new Error(`Upload failed ${uploadRes.status}`);

      onChunkUploaded?.(chunkIndex);
      setChunkCount(c => c + 1);
      console.log(`[CLOUD] Chunk ${chunkIndex} uploaded (${Math.round(blob.size / 1024)}KB)`);
    } catch (err: any) {
      console.error("[CLOUD] Chunk upload failed:", err.message);
      onError?.(`Chunk ${chunkIndex} upload failed: ${err.message}`);
    }
  }, [onChunkUploaded, onError]);

  const startNewChunkCycle = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== "recording") return;

    const chunks: BlobEvent["data"][] = [];

    const handleData = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    mr.addEventListener("dataavailable", handleData, { once: false });

    // Stop current, collect, restart
    mr.stop();
    mr.addEventListener("stop", () => {
      mr.removeEventListener("dataavailable", handleData);
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: chunks[0].type || "video/webm" });
        const idx = chunkIndexRef.current++;
        uploadChunk(blob, idx);
      }

      // Restart recording on same stream
      if (streamRef.current && streamRef.current.active) {
        try { mr.start(); } catch {}
      }
    }, { once: true });
  }, [uploadChunk]);

  const start = useCallback(async (opts: StartOptions = {}) => {
    setError(null);
    chunkIndexRef.current = 0;
    setChunkCount(0);
    setElapsedSeconds(0);

    try {
      // 1. Request camera + mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      // 2. Create incident on backend
      const res = await fetch("/api/incidents/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          latitude: opts.latitude ?? null,
          longitude: opts.longitude ?? null,
          state: opts.state ?? null,
          address: opts.address ?? null,
          triggerType: opts.triggerType ?? "manual",
        }),
      });

      if (!res.ok) throw new Error(`Failed to create incident: ${res.status}`);
      const { incidentId: id } = await res.json();

      incidentIdRef.current = id;
      setIncidentId(id);

      // 3. Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;

      let currentChunks: Blob[] = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) currentChunks.push(e.data);
      };

      mr.onstop = () => {
        if (currentChunks.length > 0) {
          const blob = new Blob(currentChunks, { type: mimeType || "video/webm" });
          const idx = chunkIndexRef.current++;
          uploadChunk(blob, idx);
          currentChunks = [];
        }
      };

      mr.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Chunk interval: stop → onstop uploads → restart
      intervalRef.current = setInterval(() => {
        const rec = mediaRecorderRef.current;
        if (rec && rec.state === "recording") {
          rec.stop();
          // onstop will fire, upload, then we need to restart
          rec.addEventListener("stop", () => {
            if (streamRef.current?.active) {
              try { rec.start(); } catch {}
            }
          }, { once: true });
        }
      }, chunkIntervalMs);

      console.log(`[CLOUD] Recording started — incident ${id}`);
    } catch (err: any) {
      const msg = err.message || "Recording failed";
      setError(msg);
      onError?.(msg);
      console.error("[CLOUD] Start error:", err);
    }
  }, [chunkIntervalMs, uploadChunk, onError]);

  const stop = useCallback(async (notes?: string) => {
    // Clear timers
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const mr = mediaRecorderRef.current;
    if (mr && mr.state === "recording") {
      mr.stop();
    }

    // Stop all tracks
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    // Mark incident complete on backend
    if (incidentIdRef.current) {
      try {
        await fetch("/api/incidents/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            incidentId: incidentIdRef.current,
            durationSeconds: duration,
            notes: notes || null,
          }),
        });
      } catch (err) {
        console.error("[CLOUD] End incident error:", err);
      }
    }

    setIsRecording(false);
    console.log(`[CLOUD] Recording stopped — ${duration}s, ${chunkIndexRef.current} chunks`);

    const savedId = incidentIdRef.current;
    incidentIdRef.current = null;
    return savedId;
  }, []);

  return {
    isRecording,
    incidentId,
    chunkCount,
    error,
    elapsedSeconds,
    start,
    stop,
  };
}
