"use client";

import { useState, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentPreview } from "@/components/document-preview";
import { FileTypeIndicator } from "@/components/file-type-indicator";
import {
  ClipboardPaste,
  Download,
  X,
  FileCode2,
  AlertCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface DecodedDocument {
  data: string;
  mimeType: string;
  extension: string;
  filename: string;
  size: number;
}

const MIME_SIGNATURES: Record<string, { mime: string; ext: string }> = {
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

function detectMimeType(base64: string): { mime: string; ext: string } {
  const dataUriMatch = base64.match(/^data:([^;]+);base64,/);
  if (dataUriMatch) {
    const mime = dataUriMatch[1];
    const ext = mime.split("/")[1] || "bin";
    return { mime, ext };
  }

  for (const [signature, typeInfo] of Object.entries(MIME_SIGNATURES)) {
    if (base64.startsWith(signature)) {
      return typeInfo;
    }
  }

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
    if (/^[\x20-\x7E\s]+$/.test(decoded)) {
      return { mime: "text/plain", ext: "txt" };
    }
  } catch {
    // Not valid base64 or binary content
  }

  return { mime: "application/octet-stream", ext: "bin" };
}

function cleanBase64(input: string): string {
  let cleaned = input.trim();
  const dataUriMatch = cleaned.match(/^data:[^;]+;base64,(.+)$/);
  if (dataUriMatch) {
    cleaned = dataUriMatch[1];
  }
  cleaned = cleaned.replace(/\s/g, "");
  return cleaned;
}

function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  const cleaned = cleanBase64(str);
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(cleaned) && cleaned.length % 4 === 0;
}

export function Base64Decoder() {
  const [input, setInput] = useState("");
  const [document, setDocument] = useState<DecodedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processBase64 = useCallback(() => {
    setError(null);
    setDocument(null);
    setIsProcessing(true);

    try {
      const cleaned = cleanBase64(input);

      if (!isValidBase64(input)) {
        throw new Error("Invalid base64 string. Please check your input.");
      }

      const { mime, ext } = detectMimeType(cleaned);
      const padding = (cleaned.match(/=+$/) || [""])[0].length;
      const size = Math.floor((cleaned.length * 3) / 4) - padding;
      const dataUrl = `data:${mime};base64,${cleaned}`;

      setDocument({
        data: dataUrl,
        mimeType: mime,
        extension: ext,
        filename: `document.${ext}`,
        size,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to decode base64 string"
      );
    } finally {
      setIsProcessing(false);
    }
  }, [input]);

  const handleDownload = useCallback(() => {
    if (!document) return;
    const link = window.document.createElement("a");
    link.href = document.data;
    link.download = document.filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  }, [document]);

  const handleClear = useCallback(() => {
    setInput("");
    setDocument(null);
    setError(null);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      setError("Failed to read from clipboard");
    }
  }, []);

  // Generate unique IDs for accessibility
  const inputId = useId();
  const errorId = useId();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-foreground"
                aria-hidden="true"
              >
                <FileCode2 className="w-4 h-4 text-background" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                Base64 Decoder & Viewer
              </h1>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Decode, preview, and download base64 encoded documents
          </p>
        </header>

        <main className="space-y-6">
          {/* Input Section */}
          <section aria-labelledby="input-section">
            <div className="flex items-center justify-between mb-2.5">
              <label
                htmlFor={inputId}
                id="input-section"
                className="text-sm font-medium text-foreground"
              >
                Base64 String
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePaste}
                className="h-7 px-2 text-xs"
              >
                <ClipboardPaste
                  className="w-3.5 h-3.5 mr-1"
                  aria-hidden="true"
                />
                <span>Paste</span>
              </Button>
            </div>

            <textarea
              id={inputId}
              placeholder="Paste your base64 string here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error ? "true" : undefined}
              className="w-full h-36 sm:h-40 px-4 py-3 font-mono text-sm bg-background text-foreground border border-border rounded-lg resize-none transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background placeholder:text-muted-foreground/50"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />

            {error && (
              <div
                id={errorId}
                role="alert"
                className="flex items-start gap-2 mt-3 text-sm text-destructive"
              >
                <AlertCircle
                  className="w-4 h-4 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 mt-4">
              <Button
                type="button"
                onClick={processBase64}
                disabled={!input.trim() || isProcessing}
                size="lg"
                className="flex-1"
              >
                {isProcessing ? "Processing..." : "Decode & Preview"}
              </Button>
              {(input || document) && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleClear}
                  aria-label="Clear input"
                  className="h-10 w-10"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </section>

          {/* Result Section */}
          {document && (
            <section
              aria-label="Decoded document preview"
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
            >
              <Card className="overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  {/* File Info Header */}
                  <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileTypeIndicator
                        mimeType={document.mimeType}
                        extension={document.extension}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {document.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {document.mimeType} · {formatBytes(document.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                    >
                      <Download
                        className="w-3.5 h-3.5 mr-1.5"
                        aria-hidden="true"
                      />
                      <span>Download</span>
                    </Button>
                  </div>

                  {/* Preview Area */}
                  <div className="p-4">
                    <DocumentPreview document={document} />
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 sm:mt-16 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground/70 text-center">
            Supports PDF, images, video, audio, JSON, XML, HTML, and text
          </p>
        </footer>
      </div>

      {/* X/Twitter floating button */}
      <a
        href="https://x.com/darwinbatres"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center justify-center w-10 h-10 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-lg"
        aria-label="Follow @darwinbatres on X"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${
    sizes[i]
  }`;
}
