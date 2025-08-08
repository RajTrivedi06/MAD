import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../contexts/AuthContext";
import Navigation from "../components/Navigation";
import ConditionalFooter from "../components/ConditionalFooter";
import { RoutingDebug } from "../components/RoutingDebug";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AccountsDebug } from "../components/AccountsDebug";

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
    "A modern web application built with Next.js, Tailwind CSS, and modern tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <ErrorBoundary>
              <div className="min-h-screen flex flex-col">
                <Navigation />
                <main className="flex-1 pt-16">{children}</main>
                <ConditionalFooter />
                {process.env.NODE_ENV === "development" && (
                  <>
                    <RoutingDebug />
                    <AccountsDebug />
                  </>
                )}
              </div>
            </ErrorBoundary>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
