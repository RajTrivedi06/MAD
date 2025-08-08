import { Outlet, useLocation } from "@tanstack/react-router";
import AppLayout from "./AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";

export function RootLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const isCourseSearch = location.pathname === "/course-search";

  return (
    <AuthProvider>
      <AppLayout showFooter={isLandingPage && !isCourseSearch}>
        <Outlet />
      </AppLayout>
    </AuthProvider>
  );
}
