import { Outlet, useLocation } from "@tanstack/react-router";
import AppLayout from "./AppLayout";

export function RootLayout() {
  const location = useLocation();
  const isCourseSearchPage = location.pathname === "/course-search";

  return (
    <AppLayout showFooter={!isCourseSearchPage}>
      <Outlet />
    </AppLayout>
  );
}
