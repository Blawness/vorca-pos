import Link from "next/link";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Cashier", href: "/pos" },
  { label: "Manager", href: "/inventory" },
  { label: "Owner", href: "/dashboard" },
] as const;

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <Store className="size-4" />
          Vorca POS
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>

        <Button asChild size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </nav>
  );
}
