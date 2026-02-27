"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const productSchema = zod_1.z.object({
    sku: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    cost: zod_1.z.number().positive().optional(),
    barcode: zod_1.z.string().optional(),
    locationId: zod_1.z.string(),
});
// Get all products (with optional location filter)
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const locationId = String(req.query.locationId || "");
        const products = await index_1.prisma.product.findMany({
            where: locationId ? { locationId } : undefined,
            include: { location: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// Get single product
router.get("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const product = await index_1.prisma.product.findUnique({
            where: { id: String(req.params.id) },
            include: { location: true, inventory: true },
        });
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// Create product (Manager+ only)
router.post("/", auth_1.authenticate, (0, auth_1.requireRole)("MANAGER", "OWNER"), async (req, res) => {
    try {
        const data = productSchema.parse(req.body);
        const product = await index_1.prisma.product.create({
            data,
            include: { location: true },
        });
        // Create inventory record for this product at the location
        await index_1.prisma.inventory.create({
            data: {
                productId: product.id,
                locationId: data.locationId,
                quantity: 0,
            },
        });
        res.status(201).json(product);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.issues });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});
// Update product (Manager+ only)
router.put("/:id", auth_1.authenticate, (0, auth_1.requireRole)("MANAGER", "OWNER"), async (req, res) => {
    try {
        const id = String(req.params.id);
        const data = productSchema.partial().parse(req.body);
        const product = await index_1.prisma.product.update({
            where: { id },
            data,
            include: { location: true },
        });
        res.json(product);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: "Validation error", details: error.issues });
        }
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Product not found" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});
// Delete product (Manager+ only)
router.delete("/:id", auth_1.authenticate, (0, auth_1.requireRole)("MANAGER", "OWNER"), async (req, res) => {
    try {
        await index_1.prisma.product.delete({
            where: { id: String(req.params.id) },
        });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Product not found" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map