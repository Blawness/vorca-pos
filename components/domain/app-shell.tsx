"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { navByRole } from "@/lib/navigation";
import { roleLabels, type UserRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type AppShellProps = {
  role: UserRole;
  children: React.ReactNode;
};

export function AppShell({ role, children }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useMemo(() => navByRole[role], [role]);
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push("/sign-in");
  };

  const nav = (
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            className="h-10 w-full justify-start gap-2"
          >
            <Link href={item.href}>
              <Icon className="size-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[240px_1fr]">
        <Card className="hidden h-fit md:block">
          <CardHeader>
            <CardTitle>Vorca POS</CardTitle>
            <CardDescription>{roleLabels[role]} Workspace</CardDescription>
          </CardHeader>
          <CardContent>{nav}</CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between gap-2 pt-6">
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <Menu className="size-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="pt-10">
                    {nav}
                  </SheetContent>
                </Sheet>

                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="size-4" />
                  Quick search
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Alert center">
                  <Bell className="size-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary">Account</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/">Switch role</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          <Separator />
          {children}
        </div>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search actions, items, or screens..." />
        <CommandList>
          <CommandEmpty>No quick action found.</CommandEmpty>
          <CommandGroup heading="Routes">
            {items.map((item) => (
              <CommandItem key={item.href} asChild>
                <Link href={item.href}>{item.label}</Link>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
