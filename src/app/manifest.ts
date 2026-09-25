import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "exporb",
    short_name: "exporb",
    description: "Verified event and retail talent across India",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f7f2",
    theme_color: "#f8f7f2",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
