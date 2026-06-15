/**
 * File/image upload field — preview + replace/remove.
 * The actual transfer happens on form submit as multipart (PATCH/POST via adminApi requestWithProgress);
 * progress is shown at the form level. This component only handles selection/preview.
 */

import { FileIcon, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface ImageUploadFieldProps {
  /** existing value (storage URL string) or a newly selected File */
  value: string | File | null;
  onChange: (value: File | null) => void;
  accept?: string; // image by default — pass "*" for FileField
  disabled?: boolean;
  kind?: "image" | "file";
}

export function ImageUploadField({ value, onChange, accept, disabled, kind = "image" }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(typeof value === "string" && value ? value : null);
    return undefined;
  }, [value]);

  const fileName = value instanceof File ? value.name : typeof value === "string" && value ? decodeURIComponent(value.split("/").pop() ?? "") : null;

  return (
    <div className="flex items-center gap-2">
      {previewUrl && kind === "image" ? (
        <a href={value instanceof File ? undefined : previewUrl} target="_blank" rel="noreferrer" className="shrink-0">
          <img src={previewUrl} alt="Preview" className="h-14 w-20 rounded border border-border object-cover" />
        </a>
      ) : fileName ? (
        <span className="inline-flex max-w-48 items-center gap-1 truncate rounded border border-border bg-app px-2 py-1 text-caption text-fg-muted">
          <FileIcon className="h-3.5 w-3.5 shrink-0" />
          {fileName}
        </span>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? (kind === "image" ? "image/*" : undefined)}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file) onChange(file);
          e.target.value = "";
        }}
      />
      <Button variant="outline" disabled={disabled} onClick={() => inputRef.current?.click()}>
        <Upload className="h-3.5 w-3.5" />
        {fileName ? "Replace file" : "Choose file"}
      </Button>
      {fileName && !disabled && (
        <Button variant="ghost" size="icon" aria-label="Remove file" onClick={() => onChange(null)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
