"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Crop, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { ImageCropModal } from "@/components/image-crop-modal";
import { ProgressiveImage } from "@/components/progressive-image";

export const MAX_SOURCE_IMAGE_BYTES = 7 * 1024 * 1024;
export const MAX_STORED_IMAGE_BYTES = 500 * 1024;

type CompressionStatus = "idle" | "compressing" | "ready" | "error";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function CompressedImageInput({
  name,
  label,
  currentImageUrl,
  onStatusChange,
}: {
  name: "image" | "logo";
  label: string;
  currentImageUrl?: string | null;
  onStatusChange?: (status: CompressionStatus) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<CompressionStatus>("idle");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Modal crop state
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const updateStatus = (next: CompressionStatus) => {
    setStatus(next);
    onStatusChange?.(next);
  };

  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  // 1. When a user selects a file from file picker or dropzone
  const handleSelectFile = (file?: File) => {
    setError("");
    if (!file) return;

    if (!acceptedTypes.has(file.type)) {
      clearInput();
      updateStatus("error");
      setError("Please choose a PNG, JPEG, or WebP image.");
      return;
    }

    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      clearInput();
      updateStatus("error");
      setError("Image must be 7 MB or smaller. Choose a smaller file.");
      return;
    }

    // Read selected file as Data URL to open Crop Modal
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setRawImageSrc(result);
        setIsCropOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // 2. When cropping is completed in the Modal
  const handleCropComplete = (croppedFile: File) => {
    try {
      updateStatus("compressing");

      const transfer = new DataTransfer();
      transfer.items.add(croppedFile);

      if (inputRef.current) {
        inputRef.current.files = transfer.files;
      }

      const newPreview = URL.createObjectURL(croppedFile);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return newPreview;
      });

      updateStatus("ready");
    } catch (err) {
      clearInput();
      setError(err instanceof Error ? err.message : "Failed to process image.");
      updateStatus("error");
    }
  };

  return (
    <div className="grid gap-4">
      {/* Hidden File Input used for Form Submission */}
      <input
        ref={inputRef}
        className="sr-only"
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => void handleSelectFile(e.target.files?.[0])}
      />

      {/* Main Custom Profile Upload Card */}
      <div className="panel p-5 rounded-2xl bg-white border border-[var(--line)] shadow-xs flex flex-col sm:flex-row items-center gap-5">
        
        {/* Avatar / Logo Display with Progressive Loading */}
        <div className="relative group shrink-0">
          {previewUrl || currentImageUrl ? (
            <ProgressiveImage
              containerClassName="h-24 w-24 rounded-2xl border-2 border-[var(--accent)]/30 shadow-md"
              className="h-24 w-24 rounded-2xl object-cover group-hover:opacity-90 transition-opacity"
              src={previewUrl ?? currentImageUrl ?? ""}
              alt={`Preview of ${label.toLowerCase()}`}
            />
          ) : (
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]">
              <ImageIcon size={28} className="mb-1 text-[var(--muted)]" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">No image</span>
            </div>
          )}

          {/* Active Ready Badge */}
          {status === "ready" && (
            <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md border-2 border-white">
              <CheckCircle2 size={14} />
            </span>
          )}
        </div>

        {/* Info & Action Controls */}
        <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
          <h4 className="text-sm font-black text-[var(--foreground)] tracking-tight">
            {label}
          </h4>

          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Upload a PNG, JPEG, or WebP photo up to 7 MB. You can crop, zoom, and frame your picture after selecting.
          </p>

          {/* Action Buttons */}
          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="button button-primary text-xs gap-1.5 px-4 py-2"
            >
              <Upload size={15} />
              <span>{previewUrl || currentImageUrl ? "Change picture" : "Choose picture"}</span>
            </button>

            {rawImageSrc && (
              <button
                type="button"
                onClick={() => setIsCropOpen(true)}
                className="button button-secondary text-xs gap-1.5 px-3.5 py-2 font-bold"
              >
                <Crop size={15} className="text-[var(--accent)]" />
                <span>Crop & Adjust</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="alert text-xs py-2 px-3" role="alert">
          {error}
        </p>
      )}

      {/* Interactive Crop & Resize Modal */}
      {rawImageSrc && (
        <ImageCropModal
          isOpen={isCropOpen}
          imageSrc={rawImageSrc}
          onClose={() => setIsCropOpen(false)}
          onCropComplete={handleCropComplete}
          title={`Crop & Frame ${label}`}
        />
      )}
    </div>
  );
}

