"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move } from "lucide-react";

export interface ImageCropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  title?: string;
}

export function ImageCropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  title = "Crop & Resize Profile Picture",
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Compute screen bounds & maximum allowed offsets to prevent empty background exposure
  const getScreenBounds = useCallback(
    (img: HTMLImageElement, currentZoom: number, currentRotation: number) => {
      const size = 320;
      const isRotated = currentRotation === 90 || currentRotation === 270;
      const scale = Math.max(size / img.width, size / img.height) * currentZoom;
      const screenW = (isRotated ? img.height : img.width) * scale;
      const screenH = (isRotated ? img.width : img.height) * scale;
      const maxOffsetX = Math.max(0, (screenW - size) / 2);
      const maxOffsetY = Math.max(0, (screenH - size) / 2);
      return { scale, screenW, screenH, maxOffsetX, maxOffsetY, size };
    },
    []
  );

  const clampOffset = useCallback(
    (
      rawOffset: { x: number; y: number },
      img: HTMLImageElement | null,
      currentZoom: number,
      currentRotation: number
    ) => {
      if (!img) return { x: 0, y: 0 };
      const { maxOffsetX, maxOffsetY } = getScreenBounds(img, currentZoom, currentRotation);
      return {
        x: Math.min(maxOffsetX, Math.max(-maxOffsetX, rawOffset.x)),
        y: Math.min(maxOffsetY, Math.max(-maxOffsetY, rawOffset.y)),
      };
    },
    [getScreenBounds]
  );

  // Load Image Object
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Render Preview Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // Get strictly clamped offset in screen space
    const clamped = clampOffset(offset, imageObj, zoom, rotation);

    ctx.save();
    // Translate image center to viewport center + clamped screen offset
    ctx.translate(size / 2 + clamped.x, size / 2 + clamped.y);
    ctx.rotate((rotation * Math.PI) / 180);

    const scale = Math.max(size / imageObj.width, size / imageObj.height) * zoom;
    const drawW = imageObj.width * scale;
    const drawH = imageObj.height * scale;

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Overlay Circular Mask & Dimmed Backdrop
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2, true);
    ctx.fill();

    // Circle border ring
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2563eb";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [imageObj, zoom, rotation, offset, clampOffset]);

  useEffect(() => {
    if (isOpen && imageObj) {
      renderCanvas();
    }
  }, [isOpen, imageObj, renderCanvas]);

  // Dragging / Pan handling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !imageObj) return;
    const raw = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setOffset(clampOffset(raw, imageObj, zoom, rotation));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handling for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1 || !imageObj) return;
    const raw = {
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    };
    setOffset(clampOffset(raw, imageObj, zoom, rotation));
  };

  // Wheel Zoom support
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.min(3, Math.max(1, zoom + delta));
    setZoom(newZoom);
    if (imageObj) {
      setOffset((prev) => clampOffset(prev, imageObj, newZoom, rotation));
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (imageObj) {
      setOffset((prev) => clampOffset(prev, imageObj, newZoom, rotation));
    }
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    if (imageObj) {
      setOffset((prev) => clampOffset(prev, imageObj, zoom, newRotation));
    }
  };

  // Generate Cropped Image Blob
  const handleApply = () => {
    if (!imageObj) return;

    const exportCanvas = document.createElement("canvas");
    const exportSize = 500; // Output 500x500 square WebP
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;

    const ctx = exportCanvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const clamped = clampOffset(offset, imageObj, zoom, rotation);
    const scaleFactor = exportSize / 320;

    ctx.save();
    ctx.translate(exportSize / 2 + clamped.x * scaleFactor, exportSize / 2 + clamped.y * scaleFactor);
    ctx.rotate((rotation * Math.PI) / 180);

    const scale = Math.max(320 / imageObj.width, 320 / imageObj.height) * zoom * scaleFactor;
    const drawW = imageObj.width * scale;
    const drawH = imageObj.height * scale;

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    exportCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], "cropped-avatar.webp", {
          type: "image/webp",
          lastModified: Date.now(),
        });
        onCropComplete(croppedFile);
        onClose();
      }
    }, "image/webp", 0.9);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="panel bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--line)] space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h3 className="text-base font-black text-[var(--foreground)] tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-[var(--surface)] text-[var(--muted)] hover:text-black border border-[var(--line)] active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas Cropper Area */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative group cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden shadow-inner border border-[var(--line)] bg-slate-900">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              onWheel={handleWheel}
              className="touch-none block"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold pointer-events-none">
              <Move size={13} />
              <span>Drag to position</span>
            </div>
          </div>

          {/* Zoom & Rotation Controls */}
          <div className="w-full space-y-3 px-2 pt-2">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <ZoomOut size={16} className="text-[var(--muted)] shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-[var(--surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              />
              <ZoomIn size={16} className="text-[var(--muted)] shrink-0" />
              <span className="text-xs font-mono font-bold text-[var(--muted)] min-w-[36px]">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleRotate}
                className="button button-secondary text-xs gap-1.5 px-3 py-1.5"
              >
                <RotateCw size={14} />
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                  setRotation(0);
                }}
                className="text-xs font-bold text-[var(--muted)] hover:text-black underline"
              >
                Reset framing
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            className="button button-secondary text-xs px-4"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="button button-primary text-xs gap-1.5 px-5"
          >
            <Check size={16} />
            <span>Apply Crop & Resize</span>
          </button>
        </div>

      </div>
    </div>
  );
}

