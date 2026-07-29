import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tranka · Viaje compartido",
    short_name: "Tranka",
    description: "Seguí un viaje compartido en tiempo real.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#69A8E8",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
