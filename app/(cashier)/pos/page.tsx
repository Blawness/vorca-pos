"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
};

type CartItem = Product & { quantity: number; subtotal: number };

export default function PosPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/sign-in");
      return;
    }
    loadProducts();
  }, [token]);

  const loadProducts = async () => {
    if (!token) return;
    try {
      const data = await api.getProducts(token);
      setProducts(data);
    } catch (error: any) {
      toast.error("Failed to load products");
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, subtotal: product.price }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + delta, subtotal: (item.quantity + delta) * item.price }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleCheckout = async () => {
    if (!token || cart.length === 0) return;
    setIsLoading(true);
    try {
      await api.createSale(token, {
        locationId: products[0]?.locationId || "",
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        discount: 0,
        paymentMethod: "CASH",
      });
      toast.success("Sale completed!");
      setCart([]);
    } catch (error: any) {
      toast.error(error.message || "Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!token) return null;

  return (
    <main className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cashier Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Search SKU, barcode, or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-medium">Products</h3>
              <div className="grid gap-2">
                {filteredProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="justify-between"
                    onClick={() => addToCart(product)}
                  >
                    <span>{product.name}</span>
                    <Badge variant="secondary">Rp {product.price.toLocaleString()}</Badge>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Cart</h3>
              <Card>
                <CardContent className="p-4">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Cart is empty
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, -1)}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>Rp {item.subtotal.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                ×
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-semibold">Rp {total.toLocaleString()}</span>
              </div>

              <Button className="w-full" onClick={handleCheckout} disabled={cart.length === 0 || isLoading}>
                {isLoading ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
