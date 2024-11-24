import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/HomePage";
import SendMoneyPage from "./pages/SendMoneyPage";
import ReceivePage from "./pages/ReceivePage";
import SwapPage from "./pages/SwapPage";
import ProfilePage from "./pages/ProfilePage";
import BottomNav from "./components/BottomNav";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto pb-16">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/send" component={SendMoneyPage} />
          <Route path="/receive" component={ReceivePage} />
          <Route path="/swap" component={SwapPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </div>
      <BottomNav />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      registration => {
        console.log('ServiceWorker registration successful');
      },
      err => {
        console.log('ServiceWorker registration failed: ', err);
      }
    );
  });
}
