import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/app-context";

// Only LandingPage is eagerly loaded (it's the home page / first paint)
import LandingPage from "./pages/LandingPage.tsx";

// Everything else is lazy-loaded — only fetched when navigated to
const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Login = lazy(() => import("@/components/Login"));
const Register = lazy(() => import("@/components/Register"));
const PublicBookingPage = lazy(() => import("./pages/PublicBookingPage"));
const TrackBookingPage = lazy(() => import("./pages/TrackBookingPage"));
const VenueOperations = lazy(() => import("@/components/VenueOperations"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent unnecessary refetches on window focus
      refetchOnWindowFocus: false,
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Lightweight loading fallback for lazy routes
function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400 animate-pulse">Loading…</p>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/app" element={<Index />} />
              {/* New Routes added here: */}
              <Route path="/book" element={<PublicBookingPage />} />
              <Route path="/track" element={<TrackBookingPage />} />
              <Route path="/venue-operations" element={<VenueOperations />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;