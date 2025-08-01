import { Outlet, useLocation } from "@tanstack/react-router";
import AppLayout from "./AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";

export function RootLayout() {
  const location = useLocation();
  const isCourseSearchPage = location.pathname === "/course-search";

  return (
    <AuthProvider>
      <AppLayout showFooter={!isCourseSearchPage}>
        <Outlet />
      </AppLayout>
    </AuthProvider>
  );
}
