"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  accept?: string;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  disabled?: boolean;
  hasFile?: boolean;
  className?: string;
}

export function FileDropzone({
  onFileSelect,
  onClear,
  accept = "*/*",
  icon: Icon = Upload,
  title = "Drop your file here",
  description = "or click to browse",
  disabled = false,
  hasFile = false,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFile]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setError(null);
      onClear?.();
    },
    [onClear]
  );

  return (
    <div className={cn("relative", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 p-8 sm:p-12 border-2 border-dashed rounded-lg transition-all cursor-pointer",
          isDragging
            ? "border-foreground/50 bg-muted/50"
            : "border-border hover:border-foreground/30 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed",
          hasFile && "border-foreground/20 bg-muted/20"
        )}
        aria-label={title}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="sr-only"
          disabled={disabled}
          aria-hidden="true"
        />

        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl transition-colors",
            isDragging
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>

        {hasFile && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute top-2 right-2"
            aria-label="Clear file"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
