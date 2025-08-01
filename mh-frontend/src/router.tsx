import {
  createRouter,
  createRoute,
  createRootRoute,
} from "@tanstack/react-router";
import { RootLayout } from "./components/RootLayout";
import { LandingPage } from "./pages/LandingPage";
import { CourseSearchAI } from "./pages/CourseSearchAI";
import { RAFeature } from "./pages/RAFeature";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { AuthCallback } from "./pages/auth/AuthCallback";
import { AccountsPage } from "./pages/AccountsPage";
import { RaFinderPage } from "./features/ra-finder/RaFinderPage";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const courseSearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/course-search",
  component: CourseSearchAI,
});

const raFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ra-feature",
  component: RAFeature,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: AuthCallback,
});

const raFinderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ra-finder",
  component: RaFinderPage,
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: AccountsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  courseSearchRoute,
  raFeatureRoute,
  loginRoute,
  registerRoute,
  authCallbackRoute,
  raFinderRoute,
  accountsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
