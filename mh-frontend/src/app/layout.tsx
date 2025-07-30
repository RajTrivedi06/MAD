import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientRouter } from "../components/ClientRouter";
import { QueryProvider } from "../providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MH Frontend - Modern Web Development",
  description:
    "A modern web application built with Next.js, Tailwind CSS, and Tanstack Router",
};

export default function RootLayout() {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ClientRouter />
        </QueryProvider>
      </body>
    </html>
  );
}
