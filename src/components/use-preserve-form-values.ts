"use client";

import { useEffect, useRef } from "react";

export function usePreserveFormValues(error: string, pending: boolean) {
  const formRef = useRef<HTMLFormElement>(null);
  const snapshot = useRef<Array<[string, FormDataEntryValue]>>([]);
  const capture = () => {
    if (formRef.current) snapshot.current = [...new FormData(formRef.current).entries()];
  };

  useEffect(() => {
    if (!error || pending || !snapshot.current.length) return;
    const frame = requestAnimationFrame(() => {
      const form = formRef.current;
      if (!form) return;
      for (const field of Array.from(form.elements)) {
        if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) || !field.name) continue;
        const value = snapshot.current.find(([name]) => name === field.name)?.[1];
        if (value === undefined || typeof value !== "string") continue;
        if (field instanceof HTMLInputElement && (field.type === "radio" || field.type === "checkbox")) field.checked = field.value === value;
        else field.value = value;
      }
      snapshot.current = [];
    });
    return () => cancelAnimationFrame(frame);
  });

  return { formRef, capture };
}
