import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Navbar } from "@/components/domain/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const roles = [
  {
    title: "Cashier",
    description: "Fast checkout, cart edits, payments, and return handling.",
    href: "/pos",
  },
  {
    title: "Manager",
    description: "Inventory monitoring, transfer requests, and stock controls.",
    href: "/inventory",
  },
  {
    title: "Owner",
    description: "Cross-location KPIs, trend insights, and reporting triggers.",
    href: "/dashboard",
  },
] as const;

export function RoleGateway() {
  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
        <header className="space-y-3">
          <Badge variant="secondary" className="gap-1">
            <Shield className="size-3.5" />
            Role-aware UI foundation
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            Vorca POS Frontend
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Choose a workspace to access persona-specific flows built with
            shadcn/ui primitives and ready for selective Aceternity enhancements.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.title}>
              <CardHeader>
                <CardTitle>{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Primary navigation and route group for {role.title.toLowerCase()}{" "}
                workflows is ready.
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full justify-between">
                  <Link href={role.href}>
                    Open workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
