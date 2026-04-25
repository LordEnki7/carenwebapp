function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
}

async function getCanvasSignal(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, 0, 200, 60);
    ctx.fillStyle = '#0f172a';
    ctx.fillText('CAREN\u2122 DeviceAuth', 4, 12);
    ctx.fillStyle = 'rgba(99,102,241,0.8)';
    ctx.fillText('\u2603\u2603\u2603 \u00e9\u00e0\u00e8\u00f1', 4, 34);
    ctx.arc(100, 30, 10, 0, Math.PI * 2);
    ctx.stroke();
    const data = canvas.toDataURL('image/png');
    return data.slice(data.length - 80);
  } catch {
    return '';
  }
}

function getWebGLSignal(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return gl.getParameter(gl.VERSION) || '';
    return [
      gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
      gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
    ].join('|');
  } catch {
    return '';
  }
}

async function getCryptoSignal(): Promise<string> {
  try {
    if (!crypto?.subtle) return '';
    const key = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
    const exported = await crypto.subtle.exportKey('jwk', (key as CryptoKeyPair).publicKey);
    return (exported.x || '').slice(0, 12);
  } catch {
    return '';
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  const [canvasSignal, cryptoSignal] = await Promise.all([
    getCanvasSignal(),
    getCryptoSignal(),
  ]);

  const signals = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}`,
    `${new Date().getTimezoneOffset()}`,
    navigator.language || '',
    navigator.languages?.join(',') || '',
    String((navigator as any).hardwareConcurrency || ''),
    String((navigator as any).deviceMemory || ''),
    navigator.platform || '',
    getWebGLSignal(),
    canvasSignal,
    cryptoSignal,
    String(window.devicePixelRatio || ''),
    String((screen as any).pixelDepth || ''),
  ];

  const raw = signals.join('||');
  const hash = djb2Hash(raw);

  // Secondary hash over the first for collision resistance
  const hash2 = djb2Hash(hash + raw.slice(0, 64));

  return `fp_${hash}_${hash2}`;
}
