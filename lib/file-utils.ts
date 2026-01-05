/**
 * Shared file utilities for base64 operations
 * Handles MIME detection, local storage, and file conversion
 */

// Local storage keys
const STORAGE_KEYS = {
  ENCODER_FILE: "b64_encoder_file",
  VIEWER_FILE: "b64_viewer_file",
  DECODER_INPUT: "b64_decoder_input",
  ACTIVE_TAB: "b64_active_tab",
} as const;

// Export keys for external access
export type StorageKey = keyof typeof STORAGE_KEYS;

// MIME type signatures for detection
export const MIME_SIGNATURES: Record<string, { mime: string; ext: string }> = {
  JVBERi0: { mime: "application/pdf", ext: "pdf" },
  iVBORw0KGgo: { mime: "image/png", ext: "png" },
  "/9j/": { mime: "image/jpeg", ext: "jpg" },
  R0lGODlh: { mime: "image/gif", ext: "gif" },
  R0lGODdh: { mime: "image/gif", ext: "gif" },
  UEsDBBQA: { mime: "application/zip", ext: "zip" },
  UEsFBgA: { mime: "application/zip", ext: "zip" },
  PK: { mime: "application/zip", ext: "zip" },
  AAAA: { mime: "video/mp4", ext: "mp4" },
  GkXfo: { mime: "video/webm", ext: "webm" },
  Qk0: { mime: "image/bmp", ext: "bmp" },
  SUkqAA: { mime: "image/tiff", ext: "tiff" },
  TU0AKg: { mime: "image/tiff", ext: "tiff" },
  UklGR: { mime: "image/webp", ext: "webp" },
};

export interface StoredFile {
  name: string;
  type: string;
  size: number;
  data: string; // base64 data URL
  timestamp: number;
}

/**
 * Detect MIME type from base64 string
 */
export function detectMimeType(base64: string): { mime: string; ext: string } {
  // Check for data URI prefix
  const dataUriMatch = base64.match(/^data:([^;]+);base64,/);
  if (dataUriMatch) {
    const mime = dataUriMatch[1];
    const ext = mime.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin";
    return { mime, ext };
  }

  // Check binary signatures
  for (const [signature, typeInfo] of Object.entries(MIME_SIGNATURES)) {
    if (base64.startsWith(signature)) {
      return typeInfo;
    }
  }

  // Try to detect text-based content
  try {
    const decoded = atob(base64.replace(/^data:[^;]+;base64,/, ""));
    const trimmed = decoded.trim();

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      JSON.parse(trimmed);
      return { mime: "application/json", ext: "json" };
    }
    if (trimmed.startsWith("<?xml") || trimmed.startsWith("<")) {
      return { mime: "application/xml", ext: "xml" };
    }
    if (
      trimmed.startsWith("<!DOCTYPE html") ||
      trimmed.toLowerCase().includes("<html")
    ) {
      return { mime: "text/html", ext: "html" };
    }
    if (
      trimmed.includes("function") ||
      trimmed.includes("const ") ||
      trimmed.includes("let ")
    ) {
      return { mime: "application/javascript", ext: "js" };
    }
    // biome-ignore lint/suspicious/noControlCharactersInRegex: Binary detection
    if (/^[\x20-\x7E\s]+$/.test(decoded)) {
      return { mime: "text/plain", ext: "txt" };
    }
  } catch {
    // Not valid base64 or binary content
  }

  return { mime: "application/octet-stream", ext: "bin" };
}

/**
 * Clean base64 string by removing whitespace and data URI prefix
 */
export function cleanBase64(input: string): string {
  let cleaned = input.trim();
  const dataUriMatch = cleaned.match(/^data:[^;]+;base64,(.+)$/);
  if (dataUriMatch) {
    cleaned = dataUriMatch[1];
  }
  cleaned = cleaned.replace(/\s/g, "");
  return cleaned;
}

/**
 * Validate base64 string format
 */
export function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  const cleaned = cleanBase64(str);
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(cleaned) && cleaned.length % 4 === 0;
}

/**
 * Convert File to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Get raw base64 string without data URI prefix
 */
export function getRawBase64(dataUrl: string): string {
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : dataUrl;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${
    sizes[i]
  }`;
}

/**
 * Get file extension from filename or MIME type
 */
export function getExtension(filename: string, mimeType?: string): string {
  const fromFilename = filename.split(".").pop()?.toLowerCase();
  if (fromFilename && fromFilename.length <= 5) {
    return fromFilename;
  }
  if (mimeType) {
    return mimeType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin";
  }
  return "bin";
}

// Local Storage utilities with error handling
export const storage = {
  save(key: keyof typeof STORAGE_KEYS, file: StoredFile): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(file));
      return true;
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
      return false;
    }
  },

  saveString(key: keyof typeof STORAGE_KEYS, value: string): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS[key], value);
      return true;
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
      return false;
    }
  },

  load(key: keyof typeof STORAGE_KEYS): StoredFile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS[key]);
      if (!data) return null;
      return JSON.parse(data) as StoredFile;
    } catch {
      return null;
    }
  },

  loadString(key: keyof typeof STORAGE_KEYS): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS[key]);
    } catch {
      return null;
    }
  },

  remove(key: keyof typeof STORAGE_KEYS): void {
    try {
      localStorage.removeItem(STORAGE_KEYS[key]);
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Clear all app-related localStorage data.
   * Called on tab/window close to ensure privacy.
   */
  clearAll(): void {
    for (const key of Object.values(STORAGE_KEYS)) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    }
  },
};
