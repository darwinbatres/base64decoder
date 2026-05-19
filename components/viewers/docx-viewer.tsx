"use client";

import { useEffect, useState } from "react";
import { FileQuestion } from "lucide-react";
// @ts-ignore
import mammoth from "mammoth/mammoth.browser";

export default function DocxViewer({ data }: { data: string }) {
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const processWord = async () => {
      try {
        const base64Content = data.includes(",") ? data.split(",")[1] : data;
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
        if (isMounted) {
          setHtml(result.value);
          setLoading(false);
        }
      } catch (err) {
        console.error("Docx parsing error", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };
    
    processWord();
    
    return () => {
      isMounted = false;
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 bg-muted/30 border border-border rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          <p className="text-sm text-muted-foreground">Parsing Word document...</p>
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
    <div className="bg-white p-8 rounded-lg border border-border text-black overflow-auto max-h-[600px] prose prose-sm max-w-none">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}