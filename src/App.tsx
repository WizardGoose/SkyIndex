import { createBrowserRouter, RouterProvider, Navigate, useLocation } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { Layout } from "./components";
import { CalculatorStateProvider, RecipeStateProvider } from "./context";
import { usePageTitle } from "./hooks";
import { ToastProvider } from "./components";
import { GreenhouseHashRoute } from "./greenhouse/GreenhouseHashRoute";
import { legacyGreenhouseHref } from "./greenhouse/route";
import { legacySettingsLocation } from "./components/layout/settingsRoute";

const LandingPage = lazy(() => import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const ItemsPage = lazy(() => import("./pages/ItemsPage").then((module) => ({ default: module.ItemsPage })));
const IslandPage = lazy(() => import("./pages/IslandPage").then((module) => ({ default: module.IslandPage })));
const ForgePage = lazy(() => import("./pages/ForgePage").then((module) => ({ default: module.ForgePage })));
const GreenhouseShell = lazy(() => import("./greenhouse/GreenhouseShell").then((module) => ({ default: module.GreenhouseShell })));
const GreenhouseSolverPage = lazy(() => import("./greenhouse/pages/CalculatorPage").then((module) => ({ default: module.CalculatorPage })));
const GreenhouseDesignerPage = lazy(() => import("./greenhouse/pages/DesignerPage").then((module) => ({ default: module.DesignerPage })));
const GreenhousePlannerPage = lazy(() => import("./greenhouse/pages/PlannerPage").then((module) => ({ default: module.PlannerPage })));
const CalculatorPage = lazy(() => import("./pages/CalculatorPage").then((module) => ({ default: module.CalculatorPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
/*
 * Two things are called "settings" in this codebase and only one of them is a
 * settings screen. `SettingsPage` above is the Owned-shards editor, inherited
 * under that name from upstream and routed at `/shards`. `SiteSettingsPage` is
 * the real one, at `/settings`.
 */
const RecipePage = lazy(() => import("./pages/RecipePage"));
const FusionGraphPage = lazy(() => import("./pages/FusionGraphPage").then((module) => ({ default: module.FusionGraphPage })));
const GuidePage = lazy(() => import("./pages/GuidePage").then((module) => ({ default: module.GuidePage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((module) => ({ default: module.AboutPage })));

const ContactPage = lazy(() => import("./pages/ContactPage").then((module) => ({ default: module.ContactPage })));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

/**
 * Route-level fallback. Uses the site accent rather than the violet it was
 * forked with, so a page in flight looks like part of this app instead of a
 * stray spinner from somewhere else.
 */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
  </div>
);

const AppWithProviders = () => {
  return (
    <ToastProvider>
      <Layout />
    </ToastProvider>
  );
};

const ProtectedLayout = () => {
  usePageTitle(); // Update page title based on route

  return (
    <CalculatorStateProvider>
      <RecipeStateProvider>
        <AppWithProviders />
      </RecipeStateProvider>
    </CalculatorStateProvider>
  );
};

const LegacyGreenhouseRedirect = () => {
  const location = useLocation();
  const target = legacyGreenhouseHref(location.pathname, location.search);
  return <Navigate to={target ?? "/greenhouse"} replace />;
};

const LegacySettingsRedirect = () => {
  const location = useLocation();
  return <Navigate to={legacySettingsLocation(location)} replace />;
};

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <ProtectedLayout />,
      children: [
        /*
         * "/" is the landing page AND the grind dashboard, one page:
         * the W.W identity on top, the grind panels underneath, so
         * opening the site IS opening "what was I working on". The old
         * `/dashboard` address keeps working for bookmarks and the search
         * index, but it is a redirect rather than a second copy of the page.
         */
        {
          index: true,
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <LandingPage />
            </Suspense>
          ),
        },
        {
          path: "dashboard",
          element: <Navigate to="/" replace />,
        },
        {
          path: "greenhouse",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <GreenhouseShell />
            </Suspense>
          ),
          children: [
            {
              index: true,
              element: <GreenhouseHashRoute PlannerPage={GreenhousePlannerPage} SolverPage={GreenhouseSolverPage} DesignerPage={GreenhouseDesignerPage} />,
            },
            {
              path: "designer",
              element: <LegacyGreenhouseRedirect />,
            },
            {
              path: "planner",
              element: <LegacyGreenhouseRedirect />,
            },
          ],
        },
        {
          path: "items",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <ItemsPage />
            </Suspense>
          ),
        },
        {
          path: "crafting",
          element: <Navigate to="/items" replace />,
        },
        {
          /*
           * Accessories lives inside the profile page now, a tab in Profile
           * rather than a section of its own, so the old address redirects
           * the same way `/dashboard` does above: every bookmark and shared
           * link keeps working, and there is exactly one place the content
           * renders.
           */
          path: "accessories",
          element: <Navigate to="/island?tab=accessories" replace />,
        },
        {
          path: "island",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <IslandPage />
            </Suspense>
          ),
        },
        {
          path: "profile",
          element: <Navigate to="/island" replace />,
        },
        {
          path: "forge",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <ForgePage />
            </Suspense>
          ),
        },
        {
          path: "fusion",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CalculatorPage />
            </Suspense>
          ),
        },
        {
          path: "shards",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <SettingsPage />
            </Suspense>
          ),
        },
        {
          path: "settings",
          element: <LegacySettingsRedirect />,
        },
        /* The Tour Lab exists on dev builds only: the condition is statically
           false in production, so the route, the page, and its chunk are all
           dead-branch eliminated rather than merely hidden. */
        ...(import.meta.env.DEV
          ? [
              {
                path: "tour-lab",
                element: (
                  <Suspense fallback={<LoadingSpinner />}>
                    {React.createElement(lazy(() => import("./pages/TourLabPage")))}
                  </Suspense>
                ),
              },
            ]
          : []),
        {
          path: "recipes",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <RecipePage />
            </Suspense>
          ),
        },
        {
          path: "fusion-lines",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <FusionGraphPage />
            </Suspense>
          ),
        },
        {
          path: "guide",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <GuidePage />
            </Suspense>
          ),
        },
        {
          path: "about",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <AboutPage />
            </Suspense>
          ),
        },
        {
          path: "contact",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <ContactPage />
            </Suspense>
          ),
        },
        {
          path: "privacy-policy",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <PrivacyPolicy />
            </Suspense>
          ),
        },
        {
          path: "client-privacy-policy",
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <PrivacyPolicy />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ],
  {
    basename: "",
  }
);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
