// safeStorage.js - Safe in-memory fallback for localStorage & sessionStorage
// Prevents DOMException / SecurityError: "Failed to read the 'sessionStorage' / 'localStorage' property from 'Window': Access is denied for this document"
// occurring in private browsing mode, restricted webviews, or when third-party cookies/storage are blocked.

class MemoryStorage {
  constructor() {
    this._data = new Map();
  }
  getItem(key) {
    const val = this._data.get(String(key));
    return val !== undefined ? val : null;
  }
  setItem(key, value) {
    this._data.set(String(key), String(value));
  }
  removeItem(key) {
    this._data.delete(String(key));
  }
  clear() {
    this._data.clear();
  }
  key(index) {
    const keys = Array.from(this._data.keys());
    return keys[index] || null;
  }
  get length() {
    return this._data.size;
  }
}

const memorySession = new MemoryStorage();
const memoryLocal = new MemoryStorage();

// Safely test whether native window[type] is accessible and operational
function getNativeStorage(type) {
  try {
    if (typeof window === 'undefined') return null;
    const storage = window[type];
    if (!storage) return null;
    const testKey = '__vpt_test_storage__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

export const safeSessionStorage = {
  getItem(key) {
    try {
      const storage = getNativeStorage('sessionStorage');
      if (storage) return storage.getItem(key);
    } catch {}
    return memorySession.getItem(key);
  },
  setItem(key, value) {
    try {
      const storage = getNativeStorage('sessionStorage');
      if (storage) {
        storage.setItem(key, value);
        return;
      }
    } catch {}
    memorySession.setItem(key, value);
  },
  removeItem(key) {
    try {
      const storage = getNativeStorage('sessionStorage');
      if (storage) {
        storage.removeItem(key);
        return;
      }
    } catch {}
    memorySession.removeItem(key);
  },
  clear() {
    try {
      const storage = getNativeStorage('sessionStorage');
      if (storage) {
        storage.clear();
        return;
      }
    } catch {}
    memorySession.clear();
  }
};

export const safeLocalStorage = {
  getItem(key) {
    try {
      const storage = getNativeStorage('localStorage');
      if (storage) return storage.getItem(key);
    } catch {}
    return memoryLocal.getItem(key);
  },
  setItem(key, value) {
    try {
      const storage = getNativeStorage('localStorage');
      if (storage) {
        storage.setItem(key, value);
        return;
      }
    } catch {}
    memoryLocal.setItem(key, value);
  },
  removeItem(key) {
    try {
      const storage = getNativeStorage('localStorage');
      if (storage) {
        storage.removeItem(key);
        return;
      }
    } catch {}
    memoryLocal.removeItem(key);
  },
  clear() {
    try {
      const storage = getNativeStorage('localStorage');
      if (storage) {
        storage.clear();
        return;
      }
    } catch {}
    memoryLocal.clear();
  }
};

// Polyfill window.sessionStorage & window.localStorage if accessing them throws SecurityError
if (typeof window !== 'undefined') {
  try {
    // Check if accessing window.sessionStorage throws
    const _ = window.sessionStorage;
  } catch {
    try {
      Object.defineProperty(window, 'sessionStorage', {
        value: safeSessionStorage,
        configurable: true,
        writable: true
      });
    } catch {}
  }

  try {
    // Check if accessing window.localStorage throws
    const _ = window.localStorage;
  } catch {
    try {
      Object.defineProperty(window, 'localStorage', {
        value: safeLocalStorage,
        configurable: true,
        writable: true
      });
    } catch {}
  }
}
