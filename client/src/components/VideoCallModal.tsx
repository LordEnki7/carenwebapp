import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Video, PhoneOff, Loader2, Clock, CheckCircle, XCircle, PhoneCall } from "lucide-react";

interface VideoCallModalProps {
  attorney: {
    id: number;
    firstName: string;
    lastName: string;
    firmName: string;
    availabilityStatus: string;
  };
  incidentId?: string;
  incidentType?: string;
  incidentState?: string;
  open: boolean;
  onClose: () => void;
}

export default function VideoCallModal({ attorney, incidentId, incidentType, incidentState, open, onClose }: VideoCallModalProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [stage, setStage] = useState<"confirm" | "waiting" | "active" | "ended" | "declined">("confirm");
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: activeCall } = useQuery<any>({
    queryKey: ["/api/video-calls/my-active"],
    refetchInterval: stage === "waiting" ? 3000 : false,
    enabled: stage === "waiting" && open,
  });

  useEffect(() => {
    if (!activeCall || stage !== "waiting") return;
    if (activeCall.status === "active") {
      setRoomUrl(activeCall.roomUrl);
      setStage("active");
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else if (activeCall.status === "declined") {
      setStage("declined");
    }
  }, [activeCall, stage]);

  useEffect(() => {
    if (!open) {
      setStage("confirm");
      setActiveCallId(null);
      setRoomUrl(null);
      setNote("");
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const requestCall = useMutation({
    mutationFn: () => apiRequest("POST", "/api/video-calls/request", {
      attorneyId: attorney.id,
      incidentId,
      incidentType,
      incidentState,
      userNote: note,
    }),
    onSuccess: (data: any) => {
      setActiveCallId(data.id);
      setStage("waiting");
    },
    onError: () => toast({ title: "Failed to request call", variant: "destructive" }),
  });

  const endCall = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/video-calls/${activeCallId}/end`, {}),
    onSuccess: () => {
      setStage("ended");
      if (timerRef.current) clearInterval(timerRef.current);
      qc.invalidateQueries({ queryKey: ["/api/video-calls/my-active"] });
    },
  });

  const cancelCall = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/video-calls/${activeCallId}/decline`, {}),
    onSuccess: () => {
      onClose();
      qc.invalidateQueries({ queryKey: ["/api/video-calls/my-active"] });
    },
  });

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg w-full p-0 overflow-hidden">

        {/* CONFIRM STAGE */}
        {stage === "confirm" && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <Video className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Request Emergency Call</h2>
                <p className="text-gray-400 text-sm">Connect live with {attorney.firstName} {attorney.lastName}</p>
              </div>
            </div>

            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-1">
              <p className="text-white font-semibold">{attorney.firstName} {attorney.lastName}</p>
              <p className="text-cyan-400 text-sm">{attorney.firmName}</p>
              {incidentType && (
                <p className="text-gray-400 text-xs mt-2">
                  Incident: <span className="text-white">{incidentType.replace(/_/g, " ")}</span>
                  {incidentState && <span className="text-gray-400"> · {incidentState}</span>}
                </p>
              )}
            </div>

            <div>
              <label className="text-gray-300 text-sm font-medium block mb-2">Brief note for the attorney <span className="text-gray-500">(optional)</span></label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I was pulled over and need to know my rights immediately…"
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 resize-none"
                rows={3}
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
              ⚖️ This call is for general legal information only. An attorney-client relationship is not formed by this call. Your conversations are private and encrypted.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 gap-2"
                onClick={() => requestCall.mutate()}
                disabled={requestCall.isPending}
              >
                {requestCall.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                Request Call
              </Button>
            </div>
          </div>
        )}

        {/* WAITING STAGE */}
        {stage === "waiting" && (
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center">
                <PhoneCall className="w-9 h-9 text-cyan-400" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/40 animate-ping" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Waiting for {attorney.firstName}…</h2>
              <p className="text-gray-400 text-sm mt-1">The attorney has been notified and will join shortly</p>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Average response time: under 5 minutes</span>
            </div>
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                SMS notification sent to attorney
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Secure video room ready
              </div>
            </div>
            <Button
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => cancelCall.mutate()}
              disabled={cancelCall.isPending}
            >
              <PhoneOff className="w-4 h-4 mr-2" /> Cancel Request
            </Button>
          </div>
        )}

        {/* ACTIVE STAGE */}
        {stage === "active" && roomUrl && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white text-sm font-semibold">Live — {attorney.firstName} {attorney.lastName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-xs font-mono">{formatTime(elapsedSeconds)}</span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 px-3 text-xs gap-1"
                  onClick={() => endCall.mutate()}
                  disabled={endCall.isPending}
                >
                  <PhoneOff className="w-3 h-3" /> End
                </Button>
              </div>
            </div>
            <iframe
              src={roomUrl}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full"
              style={{ height: "480px", border: "none" }}
              title="Video Call"
            />
            <div className="px-4 py-2 bg-gray-800/60 text-center">
              <p className="text-gray-500 text-xs">This call is encrypted and private. Not recorded by C.A.R.E.N.</p>
            </div>
          </div>
        )}

        {/* ENDED STAGE */}
        {stage === "ended" && (
          <div className="p-8 flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Call Ended</h2>
              <p className="text-gray-400 text-sm mt-1">Duration: {formatTime(elapsedSeconds)}</p>
            </div>
            <p className="text-gray-400 text-sm max-w-sm">
              Your call with {attorney.firstName} {attorney.lastName} has ended. If you need further assistance, you can request another call or contact them directly.
            </p>
            <Button className="bg-cyan-600 hover:bg-cyan-700 w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        {/* DECLINED STAGE */}
        {stage === "declined" && (
          <div className="p-8 flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Call Unavailable</h2>
              <p className="text-gray-400 text-sm mt-1">{attorney.firstName} is unable to take this call right now</p>
            </div>
            <p className="text-gray-400 text-sm max-w-sm">
              Try another attorney in the network or reach out by phone directly.
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 border-gray-600 text-gray-300" onClick={onClose}>Close</Button>
              <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={() => { setStage("confirm"); setActiveCallId(null); }}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
