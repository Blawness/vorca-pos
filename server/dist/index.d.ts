import { Application } from "express";
import { PrismaClient } from "@prisma/client";
export declare const prisma: PrismaClient<{
    log: ("error" | "query" | "warn")[];
}, "error" | "query" | "warn", import("@prisma/client/runtime/library").DefaultArgs>;
declare const app: Application;
export default app;
//# sourceMappingURL=index.d.ts.map