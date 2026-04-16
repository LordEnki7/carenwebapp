import { useState } from 'react';
import { Smartphone, RefreshCw, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGES = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Record', path: '/record' },
  { label: 'Emergency', path: '/emergency-pullover' },
  { label: 'Rights', path: '/rights' },
  { label: 'Attorneys', path: '/attorneys' },
  { label: 'Plans', path: '/plans' },
  { label: 'Settings', path: '/settings' },
  { label: 'Community', path: '/community' },
  { label: 'Help', path: '/help' },
];

export default function MobilePreview() {
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [inputPath, setInputPath] = useState('/dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [device, setDevice] = useState<'iphone14' | 'iphone-se' | 'pixel'>('iphone14');

  const devices = {
    iphone14:  { label: 'iPhone 14',  width: 390, height: 844 },
    'iphone-se': { label: 'iPhone SE', width: 375, height: 667 },
    pixel:     { label: 'Pixel 7',    width: 412, height: 915 },
  };

  const { width, height } = devices[device];

  const navigate = (path: string) => {
    setCurrentPath(path);
    setInputPath(path);
    setRefreshKey(k => k + 1);
  };

  const refresh = () => setRefreshKey(k => k + 1);

  const iframeSrc = `${window.location.origin}${currentPath}`;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-8 px-4 gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Smartphone className="text-cyan-400 w-6 h-6" />
        <h1 className="text-xl font-bold text-white">Mobile Preview</h1>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">dev only</span>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 justify-center">
        {/* Device picker */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(Object.entries(devices) as [typeof device, typeof devices[typeof device]][]).map(([key, d]) => (
            <button
              key={key}
              onClick={() => setDevice(key)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                device === key
                  ? 'bg-cyan-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* URL bar */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5 border border-gray-700">
          <span className="text-gray-500 text-xs">{window.location.origin}</span>
          <input
            type="text"
            value={inputPath}
            onChange={e => setInputPath(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') navigate(inputPath); }}
            className="bg-transparent text-white text-xs outline-none w-36"
            placeholder="/dashboard"
          />
        </div>

        {/* Refresh & open */}
        <button
          onClick={refresh}
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-all"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
        <a
          href={iframeSrc}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-all"
          title="Open in full tab"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Quick-nav pills */}
      <div className="flex flex-wrap gap-1.5 justify-center max-w-2xl">
        {PAGES.map(p => (
          <button
            key={p.path}
            onClick={() => navigate(p.path)}
            className={`text-xs px-3 py-1 rounded-full border transition-all font-medium ${
              currentPath === p.path
                ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Phone shell + iframe */}
      <div
        className="relative flex-shrink-0"
        style={{ width: width + 24, height: height + 56 }}
      >
        {/* Phone border */}
        <div
          className="absolute inset-0 rounded-[3rem] border-4 border-gray-600 bg-black shadow-2xl shadow-black/60 pointer-events-none z-10"
          style={{ borderRadius: '3rem' }}
        />
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20 pointer-events-none" />
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-600 rounded-full z-20 pointer-events-none" />

        {/* iframe */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: 28,
            left: 12,
            width,
            height: height - 8,
            borderRadius: '2.5rem',
          }}
        >
          <iframe
            key={refreshKey}
            src={iframeSrc}
            width={width}
            height={height - 8}
            style={{ border: 'none', display: 'block' }}
            title="Mobile Preview"
          />
        </div>
      </div>

      <p className="text-gray-600 text-xs text-center max-w-sm">
        This preview is for layout testing only. Camera and microphone access require opening in a full browser tab.
      </p>
    </div>
  );
}
