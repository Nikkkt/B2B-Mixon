# B2B Mixon

Modern B2B ordering platform for Mixon distributors. The system combines an ASP.NET Core Web API backend (C# / .NET 9) with a React 19 + Vite frontend to deliver rich order orchestration, product catalog management, inventory uploads, and customer self‑service tools.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Repository Structure](#repository-structure)
3. [Features](#features)
4. [Environment & Prerequisites](#environment--prerequisites)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Development Workflow](#development-workflow)
8. [Testing](#testing)
9. [API Documentation](#api-documentation)
10. [Deployment Notes](#deployment-notes)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)

---

## Architecture Overview

| Layer     | Stack / Tools | Responsibilities |
|-----------|---------------|------------------|
| Backend   | ASP.NET Core 9 Web API, EF Core 9, PostgreSQL, QuestPDF, ClosedXML, ExcelDataReader | Authentication, authorization, cart & orders domain, inventory ingestion, PDF/Excel export, multi‑role access rules. |
| Frontend  | React 19, Vite 7, React Router 7, React Query, Axios, Tailwind/PostCSS, React Icons | Customer & admin portals, order creation, mass import flows, availability dashboards, responsive UI components. |
| AuthN/Z   | JWT Bearer, custom roles (admin, manager, department, user) | Issued by backend and consumed through Axios interceptors. |
| Storage   | PostgreSQL (via `AppDbContext` migrations) | Core transactional data: users, departments, products, cart, orders, inventory snapshots, discount profiles. |

---

## Repository Structure

```
B2B-Mixon/
├── backend/                # ASP.NET Core solution
│   ├── Controllers/
│   ├── DTOs/
│   ├── Models/
│   ├── Services/
│   ├── Migrations/
│   ├── appsettings*.json
│   └── backend.csproj
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── assets/
│   ├── package.json
│   └── vite.config.js
└── README.md               # You are here
```

---

## Features

### Customer / Sales Portal
- Guided order catalog by directions, groups, and availability (supports bulk "add all to cart" logic).
- Order by codes flow with XLS import (header optional) and manual paste lists.
- Smart cart with live pricing, discounts, weight/volume totals, and checkout into order management.
- Inventory viewers by branch, group, or SKU (with Excel/PDF export and department scoping).

### Admin Tools
- Department & direction administration, product group discount uploads, profile editing.
- Inventory snapshot uploads per department with Excel templates (no header requirement, autodetection).
- Order history with advanced scopes (my / managed / department / all) and PDF exports.

### Data Ingestion & Exports
- Excel import pipelines (ClosedXML + ExcelDataReader) for products, discounts, availability.
- QuestPDF PDF rendering for order documents and history.
- Centralized upload validation to ensure column order is respected even without headers.

---

## Environment & Prerequisites

| Requirement | Version |
|-------------|---------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 9.0 (same as `TargetFramework`)
| [Node.js](https://nodejs.org/) | ≥ 20.x LTS recommended
| npm / pnpm / yarn | Latest (npm used in scripts)
| PostgreSQL | 14+ (locally or via Docker)

### Environment Variables

Create `backend/.env` (or configure user secrets) with at least:

```
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__Default=Host=localhost;Port=5432;Database=b2b;Username=postgres;Password=postgres
Jwt__Issuer=https://mixon.local
Jwt__Audience=https://mixon.local
Jwt__Key=super-secret-key
Email__Host=smtp.example.com
Email__Port=587
Email__User=mailer@example.com
Email__Password=your_password
```

For the frontend, copy `.env.example` to `.env` if present or simply set:

```
VITE_API_URL=http://localhost:5249/api
```

---

## Backend Setup

```bash
cd backend
dotnet restore
dotnet ef database update   # applies migrations
dotnet run                  # launches on http://localhost:5249
```

### Useful Commands
- `dotnet watch run` – auto-rebuild API during development.
- `dotnet ef migrations add <Name>` – add schema changes.
- `dotnet test` – when tests are added.

Backoffice seeding helpers live under `backend/Seeding` and `backend/DiscountSeeder`. Use them to backfill discount profiles when needed.

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

Additional scripts:

| Script | Description |
|--------|-------------|
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the built assets locally |
| `npm run lint` | ESLint check with React rules |

React Query handles async caching, Axios uses a shared client with JWT injection, and Tailwind/PostCSS powers the design system.

---

## Development Workflow

1. Create a feature branch (`git checkout -b feature/xyz`).
2. Update backend/ frontend as needed.
3. Run formatting/lint (C#: `dotnet format` if installed, JS: `npm run lint`).
4. Ensure database migrations are generated/migrated.
5. Submit PR with summary + testing evidence.

Tips:
- Keep Excel import column ordering at the top of each file to avoid regressions.
- When touching inventory reservation / cart logic, add regression tests in the relevant service or at least document manual verification steps.

---

## Testing

Currently unit/integration tests are limited; recommended approach:

```bash
# Backend
cd backend
dotnet test

# Frontend (once vitest / RTL specs are added)
cd frontend
npm run test
```

End-to-end manual checklist includes: upload product catalog, upload availability, place order from `/orders`, bulk add on `/orders-by-code`, verify order history export.

---

## API Documentation

Swagger UI is enabled in Development. When the backend is running:

- Swagger JSON: `http://localhost:5249/swagger/v1/swagger.json`
- Swagger UI: `http://localhost:5249/swagger`

Use the "Authorize" button to paste the JWT token obtained from login.

Key endpoints:

| Area | Sample endpoints |
|------|------------------|
| Auth | `POST /api/auth/login`, `POST /api/auth/refresh` |
| Orders | `GET /api/orders/groups/{directionId}`, `POST /api/orders/upload` |
| Cart | `POST /api/cart/items`, `PATCH /api/cart/items/{id}`, `POST /api/cart/checkout` |
| Availability | `POST /api/availability/uploads`, `GET /api/availability/groups/{id}` |
| Admin | `/api/admin/users`, `/api/admin/product-groups/upload` |

---

## Deployment Notes

- Backend is ready for containerization (no filesystem dependencies). Provide environment variables via app service or container secrets.
- Frontend builds with `npm run build`; serve `dist/` through Nginx, Azure Static Web Apps, or Netlify.
- Use HTTPS (reverse proxy) and configure `VITE_API_URL` to point at the deployed API.
- Database migrations should be applied during CI/CD via `dotnet ef database update` or migration bundles.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ClosedXML` version warning (NU1603) | NuGet restores 0.104.x automatically; safe to ignore or upgrade in `backend.csproj`. |
| Excel upload rejects files without headers | Ensure column order matches required specification (see service constants). |
| `dotnet ef` not found | Install `dotnet-ef` tool (`dotnet tool install --global dotnet-ef`). |
| API 401 responses | Verify JWT saved in `localStorage` and `VITE_API_URL` matches backend origin. |

---

## Contributing

1. Fork the repository & create a branch.
2. Make changes with clear, concise commits.
3. Update README / comments when introducing new workflows.
4. Ensure code follows existing style (C# analyzers, ESLint, Tailwind conventions).
5. Test locally before submitting a pull request.

For major features, create an issue describing the proposal before coding.

---

© Mixon B2B Platform — crafted with ASP.NET Core & React.