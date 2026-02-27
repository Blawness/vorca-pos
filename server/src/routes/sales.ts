import { Router, Response } from "express";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const createSaleSchema = z.object({
  locationId: z.string(),
  items: z.array(saleItemSchema),
  discount: z.number().nonnegative().optional().default(0),
  paymentMethod: z.enum(["CASH", "CARD", "QRIS", "DEBIT"]),
});

// Get all sales (with optional filters)
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const locationId = req.query.locationId ? String(req.query.locationId) : undefined;
    const sales = await prisma.sale.findMany({
      where: locationId ? { locationId } : undefined,
      include: {
        location: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single sale
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const sale = await prisma.sale.findUnique({
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
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create sale (checkout)
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, items, discount, paymentMethod } = createSaleSchema.parse(
      req.body
    );

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
    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
      const createdSale = await tx.sale.create({
        data: {
          invoiceNumber,
          locationId,
          userId: req.user!.id,
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
        } else {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.issues });
    }
    console.error("Sale creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get sales analytics (basic KPIs)
router.get("/analytics/summary", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const locationId = req.query.locationId as string | undefined;

    // Get total sales count
    const totalSales = await prisma.sale.count({
      where: locationId ? { locationId } : undefined,
    });

    // Get total revenue
    const revenueData = await prisma.sale.aggregate({
      where: locationId ? { locationId } : undefined,
      _sum: { total: true },
    });

    // Get recent sales for top location calculation
    const recentSales = await prisma.sale.findMany({
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
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
