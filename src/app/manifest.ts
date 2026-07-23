import type { MetadataRoute } from "next";
import {
  BRAND_ICON_SRC,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_NAME,
} from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    id: "/",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#0b1f3a",
    theme_color: "#0a84ff",
    orientation: "any",
    categories: ["business", "productivity", "technology"],
    icons: [
      {
        src: BRAND_ICON_SRC,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND_ICON_SRC,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Our Services",
        url: "/services",
        description: "Explore our engineering services",
      },
      {
        name: "Contact Us",
        url: "/contact",
        description: "Get in touch with our team",
      },
      {
        name: "Our Projects",
        url: "/projects",
        description: "View our accomplished portfolio",
      },
    ],
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
  } as MetadataRoute.Manifest;
}
