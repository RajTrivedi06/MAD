"use client";

import React from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";

interface AppLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  showFooter?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showNav = true,
  showFooter = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showNav && <Navigation />}
      <main className={`flex-1 ${showNav ? "pt-16" : ""}`}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default AppLayout;
