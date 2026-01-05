"use client";

import { useState, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentPreview } from "@/components/document-preview";
import { FileTypeIndicator } from "@/components/file-type-indicator";
import { ClipboardPaste, Download, X, AlertCircle } from "lucide-react";
import {
  detectMimeType,
  cleanBase64,
  isValidBase64,
  formatBytes,
} from "@/lib/file-utils";

interface DecodedDocument {
  data: string;
  mimeType: string;
  extension: string;
  filename: string;
  size: number;
}

interface Base64DecoderProps {
  /** When true, renders without header/footer for use inside tabs */
  embedded?: boolean;
}

export function Base64Decoder({ embedded = false }: Base64DecoderProps) {
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

  const content = (
    <div className="space-y-6">
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
            <ClipboardPaste className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
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
                  <Download className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
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
    </div>
  );

  // Return just the content when embedded
  if (embedded) {
    return content;
  }

  // Return full standalone version (for backwards compatibility)
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <main>{content}</main>
      </div>
    </div>
  );
}
