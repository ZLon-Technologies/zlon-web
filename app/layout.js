import "./globals.css";

export const metadata = {
  title: "ZLon",
  description: "ZLon SPA PWA",
  applicationName: "ZLon",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZLon",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
