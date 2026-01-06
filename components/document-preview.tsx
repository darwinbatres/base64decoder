"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// PDF.js library type (loaded from CDN)
interface PdfjsLib {
  getDocument: (params: { data: Uint8Array }) => {
    promise: Promise<PDFDocumentProxy>;
  };
  GlobalWorkerOptions: { workerSrc: string };
}

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getViewport: (params: { scale: number }) => PageViewport;
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PageViewport;
  }) => { promise: Promise<void> };
}

interface DocumentPreviewProps {
  document: {
    data: string;
    mimeType: string;
    extension: string;
  };
}

interface PDFCoordinates {
  /** X position in PDF coordinate system (origin bottom-left, in points) */
  pdfX: number;
  /** Y position in PDF coordinate system (origin bottom-left, in points) */
  pdfY: number;
  /** X position on canvas in pixels */
  canvasX: number;
  /** Y position on canvas in pixels */
  canvasY: number;
  /** Current page number */
  page: number;
  /** Page width in PDF points */
  pageWidth: number;
  /** Page height in PDF points */
  pageHeight: number;
}

interface PageViewport {
  width: number;
  height: number;
  scale: number;
  rotation: number;
  viewBox: [number, number, number, number]; // [x1, y1, x2, y2] in PDF points
  transform: [number, number, number, number, number, number]; // 6-element transform matrix
  convertToPdfPoint?: (x: number, y: number) => [number, number];
}

/**
 * Convert canvas coordinates to PDF coordinates.
 * PDF coordinate system: origin at bottom-left, Y increases upward (in points, 1pt = 1/72 inch)
 * Canvas coordinate system: origin at top-left, Y increases downward (in pixels)
 */
function canvasToPdfCoordinates(
  canvasX: number,
  canvasY: number,
  viewport: PageViewport
): { pdfX: number; pdfY: number } {
  // If the viewport has the built-in method, use it
  if (viewport.convertToPdfPoint) {
    const [pdfX, pdfY] = viewport.convertToPdfPoint(canvasX, canvasY);
    return { pdfX, pdfY };
  }

  // Manual conversion using the inverse of the viewport transform
  // The viewport.transform converts PDF coords to canvas coords
  // We need the inverse to go from canvas to PDF
  const [a, b, c, d, e, f] = viewport.transform;

  // Inverse of 2D affine transform matrix [a, b, c, d, e, f]
  // | a  c  e |     | d/det  -c/det  (c*f - d*e)/det |
  // | b  d  f | =>  | -b/det  a/det  (b*e - a*f)/det |
  // | 0  0  1 |     | 0       0      1               |
  const det = a * d - b * c;

  if (Math.abs(det) < 1e-10) {
    // Fallback for degenerate matrix - simple scale-based conversion
    const pdfX = canvasX / viewport.scale;
    const pdfY = (viewport.height - canvasY) / viewport.scale;
    return { pdfX, pdfY };
  }

  // Apply inverse transform
  const pdfX = (d * (canvasX - e) - c * (canvasY - f)) / det;
  const pdfY = (-b * (canvasX - e) + a * (canvasY - f)) / det;

  return { pdfX, pdfY };
}

/** Load PDF.js from CDN with caching */
async function loadPdfJs(): Promise<PdfjsLib> {
  // Return cached instance if already loaded
  if ((window as unknown as { pdfjsLib?: PdfjsLib }).pdfjsLib) {
    return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    // Using stable version 3.11.174 (widely tested, reliable)
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

    script.onload = () => {
      const pdfjsLib = (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });
}

function FullscreenModal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we only render portal on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
      // Focus the modal for accessibility
      setTimeout(() => modalRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed inset-0 z-9999 flex flex-col p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen viewer"
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Header with close button */}
      <div className="relative z-10 flex justify-end py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
          aria-label="Close fullscreen (Escape)"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content area - takes remaining space */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden rounded-lg bg-background">
        {children}
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
}

