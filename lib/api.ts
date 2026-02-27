const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  token?: string;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; name: string; role: string } }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  register: (email: string, password: string, name: string, role?: "OWNER" | "MANAGER" | "CASHIER") =>
    request<{ token: string; user: { id: string; email: string; name: string; role: string } }>("/auth/register", {
      method: "POST",
      body: { email, password, name, role },
    }),

  getMe: (token: string) =>
    request<{ id: string; email: string; name: string; role: string }>("/auth/me", { token }),

  // Products
  getProducts: (token: string, locationId?: string) =>
    request<any[]>("/products" + (locationId ? `?locationId=${locationId}` : ""), { token }),

  getProduct: (token: string, id: string) =>
    request<any>(`/products/${id}`, { token }),

  createProduct: (token: string, data: any) =>
    request<any>("/products", { method: "POST", token, body: data }),

  // Inventory
  getInventory: (token: string, locationId?: string) =>
    request<any[]>("/inventory" + (locationId ? `?locationId=${locationId}` : ""), { token }),

  getLowStock: (token: string) =>
    request<any[]>("/inventory/alerts/low-stock", { token }),

  createAdjustment: (token: string, data: { inventoryId: string; quantity: number; reason: string; notes?: string }) =>
    request<any>("/inventory/adjustments", { method: "POST", token, body: data }),

  createTransfer: (token: string, data: { fromLocationId: string; toLocationId: string; items: { productId: string; quantity: number }[] }) =>
    request<any>("/inventory/transfers", { method: "POST", token, body: data }),

  getTransfers: (token: string) =>
    request<any[]>("/inventory/transfers", { token }),

  approveTransfer: (token: string, id: string) =>
    request<any>(`/inventory/transfers/${id}/approve`, { method: "PATCH", token }),

  completeTransfer: (token: string, id: string) =>
    request<any>(`/inventory/transfers/${id}/complete`, { method: "PATCH", token }),

  // Sales
  getSales: (token: string, locationId?: string, status?: string) =>
    request<any[]>("/sales" + (locationId ? `?locationId=${locationId}` : "") + (status ? `&status=${status}` : ""), { token }),

  getSale: (token: string, id: string) =>
    request<any>(`/sales/${id}`, { token }),

  createSale: (token: string, data: { locationId: string; items: { productId: string; quantity: number; price: number }[]; discount?: number; paymentMethod: string }) =>
    request<any>("/sales", { method: "POST", token, body: data }),

  getAnalytics: (token: string, locationId?: string) =>
    request<{ totalTransactions: number; totalRevenue: number; averageTransaction: number; topLocation: string }>("/sales/analytics/summary" + (locationId ? `?locationId=${locationId}` : ""), { token }),
};
