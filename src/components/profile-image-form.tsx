"use client";

import { useActionState, useState } from "react";
import { saveProfileImage } from "@/app/actions/profile-images";
import { SubmitButton } from "@/components/submit-button";
import { CompressedImageInput } from "@/components/compressed-image-input";
import { Upload, Trash2 } from "lucide-react";

export function ProfileImageForm({
  kind,
  imageUrl,
  exhibitorId,
}: {
  kind: "Profile picture" | "Agency logo" | "Exhibitor logo";
  imageUrl?: string | null;
  exhibitorId?: string;
}) {
  const [state, action] = useActionState(saveProfileImage, { error: "", success: "" });
  const [imageStatus, setImageStatus] = useState<"idle" | "compressing" | "ready" | "error">("idle");

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-[var(--line)] p-5 bg-white shadow-xs">
      {exhibitorId ? <input type="hidden" name="exhibitor_id" value={exhibitorId} /> : null}

      <CompressedImageInput
        name="image"
        label={kind}
        currentImageUrl={imageUrl}
        onStatusChange={setImageStatus}
      />

      {state.error ? (
        <p className="alert text-xs py-2 px-3" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="alert bg-emerald-50 text-emerald-800 border-emerald-200 text-xs py-2 px-3" role="status">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <SubmitButton
          pendingText="Saving picture…"
          disabled={imageStatus !== "ready"}
          className="button button-primary text-xs gap-1.5 px-5 py-2.5 shadow-md disabled:opacity-50"
        >
          <Upload size={15} />
          <span>Save {kind.toLowerCase()}</span>
        </SubmitButton>

        {imageUrl ? (
          <button
            className="button button-secondary text-xs gap-1.5 px-4 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
            disabled={imageStatus === "compressing"}
            name="remove"
            value="1"
            type="submit"
          >
            <Trash2 size={15} />
            <span>Remove photo</span>
          </button>
        ) : null}
      </div>
    </form>
  );
}