/** Coordinate overlay component for PDF viewer */
function CoordinateOverlay({
  coordinates,
  visible,
}: {
  coordinates: PDFCoordinates | null;
  visible: boolean;
}) {
  if (!visible || !coordinates) return null;

  // Calculate position as percentage for quick validation
  const xPercent = (coordinates.pdfX / coordinates.pageWidth) * 100;
  const yPercent = (coordinates.pdfY / coordinates.pageHeight) * 100;

  // Calculate offset from edges (industry standard: left/right, top/bottom)
  // Left offset = distance from left edge (same as pdfX)
  const fromLeft = coordinates.pdfX;
  // Right offset = distance from right edge
  const fromRight = coordinates.pageWidth - coordinates.pdfX;
  // Top offset = distance from top edge (inverted Y since PDF origin is bottom-left)
  const fromTop = coordinates.pageHeight - coordinates.pdfY;
  // Bottom offset = distance from bottom edge (same as pdfY)
  const fromBottom = coordinates.pdfY;

  return (
    <div
      className="absolute bottom-3 left-3 flex flex-col gap-1.5 px-3 py-2.5 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg text-xs font-mono tabular-nums select-none pointer-events-none z-10"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* PDF coordinates row (origin bottom-left) */}
      <div className="flex items-center gap-2">
        <Crosshair
          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            X:{" "}
            <span className="text-foreground font-medium">
              {coordinates.pdfX.toFixed(1)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Y:{" "}
            <span className="text-foreground font-medium">
              {coordinates.pdfY.toFixed(1)}
            </span>
          </span>
          <span
            className="text-muted-foreground/60 text-[10px]"
            title="PDF coordinate system: origin at bottom-left corner, Y increases upward"
          >
            pt ↙
          </span>
        </div>
      </div>

      {/* Horizontal offset row: Left → Right */}
      <div
        className="flex items-center gap-2 text-[10px] text-muted-foreground border-t border-border/50 pt-1.5"
        title="Horizontal offset: distance from left and right edges"
      >
        <span className="w-13 text-muted-foreground/70">← Left</span>
        <span className="text-foreground font-medium">
          {fromLeft.toFixed(1)}
        </span>
        <span className="text-muted-foreground/50 px-1">|</span>
        <span className="text-foreground font-medium">
          {fromRight.toFixed(1)}
        </span>
        <span className="text-muted-foreground/70">Right →</span>
      </div>

      {/* Vertical offset row: Top → Bottom */}
      <div
        className="flex items-center gap-2 text-[10px] text-muted-foreground"
        title="Vertical offset: distance from top and bottom edges"
      >
        <span className="w-13 text-muted-foreground/70">↑ Top</span>
        <span className="text-foreground font-medium">
          {fromTop.toFixed(1)}
        </span>
        <span className="text-muted-foreground/50 px-1">|</span>
        <span className="text-foreground font-medium">
          {fromBottom.toFixed(1)}
        </span>
        <span className="text-muted-foreground/70">Bottom ↓</span>
      </div>

      {/* Page info row - helps validate coordinates */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 border-t border-border/50 pt-1.5 mt-0.5">
        <span>
          Page: {coordinates.pageWidth.toFixed(0)} ×{" "}
          {coordinates.pageHeight.toFixed(0)} pt
        </span>
        <span className="text-muted-foreground/50">|</span>
        <span>
          Pos: {xPercent.toFixed(0)}%, {yPercent.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function PDFViewer({
  data,
  isFullscreen = false,
}: {
  data: string;
  isFullscreen?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(isFullscreen ? 1 : 0.75);
  const [viewport, setViewport] = useState<PageViewport | null>(null);
  const [coordinates, setCoordinates] = useState<PDFCoordinates | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(true);

  // Load PDF.js with dynamic import for code splitting
  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use legacy script loading for reliable CDN access
        // This avoids dynamic import issues with Next.js bundling
        const pdfjsLib = await loadPdfJs();

        const base64Content = data.includes(",") ? data.split(",")[1] : data;
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({
          data: bytes,
        });

        const pdf = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load PDF");
          console.error("PDF load error:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [data]);

  // Render current page
  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page: PDFPageProxy = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        const pageViewport = page.getViewport({ scale });

        canvas.height = pageViewport.height;
        canvas.width = pageViewport.width;

        if (isMounted) {
          setViewport(pageViewport as unknown as PageViewport);
        }

        await page.render({
          canvasContext: context,
          viewport: pageViewport,
        }).promise;
      } catch (err) {
        console.error("PDF render error:", err);
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, currentPage, scale]);

  // Handle mouse move for coordinate tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!viewport || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Calculate position on the canvas (accounting for any CSS scaling)
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      // Convert canvas coordinates to PDF coordinates using proper transformation
      const { pdfX, pdfY } = canvasToPdfCoordinates(canvasX, canvasY, viewport);

      // Calculate page dimensions in PDF points (unscaled)
      const pageWidth = viewport.width / viewport.scale;
      const pageHeight = viewport.height / viewport.scale;

      setCoordinates({
        pdfX,
        pdfY,
        canvasX,
        canvasY,
        page: currentPage,
        pageWidth,
        pageHeight,
      });
    },
    [viewport, currentPage]
  );

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setCoordinates(null);
  }, []);

  const handleZoomIn = useCallback(
    () => setScale((s) => Math.min(s + 0.25, 4)),
    []
  );
  const handleZoomOut = useCallback(
    () => setScale((s) => Math.max(s - 0.25, 0.5)),
    []
  );
  const toggleCoordinates = useCallback(
    () => setShowCoordinates((s) => !s),
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 p-16 h-full">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground"
            role="status"
            aria-label="Loading PDF"
          />
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-16 h-full">
        <FileQuestion
          className="h-8 w-8 text-muted-foreground mb-3"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden flex flex-col ${
        isFullscreen ? "h-full" : "rounded-lg border border-border bg-muted/30"
      }`}
    >
      <div
        ref={containerRef}
        className="overflow-auto flex-1 bg-neutral-100 dark:bg-neutral-900 relative"
        style={isFullscreen ? undefined : { maxHeight: "500px" }}
      >
        <canvas
          ref={canvasRef}
          className="mx-auto block cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-label={`PDF page ${currentPage} of ${totalPages}. Hover to see coordinates.`}
        />
        <CoordinateOverlay
          coordinates={coordinates}
          visible={showCoordinates && isHovering}
        />
      </div>

      <div className="flex items-center justify-between gap-4 p-3 border-t border-border bg-background">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span
            className="text-xs text-muted-foreground tabular-nums w-12 text-center"
            aria-live="polite"
          >
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showCoordinates ? "secondary" : "outline"}
            size="sm"
            onClick={toggleCoordinates}
            className="gap-1.5"
            aria-label={
              showCoordinates ? "Hide coordinates" : "Show coordinates"
            }
            aria-pressed={showCoordinates}
          >
            <Crosshair className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Coords</span>
          </Button>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span
              className="text-sm text-muted-foreground tabular-nums"
              aria-live="polite"
            >
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {totalPages <= 1 && <div />}
      </div>
    </div>
  );
}

function PDFViewerWithFullscreen({ data }: { data: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div className="relative">
        <PDFViewer data={data} />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 gap-1.5"
          aria-label="View PDF in fullscreen"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Fullscreen</span>
        </Button>
      </div>

      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
      >
        <PDFViewer data={data} isFullscreen />
      </FullscreenModal>
    </>
  );
}

function ImageViewerWithFullscreen({ data }: { data: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return <PreviewUnavailable />;
  }

  return (
    <>
      <div className="relative flex items-center justify-center rounded-lg border border-border bg-muted/30 p-6">
        <img
          src={data || "/placeholder.svg"}
          alt="Decoded document preview"
          className="max-w-full max-h-96 object-contain rounded"
          onError={() => setImageError(true)}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 gap-1.5"
          aria-label="View image in fullscreen"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Fullscreen</span>
        </Button>
      </div>

      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
      >
        <div className="flex items-center justify-center h-full bg-neutral-100 dark:bg-neutral-900 p-4 overflow-auto">
          <img
            src={data || "/placeholder.svg"}
            alt="Decoded document preview in fullscreen"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </FullscreenModal>
    </>
  );
}

export function DocumentPreview({ document }: DocumentPreviewProps) {
  const { data, mimeType } = document;

  if (mimeType.startsWith("image/")) {
    return <ImageViewerWithFullscreen data={data} />;
  }

  if (mimeType === "application/pdf") {
    return <PDFViewerWithFullscreen data={data} />;
  }

  // Text-based content preview
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/javascript"
  ) {
    try {
      const base64Content = data.split(",")[1];
      const decodedContent = atob(base64Content);

      let displayContent = decodedContent;
      if (mimeType === "application/json") {
        try {
          displayContent = JSON.stringify(JSON.parse(decodedContent), null, 2);
        } catch {
          // Keep original if not valid JSON
        }
      }

      return (
        <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
          <pre className="p-4 text-sm font-mono text-foreground overflow-x-auto max-h-96 overflow-y-auto">
            <code>{displayContent}</code>
          </pre>
        </div>
      );
    } catch {
      return <PreviewUnavailable />;
    }
  }

  // Video preview
  if (mimeType.startsWith("video/")) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 p-6">
        <video src={data} controls className="max-w-full max-h-96 rounded">
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Audio preview
  if (mimeType.startsWith("audio/")) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 p-8">
        <audio src={data} controls className="w-full max-w-md">
          Your browser does not support the audio tag.
        </audio>
      </div>
    );
  }

  return <PreviewUnavailable />;
}

function PreviewUnavailable() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-16 text-center"
      role="status"
      aria-label="Preview not available"
    >
      <FileQuestion
        className="h-8 w-8 text-muted-foreground mb-3"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">
        Preview not available for this file type
      </p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Click download to save the file
      </p>
    </div>
  );
}
