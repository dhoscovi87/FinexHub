import { Home, Send, ArrowDownLeft, Repeat, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();
  
  const items = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Send, label: "Send", href: "/send" },
    { icon: ArrowDownLeft, label: "Receive", href: "/receive" },
    { icon: Repeat, label: "Swap", href: "/swap" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
      <div className="container mx-auto">
        <div className="grid grid-cols-5 h-16">
          {items.map(({ icon: Icon, label, href }) => (
            <Link 
              href={href} 
              key={href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors hover:text-primary ${
                location === href ? "text-primary" : "text-muted-foreground"
              }`}
              role="button"
              aria-current={location === href ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
