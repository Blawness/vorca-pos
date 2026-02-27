"use client";

import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/domain/app-shell";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/sign-in");
    }
  }, [token]);

  if (!token || !user) return null;

  return (
    <AppShell role="cashier">
      {children}
    </AppShell>
  );
}
