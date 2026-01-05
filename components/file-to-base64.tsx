"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/file-dropzone";
import { FileTypeIndicator } from "@/components/file-type-indicator";
import { Copy, Check, X, FileUp, Download } from "lucide-react";
import {
  fileToBase64,
  formatBytes,
  getRawBase64,
  getExtension,
  storage,
  type StoredFile,
} from "@/lib/file-utils";

export function FileToBase64() {
  const [file, setFile] = useState<StoredFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyMode, setCopyMode] = useState<"dataUri" | "raw">("raw");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = storage.load("ENCODER_FILE");
    if (stored) {
      setFile(stored);
    }
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setIsProcessing(true);
    setCopied(false);

    try {
      const base64Data = await fileToBase64(selectedFile);
      const storedFile: StoredFile = {
        name: selectedFile.name,
        type: selectedFile.type || "application/octet-stream",
        size: selectedFile.size,
        data: base64Data,
        timestamp: Date.now(),
      };

      setFile(storedFile);
      storage.save("ENCODER_FILE", storedFile);
    } catch (error) {
      console.error("Failed to convert file:", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
    setCopied(false);
    storage.remove("ENCODER_FILE");
  }, []);

  const handleCopy = useCallback(async () => {
    if (!file) return;

    const textToCopy = copyMode === "raw" ? getRawBase64(file.data) : file.data;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [file, copyMode]);

  const handleDownloadBase64 = useCallback(() => {
    if (!file) return;

    const textToDownload =
      copyMode === "raw" ? getRawBase64(file.data) : file.data;
    const blob = new Blob([textToDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.name}.base64.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [file, copyMode]);

  const base64Length = file ? getRawBase64(file.data).length : 0;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <section aria-label="File upload">
        <FileDropzone
          onFileSelect={handleFileSelect}
          onClear={handleClear}
          icon={FileUp}
          title={isProcessing ? "Converting..." : "Drop a file to convert"}
          description="Any file type supported"
          disabled={isProcessing}
          hasFile={!!file}
        />
      </section>

      {/* Result Section */}
      {file && (
        <section
          aria-label="Converted base64 result"
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        >
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-0">
              {/* File Info Header */}
              <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <FileTypeIndicator
                    mimeType={file.type}
                    extension={getExtension(file.name, file.type)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)} → {formatBytes(base64Length)}{" "}
                      base64
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  aria-label="Clear file"
                  className="shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>

              {/* Base64 Output */}
              <div className="p-4 space-y-4">
                {/* Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Format:</span>
                  <div className="inline-flex items-center rounded-lg bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => setCopyMode("raw")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        copyMode === "raw"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Raw Base64
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopyMode("dataUri")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        copyMode === "dataUri"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Data URI
                    </button>
                  </div>
                </div>

                {/* Base64 Preview */}
                <div className="relative">
                  <pre className="p-4 text-xs font-mono text-foreground bg-muted/30 rounded-lg overflow-x-auto max-h-48 overflow-y-auto border border-border">
                    <code className="break-all">
                      {copyMode === "raw"
                        ? getRawBase64(file.data).slice(0, 2000)
                        : file.data.slice(0, 2000)}
                      {(copyMode === "raw"
                        ? getRawBase64(file.data)
                        : file.data
                      ).length > 2000 && "..."}
                    </code>
                  </pre>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1"
                    size="lg"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Copy {copyMode === "raw" ? "Base64" : "Data URI"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleDownloadBase64}
                    aria-label="Download as text file"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
