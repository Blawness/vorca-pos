"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const adjustmentSchema = zod_1.z.object({
    inventoryId: zod_1.z.string(),
    quantity: zod_1.z.number().int(),
    reason: zod_1.z.enum(["STOCK_TAKE", "DAMAGE", "RETURN", "TRANSFER", "MANUAL"]),
    notes: zod_1.z.string().optional(),
});
const transferSchema = zod_1.z.object({
    fromLocationId: zod_1.z.string(),
    toLocationId: zod_1.z.string(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        quantity: zod_1.z.number().int().positive(),
    })),
});
// Get inventory by location
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const locationId = req.query.locationId ? String(req.query.locationId) : undefined;
        const inventory = await index_1.prisma.inventory.findMany({
            where: locationId ? { locationId } : undefined,
            include: {
                product: true,
                location: true,
            },
            orderBy: { updatedAt: "desc" },
        });
        res.json(inventory);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get low stock items
router.get("/alerts/low-stock", auth_1.authenticate, async (req, res) => {
    try {
        const lowStock = await index_1.prisma.inventory.findMany({
            where: {
                quantity: {
                    lte: index_1.prisma.inventory.fields.lowStockThreshold,
                },
            },
            include: {
                product: true,
                location: true,
            },
        });
        res.json(lowStock);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// Create inventory adjustment (Manager+ only)
router.post("/adjustments", auth_1.authenticate, (0, auth_1.requireRole)("MANAGER", "OWNER"), async (req, res) => {
    try {
        const { inventoryId, quantity, reason, notes } = adjustmentSchema.parse(req.body);
        const adjustment = await index_1.prisma.inventoryAdjustment.create({
            data: {
                inventoryId,
                quantity,
                reason,
                notes,
                userId: req.user.id,
            },
            include: {
                inventory: {
                    include: { product: true, location: true },
                },
                user: { select: { id: true, name: true, email: true } },
            },
        });
        // Update inventory quantity
        await index_1.prisma.inventory.update({
            where: { id: inventoryId },
            data: { quantity: { increment: quantity } },
        });
        res.status(201).json(adjustment);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation error", details: error.issues });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});
// Create transfer request (Manager+ only)
router.post("/transfers", auth_1.authenticate, (0, auth_1.requireRole)("MANAGER", "OWNER"), async (req, res) => {
    try {
        const { fromLocationId, toLocationId, items } = transferSchema.parse(req.body);
        const transfer = await index_1.prisma.transfer.create({
            data: {
                fromLocationId,
                toLocationId,
                status: "PENDING",
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        receivedQuantity: 0,
                    })),
                },
            },
            include: {
                fromLocation: true,
                toLocation: true,
                items: true,
            },
        });
        res.status(201).json(transfer);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation error", details: error.issues });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get all transfers
router.get("/transfers", auth_1.authenticate, async (req, res) => {
    try {
        const transfers = await index_1.prisma.transfer.findMany({
            include: {
                fromLocation: true,
                toLocation: true,
                items: true,
            },
            orderBy: { requestedAt: "desc" },
        });
        res.json(transfers);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// Approve transfer (Manager+ only)
router.patch("/transfers/:id/approve", auth_1.authenticate, (0, auth_1.requireRole)("MANAGER", "OWNER"), async (req, res) => {
    try {
        const transferId = String(req.params.id);
        const transfer = await index_1.prisma.transfer.update({
            where: { id: transferId },
            data: {
                status: "IN_TRANSIT",
                approvedAt: new Date(),
            },
            include: {
                fromLocation: true,
                toLocation: true,
                items: true,
            },
        });
        // Deduct from source location
        const transferItems = await index_1.prisma.transferItem.findMany({
            where: { transfer: { id: transferId } },
        });
        for (const item of transferItems) {
            await index_1.prisma.inventory.update({
                where: {
                    productId_locationId: {
                        productId: item.productId,
                        locationId: String(transfer.fromLocationId),
                    },
                },
                data: { quantity: { decrement: item.quantity } },
            });
        }
        res.json(transfer);
    }
    catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Transfer not found" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});
// Complete transfer (Manager+ only)
router.patch("/transfers/:id/complete", auth_1.authenticate, (0, auth_1.requireRole)("MANAGER", "OWNER"), async (req, res) => {
    try {
        const transferId = String(req.params.id);
        const transfer = await index_1.prisma.transfer.findUnique({
            where: { id: transferId },
            include: { items: true },
        });
        if (!transfer) {
            return res.status(404).json({ error: "Transfer not found" });
        }
        // Add to destination location
        for (const item of transfer.items) {
            const inventory = await index_1.prisma.inventory.findUnique({
                where: {
                    productId_locationId: {
                        productId: item.productId,
                        locationId: String(transfer.toLocationId),
                    },
                },
            });
            if (inventory) {
                await index_1.prisma.inventory.update({
                    where: { id: inventory.id },
                    data: { quantity: { increment: item.quantity } },
                });
            }
        }
        const updatedTransfer = await index_1.prisma.transfer.update({
            where: { id: transferId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
            },
            include: {
                fromLocation: true,
                toLocation: true,
                items: true,
            },
        });
        res.json(updatedTransfer);
    }
    catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Transfer not found" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=inventory.js.map