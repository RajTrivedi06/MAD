"use client";

import { useRouter } from "@tanstack/react-router";
import { Button } from "./ui/button";

export function RoutingDebug() {
  const router = useRouter();

  // Check if router is initialized
  if (!router || !router.state) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50">
        <h3 className="text-sm font-semibold mb-2">Routing Debug</h3>
        <div className="text-xs text-gray-500">Router not initialized...</div>
      </div>
    );
  }

  const testRoutes = [
    { name: "Home", path: "/" },
    { name: "Login", path: "/login" },
    { name: "Register", path: "/register" },
    { name: "Accounts", path: "/accounts" },
    { name: "Course Search", path: "/course-search" },
    { name: "RA Finder", path: "/ra-finder" },
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-sm font-semibold mb-2">Routing Debug</h3>
      <div className="space-y-1">
        {testRoutes.map((route) => (
          <Button
            key={route.path}
            size="sm"
            variant="outline"
            onClick={() => router.navigate({ to: route.path })}
            className="w-full text-xs"
          >
            {route.name}
          </Button>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Current: {router.state.location.pathname}
      </div>
    </div>
  );
}
