import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route, Link } from "wouter";
import { Home, Send, ArrowDownLeft, Repeat, User } from "lucide-react";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
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
      <div className="container mx-auto px-4 pb-16 md:pb-0 md:px-6 lg:px-8">
        <div className="md:max-w-screen-xl md:mx-auto md:grid md:grid-cols-[280px,1fr] lg:grid-cols-[320px,1fr] md:gap-6 lg:gap-8">
          <aside className="hidden md:block md:py-6">
            <nav className="sticky top-6 space-y-2">
              {/* Desktop Navigation */}
              <div className="space-y-1">
                <Link href="/" className="flex items-center px-4 py-2 rounded-lg hover:bg-accent">
                  <Home className="h-5 w-5 mr-3" />
                  <span>Home</span>
                </Link>
                <Link href="/send" className="flex items-center px-4 py-2 rounded-lg hover:bg-accent">
                  <Send className="h-5 w-5 mr-3" />
                  <span>Send</span>
                </Link>
                <Link href="/receive" className="flex items-center px-4 py-2 rounded-lg hover:bg-accent">
                  <ArrowDownLeft className="h-5 w-5 mr-3" />
                  <span>Receive</span>
                </Link>
                <Link href="/swap" className="flex items-center px-4 py-2 rounded-lg hover:bg-accent">
                  <Repeat className="h-5 w-5 mr-3" />
                  <span>Swap</span>
                </Link>
                <Link href="/profile" className="flex items-center px-4 py-2 rounded-lg hover:bg-accent">
                  <User className="h-5 w-5 mr-3" />
                  <span>Profile</span>
                </Link>
              <div className="mt-4">
                  <ThemeToggle />
                </div>
              </div>
            </nav>
          </aside>
          <main className="md:py-6">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/send" component={SendMoneyPage} />
              <Route path="/receive" component={ReceivePage} />
              <Route path="/swap" component={SwapPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route>404 Page Not Found</Route>
            </Switch>
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
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
