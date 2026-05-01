import { useRef, useState, useCallback, useEffect } from "react";

export type BleStatus = "unsupported" | "idle" | "scanning" | "connected" | "disconnected";

interface UseBluetooth {
  bleStatus: BleStatus;
  bleDeviceName: string | null;
  keyboardTriggerEnabled: boolean;
  lastKeyTrigger: string | null;
  pairBleDevice: (onTrigger: () => void) => Promise<void>;
  disconnectBle: () => void;
  toggleKeyboardTrigger: (enabled: boolean, onTrigger: () => void) => void;
  isBleSupported: boolean;
}

// Keys that common BT shutter remotes fire
const TRIGGER_KEYS = new Set(["VolumeUp", " ", "Enter", "MediaPlayPause"]);

export function useBluetooth(): UseBluetooth {
  const isBleSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;

  const [bleStatus, setBleStatus] = useState<BleStatus>(isBleSupported ? "idle" : "unsupported");
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  const [keyboardTriggerEnabled, setKeyboardTriggerEnabled] = useState(false);
  const [lastKeyTrigger, setLastKeyTrigger] = useState<string | null>(null);

  const bleDeviceRef = useRef<any>(null);
  const bleCharRef = useRef<any>(null);
  const keyListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  const triggerCallbackRef = useRef<(() => void) | null>(null);

  // ── BLE pairing ──────────────────────────────────────────────────────────
  const pairBleDevice = useCallback(async (onTrigger: () => void) => {
    if (!isBleSupported) return;
    triggerCallbackRef.current = onTrigger;
    setBleStatus("scanning");

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service", "human_interface_device", "0000ffe0-0000-1000-8000-00805f9b34fb"],
      });

      bleDeviceRef.current = device;
      setBleDeviceName(device.name ?? "Bluetooth Device");

      device.addEventListener("gattserverdisconnected", () => {
        setBleStatus("disconnected");
        setBleDeviceName(null);
      });

      // Connect to GATT
      const server = await device.gatt.connect();
      setBleStatus("connected");

      // Try to find a notifiable characteristic (best-effort — many HID remotes don't expose one)
      try {
        const services = await server.getPrimaryServices();
        for (const svc of services) {
          try {
            const chars = await svc.getCharacteristics();
            for (const char of chars) {
              if (char.properties.notify) {
                await char.startNotifications();
                char.addEventListener("characteristicvaluechanged", () => {
                  triggerCallbackRef.current?.();
                });
                bleCharRef.current = char;
                break;
              }
            }
          } catch {}
          if (bleCharRef.current) break;
        }
      } catch {
        // No accessible notifications — BT remote will still work via keyboard events
      }
    } catch (err: any) {
      if (err?.name === "NotFoundError") {
        setBleStatus("idle"); // user cancelled
      } else {
        setBleStatus("disconnected");
      }
    }
  }, [isBleSupported]);

  const disconnectBle = useCallback(() => {
    try { bleDeviceRef.current?.gatt?.disconnect(); } catch {}
    bleDeviceRef.current = null;
    bleCharRef.current = null;
    setBleStatus("idle");
    setBleDeviceName(null);
  }, []);

  // ── Keyboard trigger ──────────────────────────────────────────────────────
  const toggleKeyboardTrigger = useCallback((enabled: boolean, onTrigger: () => void) => {
    // Remove existing listener first
    if (keyListenerRef.current) {
      window.removeEventListener("keydown", keyListenerRef.current);
      keyListenerRef.current = null;
    }

    setKeyboardTriggerEnabled(enabled);

    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (!TRIGGER_KEYS.has(e.key)) return;
      // Don't fire inside inputs
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      e.preventDefault();
      setLastKeyTrigger(e.key === " " ? "Space" : e.key);
      onTrigger();
    };

    keyListenerRef.current = handler;
    window.addEventListener("keydown", handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    disconnectBle();
    if (keyListenerRef.current) window.removeEventListener("keydown", keyListenerRef.current);
  }, [disconnectBle]);

  return {
    bleStatus,
    bleDeviceName,
    keyboardTriggerEnabled,
    lastKeyTrigger,
    pairBleDevice,
    disconnectBle,
    toggleKeyboardTrigger,
    isBleSupported,
  };
}

// ── Camera device enumeration (used by Dashcam page) ─────────────────────────
export async function listVideoDevices(): Promise<MediaDeviceInfo[]> {
  try {
    // Need at least one permission grant first for labels to appear
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => s.getTracks().forEach(t => t.stop()))
      .catch(() => {});
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === "videoinput");
  } catch {
    return [];
  }
}
