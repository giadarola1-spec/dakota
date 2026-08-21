import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Trash2, RotateCcw, Sliders, Eye, EyeOff, Sparkles, Check } from 'lucide-react';
import { WallpaperConfig, DEFAULT_WALLPAPER_CONFIG, optimizeImageFile, saveWallpaperImage } from '../utils/wallpaperStorage';

interface WallpaperSettingsSectionProps {
  config: WallpaperConfig;
  onChangeConfig: (newConfig: WallpaperConfig) => void;
  onRemoveWallpaper: () => void;
  isDarkMode: boolean;
  theme: any;
}

export const WallpaperSettingsSection: React.FC<WallpaperSettingsSectionProps> = ({
  config,
  onChangeConfig,
  onRemoveWallpaper,
  isDarkMode,
  theme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    setIsUploading(true);
    setStatusMessage('Optimizing wallpaper...');
    try {
      const optimized = await optimizeImageFile(file);
      await saveWallpaperImage(optimized);
      onChangeConfig({
        ...config,
        enabled: true,
        imageData: optimized,
      });
      setStatusMessage('Wallpaper updated!');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error('Failed to load wallpaper:', err);
      alert('Could not load image. Please try another file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleResetEffects = () => {
    onChangeConfig({
      ...config,
      opacity: DEFAULT_WALLPAPER_CONFIG.opacity,
      blur: DEFAULT_WALLPAPER_CONFIG.blur,
      vignette: DEFAULT_WALLPAPER_CONFIG.vignette,
      enabled: true,
    });
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-300">Custom Wallpaper</span>
        </div>
        {config.imageData && (
          <button
            type="button"
            onClick={() => onChangeConfig({ ...config, enabled: !config.enabled })}
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
              config.enabled
                ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                : 'border-zinc-700 text-zinc-500 bg-zinc-800/40'
            }`}
            title={config.enabled ? 'Hide wallpaper' : 'Show wallpaper'}
          >
            {config.enabled ? <Eye size={10} /> : <EyeOff size={10} />}
            {config.enabled ? 'Visible' : 'Hidden'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!config.imageData ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-4 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-400 bg-blue-500/15 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
              : isDarkMode
                ? 'border-zinc-700/80 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-800/50 text-zinc-400'
                : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 text-zinc-600'
          }`}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-zinc-700 shadow-xs'}`}>
              <Upload size={16} />
            </div>
            <p className="text-xs font-semibold text-zinc-200">
              {isUploading ? 'Processing...' : 'Upload Local Wallpaper'}
            </p>
            <p className="text-[10px] text-zinc-500">
              Click or drag an image here (PNG, JPG, WEBP)
            </p>
          </div>
        </div>
      ) : (
        <div className={`p-3 rounded-xl border ${theme.border} ${isDarkMode ? 'bg-black/25' : 'bg-zinc-50'} space-y-3`}>
          {/* Thumbnail Header */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className="w-12 h-9 rounded-lg bg-cover bg-center border border-white/10 shadow-xs flex-shrink-0 relative overflow-hidden"
                style={{ backgroundImage: `url(${config.imageData})` }}
              >
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">Local Background</p>
                <p className="text-[10px] text-zinc-500">Home & Results screens</p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg border border-zinc-700/60 hover:border-zinc-500 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-all"
                title="Change wallpaper"
              >
                Change
              </button>
              <button
                type="button"
                onClick={onRemoveWallpaper}
                className="p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                title="Remove wallpaper"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <Check size={11} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Sliders Controls */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-500/10">
            {/* Opacity Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">Opacity</span>
                <span className="font-mono text-zinc-300 text-[10px] font-semibold">{config.opacity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={config.opacity}
                onChange={(e) => onChangeConfig({ ...config, opacity: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Blur Effect Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">Blur Effect</span>
                <span className="font-mono text-zinc-300 text-[10px] font-semibold">{config.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={config.blur}
                onChange={(e) => onChangeConfig({ ...config, blur: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Vignette Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">Vignette</span>
                <span className="font-mono text-zinc-300 text-[10px] font-semibold">{config.vignette}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={config.vignette}
                onChange={(e) => onChangeConfig({ ...config, vignette: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Reset Defaults button */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleResetEffects}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Reset opacity, blur and vignette to defaults"
              >
                <RotateCcw size={10} />
                Reset effects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
