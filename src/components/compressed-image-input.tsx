"use client";

import { useEffect, useRef, useState } from "react";

export const MAX_SOURCE_IMAGE_BYTES = 7 * 1024 * 1024;
export const MAX_STORED_IMAGE_BYTES = 500 * 1024;
export const MAX_IMAGE_DIMENSION = 1200;

type CompressionStatus = "idle" | "compressing" | "ready" | "error";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const initialScale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * initialScale));
    let height = Math.max(1, Math.round(bitmap.height * initialScale));
    const qualities = [0.86, 0.76, 0.66, 0.56, 0.46, 0.38];

    for (let resizeAttempt = 0; resizeAttempt < 9; resizeAttempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("This browser cannot prepare the image.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of qualities) {
        const blob = await canvasBlob(canvas, quality);
        if (!blob || blob.type !== "image/webp") throw new Error("This browser cannot create WebP images.");
        if (blob.size <= MAX_STORED_IMAGE_BYTES) {
          const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
          return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
        }
      }

      width = Math.max(64, Math.round(width * 0.82));
      height = Math.max(64, Math.round(height * 0.82));
    }
    throw new Error("This image could not be reduced below 500 KB. Choose a simpler or smaller image.");
  } finally {
    bitmap.close();
  }
}

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
  const requestId = useRef(0);
  const [status, setStatus] = useState<CompressionStatus>("idle");
  const [error, setError] = useState("");
  const [sizes, setSizes] = useState<{ original: number; compressed: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const updateStatus = (next: CompressionStatus) => {
    setStatus(next);
    onStatusChange?.(next);
  };

  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file?: File) => {
    const currentRequest = ++requestId.current;
    setError("");
    setSizes(null);
    setPreviewUrl(previous => { if (previous) URL.revokeObjectURL(previous); return null; });
    if (!file) { updateStatus("idle"); return; }
    if (!acceptedTypes.has(file.type)) {
      clearInput(); updateStatus("error"); setError("Choose a PNG, JPEG, or WebP image."); return;
    }
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      clearInput(); updateStatus("error"); setError("Image must be 7 MB or smaller. Choose a smaller file."); return;
    }
    updateStatus("compressing");
    try {
      const compressed = await compressImage(file);
      if (currentRequest !== requestId.current) return;
      const transfer = new DataTransfer();
      transfer.items.add(compressed);
      if (!inputRef.current) throw new Error("The compressed image could not be attached.");
      inputRef.current.files = transfer.files;
      setSizes({ original: file.size, compressed: compressed.size });
      setPreviewUrl(URL.createObjectURL(compressed));
      updateStatus("ready");
    } catch (reason) {
      if (currentRequest !== requestId.current) return;
      clearInput();
      setError(reason instanceof Error ? reason.message : "The image could not be compressed. Choose another image.");
      updateStatus("error");
    }
  };

  return <div className="grid gap-3">
    <div className="flex flex-wrap items-center gap-4">
      {previewUrl || currentImageUrl ? <img className="h-20 w-20 rounded-xl border border-[var(--line)] object-cover" src={previewUrl ?? currentImageUrl ?? ""} alt={`Preview of ${label.toLowerCase()}`}/> : <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-[var(--line)] text-center text-xs text-[var(--muted)]">No image</div>}
      <label className="label flex-1">{label}<input ref={inputRef} className="input" name={name} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void handleFile(event.target.files?.[0])}/><span className="field-hint">Use a smaller image under 5 MB. Maximum upload size: 7 MB.</span></label>
    </div>
    {status === "compressing" ? <p className="text-sm text-[var(--muted)]" role="status">Compressing image before upload…</p> : null}
    {sizes ? <p className="text-sm text-[var(--muted)]" role="status">Ready to upload: {formatBytes(sizes.original)} → {formatBytes(sizes.compressed)} WebP</p> : null}
    {error ? <p className="alert" role="alert">{error}</p> : null}
  </div>;
}

