import { Suspense, lazy, type ComponentType } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { getAuthToken } from "@/lib/api";

const Home = lazy(() => import("@/pages/Home").then((m) => ({ default: m.Home })));
const Agent = lazy(() => import("@/pages/Agent").then((m) => ({ default: m.Agent })));
const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })));
const RunDetail = lazy(() =>
  import("@/pages/RunDetail").then((m) => ({ default: m.RunDetail })),
);
const Compare = lazy(() =>
  import("@/pages/Compare").then((m) => ({ default: m.Compare })),
);
const Settings = lazy(() =>
  import("@/pages/Settings").then((m) => ({ default: m.Settings })),
);
const Correlation = lazy(() =>
  import("@/pages/Correlation").then((m) => ({ default: m.Correlation })),
);

function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
      Loading…
    </div>
  );
}

function wrap(Component: ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function RequireAuth() {
  const location = useLocation();
  if (!getAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Layout />;
}

export const router = createBrowserRouter([
  { path: "/login", element: wrap(Login) },
  {
    element: <RequireAuth />,
    children: [
      { path: "/", element: wrap(Home) },
      { path: "/agent", element: wrap(Agent) },
      { path: "/settings", element: wrap(Settings) },
      { path: "/runs/:runId", element: wrap(RunDetail) },
      { path: "/compare", element: wrap(Compare) },
      { path: "/correlation", element: wrap(Correlation) },
    ],
  },
]);
