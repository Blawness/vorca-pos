import { Router, Response } from "express";
import { prisma } from "../index";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const productSchema = z.object({
  sku: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  cost: z.number().positive().optional(),
  barcode: z.string().optional(),
  locationId: z.string(),
});

// Get all products (with optional location filter)
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const locationId = String(req.query.locationId || "");
    const products = await prisma.product.findMany({
      where: locationId ? { locationId } : undefined,
      include: { location: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single product
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
      include: { location: true, inventory: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create product (Manager+ only)
router.post("/", authenticate, requireRole("MANAGER", "OWNER"), async (req: AuthRequest, res: Response) => {
  try {
    const data = productSchema.parse(req.body);

    const product = await prisma.product.create({
      data,
      include: { location: true },
    });

    // Create inventory record for this product at the location
    await prisma.inventory.create({
      data: {
        productId: product.id,
        locationId: data.locationId,
        quantity: 0,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.issues });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update product (Manager+ only)
router.put("/:id", authenticate, requireRole("MANAGER", "OWNER"), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const data = productSchema.partial().parse(req.body);

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { location: true },
    });

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.issues });
    }
    if ((error as any).code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete product (Manager+ only)
router.delete("/:id", authenticate, requireRole("MANAGER", "OWNER"), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.delete({
      where: { id: String(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    if ((error as any).code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
