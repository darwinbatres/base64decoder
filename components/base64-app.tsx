"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Base64Decoder } from "@/components/base64-decoder";
import { FileToBase64 } from "@/components/file-to-base64";
import { FileViewer } from "@/components/file-viewer";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileCode2, FileUp, Eye, FileOutput } from "lucide-react";
import { storage } from "@/lib/file-utils";

type TabValue = "decode" | "encode" | "view";

export function Base64App() {
  const [activeTab, setActiveTab] = useState<TabValue>("decode");

  // Load saved tab on mount and setup cleanup on tab close
  useEffect(() => {
    // Load saved tab preference
    const saved = storage.loadString("ACTIVE_TAB");
    if (saved && ["decode", "encode", "view"].includes(saved)) {
      setActiveTab(saved as TabValue);
    }

    // Clear all localStorage when tab/window is closed
    // Using pagehide is more reliable than beforeunload (works on mobile, bfcache-aware)
    const handlePageHide = (event: PageTransitionEvent) => {
      // Only clear if the page is actually being unloaded (not entering bfcache)
      if (!event.persisted) {
        storage.clearAll();
      }
    };

    // beforeunload as fallback for older browsers
    const handleBeforeUnload = () => {
      storage.clearAll();
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Save tab on change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
    storage.saveString("ACTIVE_TAB", value);
  }, []);

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
                Base64 Utils
              </h1>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Encode, decode, and preview files with base64
          </p>
        </header>

        <main>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="decode" className="gap-1.5">
                <FileOutput className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Decode</span>
              </TabsTrigger>
              <TabsTrigger value="encode" className="gap-1.5">
                <FileUp className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Encode</span>
              </TabsTrigger>
              <TabsTrigger value="view" className="gap-1.5">
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">View</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="decode">
              <Base64Decoder embedded />
            </TabsContent>

            <TabsContent value="encode">
              <FileToBase64 />
            </TabsContent>

            <TabsContent value="view">
              <FileViewer />
            </TabsContent>
          </Tabs>
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
