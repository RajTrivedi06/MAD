"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  Search,
  FlaskConical,
  Users,
  LogIn,
  UserPlus,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const navItems = [
    {
      name: "Course Search",
      href: "/course-search",
      icon: <Search className="w-4 h-4" />,
    },
    {
      name: "RA Finder",
      href: "/ra-finder",
      icon: <FlaskConical className="w-4 h-4" />,
    },

    {
      name: "Study Groups",
      href: "#",
      icon: <Users className="w-4 h-4" />,
      badge: "Coming Soon",
    },
  ];

  const authItems = [
    { name: "Login", href: "/login", icon: <LogIn className="w-4 h-4" /> },
    {
      name: "Sign Up",
      href: "/register",
      icon: <UserPlus className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-black">
                Mad<span className="text-red-600">Help</span>
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors font-medium"
              >
                {item.icon}
                <span>{item.name}</span>
                {item.badge && (
                  <span className="absolute -top-2 -right-8 px-2 py-0.5 bg-black text-white text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Auth/User Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/accounts"
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>Account</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:text-red-600"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                {authItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      item.name === "Sign Up"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "text-gray-700 hover:text-red-600"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-red-600 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 bg-black text-white text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/accounts"
                      className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors font-medium py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Account</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:text-red-600"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    {authItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          item.name === "Sign Up"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "text-gray-700 hover:text-red-600"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
