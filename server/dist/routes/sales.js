"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    quantity: zod_1.z.number().int().positive(),
    price: zod_1.z.number().positive(),
});
const createSaleSchema = zod_1.z.object({
    locationId: zod_1.z.string(),
    items: zod_1.z.array(saleItemSchema),
    discount: zod_1.z.number().nonnegative().optional().default(0),
    paymentMethod: zod_1.z.enum(["CASH", "CARD", "QRIS", "DEBIT"]),
});
// Get all sales (with optional filters)
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const locationId = req.query.locationId ? String(req.query.locationId) : undefined;
        const sales = await index_1.prisma.sale.findMany({
            where: locationId ? { locationId } : undefined,
            include: {
                location: true,
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(sales);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get single sale
router.get("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const sale = await index_1.prisma.sale.findUnique({
            where: { id: String(req.params.id) },
            include: {
                location: true,
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } },
            },
        });
        if (!sale) {
            return res.status(404).json({ error: "Sale not found" });
        }
        res.json(sale);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// Create sale (checkout)
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const { locationId, items, discount, paymentMethod } = createSaleSchema.parse(req.body);
        // Generate invoice number
        const date = new Date();
        const invoiceNumber = `INV-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-6)}`;
        // Calculate totals
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.price * item.quantity;
        }
        const tax = subtotal * 0.11; // 11% tax
        const total = subtotal + tax - discount;
        // Create sale with items in a transaction
        const sale = await index_1.prisma.$transaction(async (tx) => {
            // Create the sale
            const createdSale = await tx.sale.create({
                data: {
                    invoiceNumber,
                    locationId,
                    userId: req.user.id,
                    subtotal,
                    tax,
                    discount,
                    total,
                    paymentMethod,
                    status: "COMPLETED",
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            subtotal: item.price * item.quantity,
                        })),
                    },
                },
                include: {
                    location: true,
                    user: { select: { id: true, name: true, email: true } },
                    items: { include: { product: true } },
                },
            });
            // Update inventory for each item
            for (const item of items) {
                const inventory = await tx.inventory.findUnique({
                    where: {
                        productId_locationId: {
                            productId: item.productId,
                            locationId,
                        },
                    },
                });
                if (inventory) {
                    await tx.inventory.update({
                        where: { id: inventory.id },
                        data: { quantity: { decrement: item.quantity } },
                    });
                }
                else {
                    // Create inventory if it doesn't exist
                    await tx.inventory.create({
                        data: {
                            productId: item.productId,
                            locationId,
                            quantity: -item.quantity,
                        },
                    });
                }
            }
            return createdSale;
        });
        res.status(201).json(sale);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation error", details: error.issues });
        }
        console.error("Sale creation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get sales analytics (basic KPIs)
router.get("/analytics/summary", auth_1.authenticate, async (req, res) => {
    try {
        const locationId = req.query.locationId;
        // Get total sales count
        const totalSales = await index_1.prisma.sale.count({
            where: locationId ? { locationId } : undefined,
        });
        // Get total revenue
        const revenueData = await index_1.prisma.sale.aggregate({
            where: locationId ? { locationId } : undefined,
            _sum: { total: true },
        });
        // Get recent sales for top location calculation
        const recentSales = await index_1.prisma.sale.findMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
            },
            include: { location: true },
            orderBy: { total: "desc" },
            take: 10,
        });
        res.json({
            totalTransactions: totalSales,
            totalRevenue: revenueData._sum.total || 0,
            averageTransaction: totalSales > 0 ? (revenueData._sum.total || 0) / totalSales : 0,
            topLocation: recentSales[0]?.location?.name || "N/A",
        });
    }
    catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=sales.js.map