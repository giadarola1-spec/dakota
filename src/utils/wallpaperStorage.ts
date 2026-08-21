// Utilities for saving, loading, and optimizing local custom wallpapers

export interface WallpaperConfig {
  enabled: boolean;
  imageData: string | null;
  opacity: number; // 0 to 100
  blur: number; // 0 to 30px
  vignette: number; // 0 to 100
}

export const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
  enabled: true,
  imageData: null,
  opacity: 35,
  blur: 0,
  vignette: 30,
};

const DB_NAME = 'dakota_wallpaper_db';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';
const WALLPAPER_KEY = 'active_wallpaper';
const CONFIG_KEY = 'wallpaper_config';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWallpaperImage(dataUrl: string | null): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    if (dataUrl) {
      store.put(dataUrl, WALLPAPER_KEY);
    } else {
      store.delete(WALLPAPER_KEY);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Fallback to localStorage for wallpaper image:', err);
    try {
      if (dataUrl) {
        localStorage.setItem('dakota_wallpaper_img', dataUrl);
      } else {
        localStorage.removeItem('dakota_wallpaper_img');
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }
}

export async function loadWallpaperImage(): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(WALLPAPER_KEY);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result as string);
        } else {
          // Check fallback localStorage
          const local = localStorage.getItem('dakota_wallpaper_img');
          resolve(local);
        }
      };
      request.onerror = () => {
        const local = localStorage.getItem('dakota_wallpaper_img');
        resolve(local);
      };
    });
  } catch (err) {
    console.warn('IndexedDB read error, using localStorage:', err);
    return localStorage.getItem('dakota_wallpaper_img');
  }
}

export async function optimizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Failed to read file'));
        return;
      }

      // If SVG or small image (< 1MB), return directly
      if (file.type === 'image/svg+xml' || file.size < 1.2 * 1024 * 1024) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 2560;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as WebP or JPEG
        const optimizedUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(optimizedUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
