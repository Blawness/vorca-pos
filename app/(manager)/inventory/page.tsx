"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InventoryItem = {
  id: string;
  quantity: number;
  lowStockThreshold: number;
  product: { id: string; name: string; sku: string };
  location: { id: string; name: string; code: string };
};

export default function InventoryPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("MANUAL");

  useEffect(() => {
    if (!token) {
      router.push("/sign-in");
      return;
    }
    loadInventory();
  }, [token]);

  const loadInventory = async () => {
    if (!token) return;
    try {
      const [invData, lowData] = await Promise.all([
        api.getInventory(token),
        api.getLowStock(token),
      ]);
      setInventory(invData);
      setLowStock(lowData);
    } catch (error: any) {
      toast.error("Failed to load inventory");
    }
  };

  const handleAdjustment = async () => {
    if (!token || !selectedItem) return;
    setIsLoading(true);
    try {
      await api.createAdjustment(token, {
        inventoryId: selectedItem.id,
        quantity: adjustmentQty,
        reason: adjustmentReason as any,
      });
      toast.success("Inventory adjusted");
      setAdjustmentOpen(false);
      loadInventory();
    } catch (error: any) {
      toast.error(error.message || "Adjustment failed");
    } finally {
      setIsLoading(false);
    }
  };

  const openAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentQty(0);
    setAdjustmentReason("MANUAL");
    setAdjustmentOpen(true);
  };

  if (!token) return null;

  return (
    <main className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory Overview</CardTitle>
          <Button variant="outline" onClick={() => router.push("/inventory/transfers")}>
            View Transfers
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="size-4 text-amber-500" />
              {lowStock.length} SKUs are below safety stock and require replenishment.
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>On Hand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.sku}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.location.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {item.quantity <= item.lowStockThreshold ? (
                      <Badge variant="destructive">Low stock</Badge>
                    ) : (
                      <Badge variant="secondary">Healthy</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAdjustment(item)}
                    >
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription>
              {selectedItem?.product.name} at {selectedItem?.location.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity Change</label>
              <Input
                type="number"
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 0)}
                placeholder="Positive for add, negative for remove"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual Adjustment</SelectItem>
                  <SelectItem value="STOCK_TAKE">Stock Take</SelectItem>
                  <SelectItem value="DAMAGE">Damage</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustment} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
