# Vorca POS - MVP

A multi-location Point of Sale system with real-time inventory management and centralized reporting.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 3. Run Backend Server

```bash
npm run dev:server
```

Server will start on `http://localhost:3001`

### 4. Run Frontend

```bash
npm run dev
```

Frontend will start on `http://localhost:3000`

## Test Credentials

All users have password: `password123`

- **Owner**: `owner@vorca.com` - Access to dashboard and analytics
- **Manager**: `manager@vorca.com` - Access to inventory management
- **Cashier**: `cashier@vorca.com` - Access to POS checkout

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create product (Manager+)
- `PUT /api/v1/products/:id` - Update product (Manager+)
- `DELETE /api/v1/products/:id` - Delete product (Manager+)

### Inventory
- `GET /api/v1/inventory` - List inventory
- `GET /api/v1/inventory/alerts/low-stock` - Get low stock alerts
- `POST /api/v1/inventory/adjustments` - Create adjustment (Manager+)
- `POST /api/v1/inventory/transfers` - Create transfer (Manager+)
- `GET /api/v1/inventory/transfers` - List transfers
- `PATCH /api/v1/inventory/transfers/:id/approve` - Approve transfer (Manager+)
- `PATCH /api/v1/inventory/transfers/:id/complete` - Complete transfer (Manager+)

### Sales
- `GET /api/v1/sales` - List sales
- `GET /api/v1/sales/:id` - Get single sale
- `POST /api/v1/sales` - Create sale (checkout)
- `GET /api/v1/sales/analytics/summary` - Get analytics KPIs

## Tech Stack

### Backend
- Node.js + Express 5 (TypeScript)
- Prisma ORM with SQLite (for development)
- JWT authentication
- Zod validation

### Frontend
- Next.js 16 App Router
- React 19
- shadcn/ui components
- TypeScript

## Project Structure

```
vorca-pos/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui primitives
│   └── domain/      # Business logic components
├── lib/             # Utilities and API client
├── prisma/          # Database schema and migrations
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/  # API route handlers
│   │   ├── middleware/ # Auth middleware
│   │   └── index.ts # Server entry
│   └── dist/        # Compiled output
└── package.json
```

## Development

### Database Commands
```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed sample data
npm run db:studio     # Open Prisma Studio
```

### Build Commands
```bash
npm run build:server  # Build backend
npm run build         # Build frontend
```

## Environment Variables

Create `.env` file:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-change-in-production"
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

## MVP Features

✅ User authentication with JWT
✅ Role-based access control (Owner, Manager, Cashier)
✅ Product catalog management
✅ Real-time inventory tracking
✅ Low stock alerts
✅ Inventory adjustments
✅ Transfer requests between locations
✅ POS checkout flow
✅ Sales analytics dashboard

## Next Steps

- [ ] Offline mode support
- [ ] Receipt printing
- [ ] Customer loyalty program
- [ ] Advanced reporting
- [ ] Payment gateway integration
- [ ] Multi-currency support
