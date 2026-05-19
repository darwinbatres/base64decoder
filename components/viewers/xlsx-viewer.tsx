"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { FileQuestion } from "lucide-react";

export default function XlsxViewer({ data }: { data: string }) {
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Defer processing to avoid blocking main thread immediately
    const timer = setTimeout(() => {
      try {
        const base64Content = data.includes(",") ? data.split(",")[1] : data;
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const workbook = XLSX.read(bytes.buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        
        if (firstSheetName) {
          const worksheet = workbook.Sheets[firstSheetName];
          const htmlTable = XLSX.utils.sheet_to_html(worksheet);
          
          if (isMounted) {
            setHtml(htmlTable);
            setLoading(false);
          }
        } else {
          throw new Error("No sheets found");
        }
      } catch (err) {
        console.error("Xlsx parsing error", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 bg-muted/30 border border-border rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          <p className="text-sm text-muted-foreground">Parsing Excel document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/30 border border-border rounded-lg">
        <FileQuestion className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Preview not available for this document</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-border text-black overflow-auto max-h-[600px] text-sm">
      <style>{`
        .xlsx-table table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
        .xlsx-table td, .xlsx-table th { border: 1px solid #e5e7eb; padding: 6px 12px; white-space: nowrap; }
        .xlsx-table th { background-color: #f3f4f6; font-weight: 600; text-align: left; }
      `}</style>
      <div className="xlsx-table" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}