import type { LucideIcon } from "lucide-react";
import { BarChart3, Boxes, Receipt, RefreshCcw, Users } from "lucide-react";
import type { UserRole } from "@/lib/roles";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navByRole: Record<UserRole, NavItem[]> = {
  cashier: [
    { label: "POS Checkout", href: "/pos", icon: Receipt },
    { label: "Returns", href: "/pos?tab=returns", icon: RefreshCcw },
  ],
  manager: [
    { label: "Inventory", href: "/inventory", icon: Boxes },
    { label: "Shift & Staff", href: "/inventory?tab=staff", icon: Users },
  ],
  owner: [
    { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { label: "Location Trends", href: "/dashboard?tab=locations", icon: Boxes },
  ],
};
