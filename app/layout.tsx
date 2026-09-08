import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leave By",
  description: "Know when to leave so you're never late",
  manifest:"/manifest.webmanifest"
};

export const viewport: Viewport ={
  themeColor: "#000000",
  width: "device-width",
  height: "device-height",
  initialScale: 1,
  viewportFit: "cover",
  userScalable:false,

};





export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      
      />
      <body  className="min-h-full flex flex-col">
        <ServiceWorkerRegistration/>
        {children}
        </body>
    </html>
  );
}
