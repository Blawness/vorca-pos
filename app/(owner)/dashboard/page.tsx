"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { KpiHero } from "@/components/domain/kpi-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<{
    totalTransactions: number;
    totalRevenue: number;
    averageTransaction: number;
    topLocation: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/sign-in");
      return;
    }
    loadAnalytics();
  }, [token]);

  const loadAnalytics = async () => {
    if (!token) return;
    try {
      const data = await api.getAnalytics(token);
      setAnalytics(data);
    } catch (error: any) {
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || isLoading) return null;

  return (
    <main className="space-y-4">
      <KpiHero />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trend Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Transactions</span>
              <span className="font-medium">{analytics?.totalTransactions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Transaction</span>
              <span className="font-medium">Rp {analytics?.averageTransaction.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Revenue</span>
              <span className="font-medium">Rp {analytics?.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Top Location</span>
              <span className="font-medium">{analytics?.topLocation}</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
