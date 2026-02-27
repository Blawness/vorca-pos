"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const kpis = [
  { label: "Gross Revenue", value: "Rp 148.3M" },
  { label: "Transactions", value: "12,481" },
  { label: "Top Location", value: "Kemang" },
] as const;

export function KpiHero() {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.08 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{kpi.value}</CardContent>
          </Card>
        </motion.div>
      ))}
    </section>
  );
}
