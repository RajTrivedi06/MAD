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
import TestPrereqGraph from "./pages/TestPrereqGraph";
import D3ReactFlowTestPage from "./pages/d3-reactflow-test";
import MinimalReactFlowTest from "./pages/minimal-reactflow-test";

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

const testPrereqGraphRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/test-prereq-graph",
  component: TestPrereqGraph,
});

const d3ReactFlowTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/d3-reactflow-test",
  component: D3ReactFlowTestPage,
});

const minimalReactFlowTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/minimal-reactflow-test",
  component: MinimalReactFlowTest,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  courseSearchRoute,
  raFinderRoute,
  loginRoute,
  registerRoute,
  authCallbackRoute,
  accountsRoute,
  testPrereqGraphRoute,
  d3ReactFlowTestRoute,
  minimalReactFlowTestRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
