import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create locations
  const location1 = await prisma.location.upsert({
    where: { code: "KMG" },
    update: {},
    create: {
      name: "Kemang",
      code: "KMG",
      active: true,
    },
  });

  const location2 = await prisma.location.upsert({
    where: { code: "STB" },
    update: {},
    create: {
      name: "Setiabudi",
      code: "STB",
      active: true,
    },
  });

  // Create users with default password: "password123"
  const hashedPassword = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "owner@vorca.com" },
    update: {},
    create: {
      email: "owner@vorca.com",
      password: hashedPassword,
      name: "John Owner",
      role: "OWNER",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@vorca.com" },
    update: {},
    create: {
      email: "manager@vorca.com",
      password: hashedPassword,
      name: "Jane Manager",
      role: "MANAGER",
    },
  });

  await prisma.user.upsert({
    where: { email: "cashier@vorca.com" },
    update: {},
    create: {
      email: "cashier@vorca.com",
      password: hashedPassword,
      name: "Alex Cashier",
      role: "CASHIER",
    },
  });

  // Create products
  const products = [
    { sku: "BN-CN-001", name: "Americano", price: 28000, locationId: location1.id },
    { sku: "BN-CN-002", name: "Latte", price: 32000, locationId: location1.id },
    { sku: "BN-CN-003", name: "Cappuccino", price: 35000, locationId: location1.id },
    { sku: "BN-BN-012", name: "Croissant", price: 22000, locationId: location1.id },
    { sku: "BN-BN-013", name: "Muffin", price: 18000, locationId: location1.id },
    { sku: "BN-ST-001", name: "Americano", price: 28000, locationId: location2.id },
    { sku: "BN-ST-002", name: "Latte", price: 32000, locationId: location2.id },
    { sku: "BN-ST-003", name: "Croissant", price: 22000, locationId: location2.id },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product as any,
    });
  }

  // Create inventory records
  const allProducts = await prisma.product.findMany();
  
  for (const product of allProducts) {
    await prisma.inventory.upsert({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId: product.locationId,
        },
      },
      update: {},
      create: {
        productId: product.id,
        locationId: product.locationId,
        quantity: Math.floor(Math.random() * 50) + 10,
        lowStockThreshold: 10,
      },
    });
  }

  console.log("✅ Seeding completed!");
  console.log("");
  console.log("📋 Test credentials (password: password123):");
  console.log("   - owner@vorca.com (Owner)");
  console.log("   - manager@vorca.com (Manager)");
  console.log("   - cashier@vorca.com (Cashier)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
