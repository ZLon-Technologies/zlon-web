export default function manifest() {
  return {
    name: "ZLon",
    short_name: "ZLon",
    description: "ZLon native-style app",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "https://zlon.in/logo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "https://zlon.in/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
