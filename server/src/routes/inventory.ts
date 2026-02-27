import { Router, Response } from "express";
import { prisma } from "../index";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const adjustmentSchema = z.object({
  inventoryId: z.string(),
  quantity: z.number().int(),
  reason: z.enum(["STOCK_TAKE", "DAMAGE", "RETURN", "TRANSFER", "MANUAL"]),
  notes: z.string().optional(),
});

const transferSchema = z.object({
  fromLocationId: z.string(),
  toLocationId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
});

// Get inventory by location
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const locationId = req.query.locationId ? String(req.query.locationId) : undefined;
    const inventory = await prisma.inventory.findMany({
      where: locationId ? { locationId } : undefined,
      include: {
        product: true,
        location: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get low stock items
router.get("/alerts/low-stock", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lowStock = await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: prisma.inventory.fields.lowStockThreshold,
        },
      },
      include: {
        product: true,
        location: true,
      },
    });
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create inventory adjustment (Manager+ only)
router.post(
  "/adjustments",
  authenticate,
  requireRole("MANAGER", "OWNER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { inventoryId, quantity, reason, notes } = adjustmentSchema.parse(
        req.body
      );

      const adjustment = await prisma.inventoryAdjustment.create({
        data: {
          inventoryId,
          quantity,
          reason,
          notes,
          userId: req.user!.id,
        },
        include: {
          inventory: {
            include: { product: true, location: true },
          },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Update inventory quantity
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: { increment: quantity } },
      });

      res.status(201).json(adjustment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.issues });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Create transfer request (Manager+ only)
router.post(
  "/transfers",
  authenticate,
  requireRole("MANAGER", "OWNER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fromLocationId, toLocationId, items } = transferSchema.parse(
        req.body
      );

      const transfer = await prisma.transfer.create({
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.issues });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all transfers
router.get("/transfers", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const transfers = await prisma.transfer.findMany({
      include: {
        fromLocation: true,
        toLocation: true,
        items: true,
      },
      orderBy: { requestedAt: "desc" },
    });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Approve transfer (Manager+ only)
router.patch(
  "/transfers/:id/approve",
  authenticate,
  requireRole("MANAGER", "OWNER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const transferId = String(req.params.id);

      const transfer = await prisma.transfer.update({
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
      const transferItems = await prisma.transferItem.findMany({
        where: { transfer: { id: transferId } },
      });

      for (const item of transferItems) {
        await prisma.inventory.update({
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
    } catch (error) {
      if ((error as any).code === "P2025") {
        return res.status(404).json({ error: "Transfer not found" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Complete transfer (Manager+ only)
router.patch(
  "/transfers/:id/complete",
  authenticate,
  requireRole("MANAGER", "OWNER"),
  async (req: AuthRequest, res: Response) => {
    try {
      const transferId = String(req.params.id);
      const transfer = await prisma.transfer.findUnique({
        where: { id: transferId },
        include: { items: true },
      });

      if (!transfer) {
        return res.status(404).json({ error: "Transfer not found" });
      }

      // Add to destination location
      for (const item of transfer.items) {
        const inventory = await prisma.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: String(transfer.toLocationId),
            },
          },
        });

        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      const updatedTransfer = await prisma.transfer.update({
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
    } catch (error) {
      if ((error as any).code === "P2025") {
        return res.status(404).json({ error: "Transfer not found" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
