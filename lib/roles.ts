export type UserRole = "cashier" | "manager" | "owner";

export const roleLabels: Record<UserRole, string> = {
  cashier: "Cashier",
  manager: "Manager",
  owner: "Owner",
};
