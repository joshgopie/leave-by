import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
    name: "Leave By",
    short_name: "Leave By",
    description: "Know when to leave to arrive on time",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
    {
        src: "/leave-by-icon-192.png",
        sizes: "192x192",
        type: "image/png",
    },
    {
        src: "/leave-by-icon-512.png",
        sizes: "512x512",
        type: "image/png",
    },
],
};
}
