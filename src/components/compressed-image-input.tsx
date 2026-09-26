"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Upload, Crop, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { ProgressiveImage } from "@/components/progressive-image";

const ImageCropModal = dynamic(
  () => import("@/components/image-crop-modal").then((module) => module.ImageCropModal),
  { loading: () => <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 text-sm font-bold text-white">Preparing image editor…</div> }
);

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

      {/* Custom Profile Upload Row */}
      <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
        {/* Avatar / Logo Display with Progressive Loading */}
        <div className="relative group shrink-0">
          {previewUrl || currentImageUrl ? (
            <ProgressiveImage
              containerClassName="h-20 w-20 rounded-2xl border-2 border-[var(--accent)]/30 shadow-xs"
              className="h-20 w-20 rounded-2xl object-cover group-hover:opacity-90 transition-opacity"
              src={previewUrl ?? currentImageUrl ?? ""}
              alt={`Preview of ${label.toLowerCase()}`}
            />
          ) : (
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]">
              <ImageIcon size={24} className="mb-1 text-[var(--muted)]" />
              <span className="text-[9px] font-extrabold uppercase tracking-wider">No image</span>
            </div>
          )}

          {/* Active Ready Badge */}
          {status === "ready" && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs border-2 border-white">
              <CheckCircle2 size={12} />
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col items-center sm:items-start gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="button button-secondary text-xs gap-1.5 px-3.5 py-2 font-bold"
            >
              <Upload size={14} />
              <span>{previewUrl || currentImageUrl ? "Change picture" : "Choose picture"}</span>
            </button>

            {rawImageSrc && (
              <button
                type="button"
                onClick={() => setIsCropOpen(true)}
                className="button button-secondary text-xs gap-1.5 px-3 py-2 font-bold"
              >
                <Crop size={14} className="text-[var(--accent)]" />
                <span>Crop & Adjust</span>
              </button>
            )}
          </div>
          <span className="text-[11px] font-medium text-[var(--muted)]">PNG, JPEG, WebP · Max 7 MB</span>
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
