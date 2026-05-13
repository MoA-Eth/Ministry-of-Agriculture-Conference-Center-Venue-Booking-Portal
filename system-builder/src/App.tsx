import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AppProvider } from "@/lib/app-context";
import Login from "@/components/Login";
import Register from "@/components/Register";
// Add the new imports here:
import PublicBookingPage from "./pages/PublicBookingPage";
import TrackBookingPage from "./pages/TrackBookingPage";
import VenueOperations from "@/components/VenueOperations"; // <-- Added import!

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/app" element={<Index />} />
            {/* New Routes added here: */}
            <Route path="/book" element={<PublicBookingPage />} />
            <Route path="/track" element={<TrackBookingPage />} />
            <Route path="/venue-operations" element={<VenueOperations />} /> {/* <-- Added Route! */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;