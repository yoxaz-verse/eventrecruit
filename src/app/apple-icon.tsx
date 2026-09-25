import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 50, background: "#0f172a" }}>
        <svg width="126" height="126" viewBox="0 0 48 48" fill="none">
          <g stroke="#fcd978" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5">
            <path d="M22.034 5.628a2 2 0 0 1 3.932 0l2.102 11.116a4 4 0 0 0 3.188 3.188l11.116 2.102a2 2 0 0 1 0 3.932l-11.116 2.102a4 4 0 0 0-3.188 3.188l-2.102 11.116a2 2 0 0 1-3.932 0l-2.102-11.116a4 4 0 0 0-3.188-3.188L5.628 25.966a2 2 0 0 1 0-3.932l11.116-2.102a4 4 0 0 0 3.188-3.188z" />
            <path d="M40 4v8M44 8h-8" />
            <circle cx="8" cy="40" r="4" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
