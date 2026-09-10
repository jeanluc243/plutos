import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plutos",
    short_name: "Plutos",
    description: "Commandes, stock et facturation Plutos.",
    lang: "fr",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#008767",
    icons: [
      { src: "/brand/icons/plutos-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icons/plutos-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icons/plutos-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
