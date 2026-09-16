"use client";

import { useActionState, useState } from "react";
import { saveProfileImage } from "@/app/actions/profile-images";
import { SubmitButton } from "@/components/submit-button";
import { CompressedImageInput } from "@/components/compressed-image-input";

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
  return <form action={action} className="grid gap-3 rounded-xl border border-[var(--line)] p-4">
    {exhibitorId ? <input type="hidden" name="exhibitor_id" value={exhibitorId}/> : null}
    <CompressedImageInput name="image" label={kind} currentImageUrl={imageUrl} onStatusChange={setImageStatus}/>
    {state.error ? <p className="alert" role="alert">{state.error}</p> : null}
    {state.success ? <p className="alert" role="status">{state.success}</p> : null}
    <div className="flex flex-wrap gap-2"><SubmitButton pendingText="Uploading…" disabled={imageStatus !== "ready"}>Upload image</SubmitButton>{imageUrl ? <button className="button button-secondary" disabled={imageStatus === "compressing"} name="remove" value="1" type="submit">Remove</button> : null}</div>
  </form>;
}
