"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/file-dropzone";
import { FileTypeIndicator } from "@/components/file-type-indicator";
import { DocumentPreview } from "@/components/document-preview";
import { Eye, X, Download } from "lucide-react";
import {
  fileToBase64,
  formatBytes,
  getExtension,
  storage,
  type StoredFile,
} from "@/lib/file-utils";

export function FileViewer() {
  const [file, setFile] = useState<StoredFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = storage.load("VIEWER_FILE");
    if (stored) {
      setFile(stored);
    }
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setIsProcessing(true);

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
      storage.save("VIEWER_FILE", storedFile);
    } catch (error) {
      console.error("Failed to load file:", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
    storage.remove("VIEWER_FILE");
  }, []);

  const handleDownload = useCallback(() => {
    if (!file) return;

    const link = document.createElement("a");
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [file]);

  const extension = file ? getExtension(file.name, file.type) : "";

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <section aria-label="File upload">
        <FileDropzone
          onFileSelect={handleFileSelect}
          onClear={handleClear}
          icon={Eye}
          title={isProcessing ? "Loading..." : "Drop a file to view"}
          description="PDF, images, video, audio, text, JSON, and more"
          disabled={isProcessing}
          hasFile={!!file}
        />
      </section>

      {/* Preview Section */}
      {file && (
        <section
          aria-label="File preview"
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        >
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-0">
              {/* File Info Header */}
              <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <FileTypeIndicator
                    mimeType={file.type}
                    extension={extension}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.type} · {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    aria-label="Clear file"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Preview Area */}
              <div className="p-4">
                <DocumentPreview
                  document={{
                    data: file.data,
                    mimeType: file.type,
                    extension: extension,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
