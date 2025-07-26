"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  BookOpen,
  FlaskConical,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BookOpen,
    description: "View your academic overview",
  },
  {
    name: "Course Search",
    href: "/search",
    icon: Search,
    description: "Find and explore courses",
  },
  {
    name: "Research",
    href: "/research",
    icon: FlaskConical,
    description: "Discover research opportunities",
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    description: "Manage your account",
  },
];

export default function ModernNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-neutral-charcoal border-b border-red-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-600 to-red-700 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-neutral-white via-red-100 to-red-200 bg-clip-text text-transparent">
                MAD
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-red-600/20 to-red-700/20 text-white border border-red-500/30"
                        : "text-neutral-cool-grey hover:text-white hover:bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                    {!isActive && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-600/0 via-red-500/0 to-red-700/0 group-hover:from-red-600/5 group-hover:via-red-500/5 group-hover:to-red-700/5 transition-all duration-200" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Desktop user menu */}
            <div className="hidden md:relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg text-neutral-cool-grey hover:text-white hover:bg-red-500/10 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-accent-muted-teal to-accent-steel-blue rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">
                    {user?.user_metadata?.first_name || "User"}
                  </div>
                  <div className="text-xs text-neutral-cool-grey">
                    {user?.email}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-slate border border-red-500/20 rounded-lg shadow-xl backdrop-blur-sm">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-neutral-cool-grey hover:text-white hover:bg-red-500/10"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-neutral-cool-grey hover:text-white hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-cool-grey hover:text-white hover:bg-red-500/10"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-neutral-slate border-t border-red-500/20">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-red-500/20 text-white border border-red-500/30"
                      : "text-neutral-cool-grey hover:text-white hover:bg-red-500/10"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-red-500/20">
            <div className="flex items-center px-4 py-2">
              <div className="w-8 h-8 bg-gradient-to-r from-accent-muted-teal to-accent-steel-blue rounded-full flex items-center justify-center mr-3">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-base font-medium text-white">
                  {user?.user_metadata?.first_name || "User"}
                </div>
                <div className="text-sm text-neutral-cool-grey">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-base font-medium text-neutral-cool-grey hover:text-white hover:bg-red-500/10"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-base font-medium text-neutral-cool-grey hover:text-white hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
