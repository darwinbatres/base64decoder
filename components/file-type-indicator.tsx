import {
  FileText,
  FileImage,
  FileJson,
  FileCode,
  FileVideo,
  FileAudio,
  File,
  FileArchive,
  type LucideIcon,
} from "lucide-react";

interface FileTypeIndicatorProps {
  mimeType: string;
  extension: string;
}

const iconMap: Record<string, LucideIcon> = {
  pdf: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  bmp: FileImage,
  tiff: FileImage,
  json: FileJson,
  xml: FileCode,
  html: FileCode,
  js: FileCode,
  txt: FileText,
  mp4: FileVideo,
  webm: FileVideo,
  mp3: FileAudio,
  wav: FileAudio,
  zip: FileArchive,
};

export function FileTypeIndicator({ extension }: FileTypeIndicatorProps) {
  const Icon = iconMap[extension.toLowerCase()] || File;

  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted/50 shrink-0"
      aria-hidden="true"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}
