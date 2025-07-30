"use client";

import { RouterProvider } from "@tanstack/react-router";
import { router } from "../router";

export function ClientRouter() {
  return <RouterProvider router={router} />;
}
