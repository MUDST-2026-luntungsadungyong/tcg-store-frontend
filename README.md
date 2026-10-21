# Mythix TCG Trading Frontend

[![CI Pipeline](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/actions/workflows/ci.yml)
[![Docker Build & Push](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/actions/workflows/docker-image.yml/badge.svg)](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/actions/workflows/docker-image.yml)

Frontend สำหรับแพลตฟอร์ม **Mythix** ระบบค้นหา จอง แลกเปลี่ยน และบันทึกความเป็นเจ้าของการ์ด TCG (Trading Card Game) ระหว่างผู้ซื้อกับผู้ขาย โดยทำหน้าที่เป็น **Reservation and Ownership System** ควบคุมสิทธิ์ความเป็นเจ้าของการ์ดอย่างเป็นระบบ

---

## 📌 Product Model & Lifecycle

เส้นทางหลักของการทำรายการในระบบ:

```text
Buyer reserves cards (Cart Checkout)
               ↓
            PENDING
               ↓  Seller confirms reservation
           CONFIRMED
               ↓  Seller ships and marks Sent
             SENT  ────→ Ownership transferred atomically to Buyer's Collection
               ↓  Buyer confirms delivery
           FULFILLED
```

### หลักการสำคัญของระบบ
- **Off-platform Settlement & Logistics:** การติดต่อชำระเงินและการจัดส่งเกิดขึ้นภายนอก โดยระบบ Mythix จัดการสถานะคำสั่งซื้อและการโอนกรรมสิทธิ์การ์ด
- **Multi-Seller Cart Splitting:** หากการ์ดในตะกร้ามาจากผู้ขายหลายราย ระบบจะแยก Order ตามผู้ขายแต่ละรายโดยอัตโนมัติ
- **Atomic Ownership Transfer:** เมื่อ Order เปลี่ยนสถานะเป็น `SENT` ระบบจะโอนกรรมสิทธิ์การ์ดเข้าสู่ Personal Collection ของผู้ซื้อทันที
- **Fulfillment Confirmation:** เมื่อผู้ซื้อได้รับสินค้าเรียบร้อย ผู้ซื้อกดยืนยันเพื่อปิดรอบ Order เป็น `FULFILLED`

---

## 🏗️ Architecture & Structure

ระบบถูกออกแบบด้วยสถาปัตยกรรมแบบ **Feature-First / Layered Architecture** เพื่อแยกขอบเขตความรับผิดชอบ (Separation of Concerns) อย่างชัดเจน:

```text
src/
├── app/                    # Application Shell, Layouts, Global Router & Providers
│   ├── layouts/            # PublicLayout, WorkspaceLayout (Seller), AdminLayout
│   ├── router/             # Route configurations & ProtectedRoute guards
│   └── styles/             # Global CSS & Tailwind setups
├── entities/               # Core domain types & pure business rules (Card, Order, User, Notification)
├── features/               # Business capabilities แยกตามโดเมน
│   ├── admin/              # Seller applications review, Audit logs, User/Order oversight
│   ├── auth/               # Login, Register, Session management, Seller Application
│   ├── checkout/           # Multi-seller reservation creation & summary
│   ├── collection/         # Personal card collection & Public user collection showcase
│   ├── discovery/          # Card catalog, advanced search, filters, multi-seller detail
│   ├── listings/           # Seller inventory management (CRUD, stocks, pricing)
│   ├── notifications/      # Real-time event notifications inbox
│   ├── profile/            # User profile management
│   ├── reservation-cart/   # Reservation cart state & quantity controls
│   ├── reservations/       # Order tracking (Buyer lifecycle & Seller management)
│   └── stores/             # Public seller storefronts & Seller profile workspace
├── infrastructure/
│   └── mock-db/            # In-browser localStorage database adapter (สำหรับ Offline/Mock Mode)
└── shared/                 # Generic API clients, reusable UI components, utilities, and config
```

### Dependency Flow
```text
app ───────────────→ features
                         │
                         ├────────→ entities
                         ├────────→ shared
                         └────────→ infrastructure/mock-db (เมื่อเปิด Mock Mode)

infrastructure/mock-db ─→ entities
entities ────────────────→ shared (เฉพาะ generic helper ที่จำเป็น)
```
> **กฎเหล็กทางสถาปัตยกรรม:** `entities` ห้าม import จาก `features` หรือ `app`, และโค้ดใน `shared` ต้องเป็น Generic เท่านั้น ไม่ผูกกับ Business Logic ใดๆ

---

## 🗺️ Routes & Role Capabilities

| Route | บทบาท | รายละเอียดหน้าที่ |
| --- | :---: | --- |
| `/` | Public | หน้าแรก, แบนเนอร์ และการ์ดแนะนำ |
| `/cards`, `/cards/:id` | Public | ค้นหา/กรองการ์ด, ดูรายละเอียดและผู้ขายที่เปิดขายการ์ดใบนั้น |
| `/stores/:id` | Public | หน้าร้านค้าของผู้ขายแบบสาธารณะ |
| `/u/:username/collection` | Public | หน้าแสดงคอลเลกชันการ์ดสาธารณะของผู้ใช้งาน |
| `/cart` | Buyer | ตรวจสอบรายการการ์ดที่เลือกและแยกกลุ่มตามผู้ขาย |
| `/checkout` | Buyer | ยืนยันการสั่งจองและสร้างคำสั่งซื้อ |
| `/orders`, `/orders/:id` | Buyer | ติดตามสถานะคำสั่งซื้อ และกดยืนยันรับการ์ด (`FULFILLED`) |
| `/collection` | Buyer | คลังการ์ดสะสมส่วนตัวที่ได้รับการโอนกรรมสิทธิ์แล้ว |
| `/notifications` | Buyer / Seller | กล่องแจ้งเตือนกิจกรรมและอัปเดตสถานะคำสั่งซื้อ |
| `/profile`, `/profile/edit` | Signed-in | จัดการข้อมูลส่วนตัว (ชื่อ, เบอร์โทร, ที่อยู่ติดต่อ) |
| `/workspace/listings` | Seller | จัดการรายการการ์ดที่วางขาย (เพิ่ม, แก้ไข, ลบ, ซ่อน, ตั้งราคา) |
| `/workspace/orders` | Seller | ตรวจสอบคำสั่งซื้อ, ยืนยันรับเงิน และเปลี่ยนสถานะเป็น `SENT` |
| `/workspace/store` | Seller | จัดการข้อมูลหน้าร้านค้า รายละเอียด และนโยบายร้าน |
| `/admin` | Admin | Dashboard ภาพรวมระบบ |
| `/admin/seller-applications` | Admin | ตรวจสอบและอนุมัติ/ปฏิเสธคำขอเป็นผู้ขาย |
| `/admin/orders` | Admin | ตรวจสอบบันทึกคำสั่งซื้อทั้งหมดในระบบ |
| `/admin/audit-logs` | Admin | ตรวจสอบประวัติการทำงาน (Audit Trail) |
| `/admin/users` | Admin | จัดการบัญชีผู้ใช้งานและสิทธิ์ในระบบ |

---

## 🛠️ Tech Stack & Tooling

- **Core Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/) (Data APIs / `createBrowserRouter`)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling & UI:** [Tailwind CSS v3](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/) (Framer Motion)
- **Network & API:** [Axios](https://axios-http.com/)
- **Testing:**
  - **Unit & Component Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
  - **End-to-End Testing:** [Cypress](https://www.cypress.io/)
- **Linting & Code Quality:** [Oxlint](https://oxc.rs/)
- **Containerization:** [Docker](https://www.docker.com/) multi-stage build + Nginx Alpine

---

## 🚀 Getting Started & Local Development

### ความต้องการของระบบ
- **Node.js:** 20.x ขึ้นไป
- **npm:** 10.x ขึ้นไป

### การติดตั้งและเริ่มรัน
```bash
# 1. ติดตั้ง Dependencies
npm install --legacy-peer-deps

# 2. คัดลอกไฟล์ Environment Variables
cp .env.example .env

# 3. รัน Development Server
npm run dev
```

### การตั้งค่าโหมดการทำงาน (`.env`)

#### โหมด 1: Offline Mock Mode (ไม่ต้องต่อ Backend)
ระบบมี Mock Database ภายในเบราว์เซอร์ผ่าน `localStorage` ช่วยให้สามารถทดสอบฟีเจอร์ได้ครบถ้วนโดยไม่ต้องรัน Backend:
```env
VITE_ENABLE_MOCK_API=true
VITE_PORT=3000
```
> **หมายเหตุ:** แนะนำให้ใช้ `VITE_PORT=3000` เสมอ เพื่อให้การรัน Cypress E2E Tests เข้าถึง Port ที่ถูกต้อง

**บัญชีทดสอบใน Mock Mode:**
| Role | Email | Password |
| --- | --- | --- |
| **Buyer** | `user@mythix.com` | รหัสผ่านใดก็ได้ที่ผ่าน validation (เช่น `password123`) |
| **Seller** | `seller@mythix.com` | รหัสผ่านใดก็ได้ที่ผ่าน validation (เช่น `password123`) |
| **Admin** | `admin@mythix.com` | รหัสผ่านใดก็ได้ที่ผ่าน validation (เช่น `password123`) |

#### โหมด 2: Live Backend Mode
เชื่อมต่อไปยัง Backend API จริง:
```env
VITE_ENABLE_MOCK_API=false
VITE_API_BASE_URL=https://your-api-endpoint.com/api
```

---

## 🧪 Quality Assurance & Testing

```bash
# ตรวจสอบ Code Quality & Typecheck
npm run lint

# รัน Security & Dependency Audit
npm run audit

# รัน Unit & Component Tests ทั้งหมด
npm run test

# รัน Cypress E2E Tests (โหมด Headless)
npm run test:e2e

# เปิดหน้าต่าง Cypress GUI เพื่อทดสอบทีละตัว
npm run test:e2e:open

# รันเฉพาะชุด E2E สำหรับส่วนงานสำคัญ
npm run test:e2e:smoke       # Core Smoke Tests
npm run test:e2e:auth        # Authentication Flow
npm run test:e2e:order       # Order Fastforward Lifecycle
npm run test:e2e:admin       # Admin Workflows
npm run test:e2e:staging     # Live Staging Integration Journey

# ตรวจสอบการ Build Production
npm run build
```

---

## 🔄 CI/CD & Automation Workflow

Repository นี้รองรับระบบ CI/CD อัตโนมัติ 100%:

1. **Branch Naming Standard:**
   - รูปแบบที่อนุญาต: `fix/<topic>` หรือ `<type>/scrum-<number>-<description>` (เช่น `feat/scrum-27-seller-dashboard`)
2. **Semantic Pull Request:**
   - ชื่อ PR ต้องขึ้นต้นด้วย Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`, `refactor:`
3. **100% Automated Merge Queue:**
   - เมื่อเปิด PR เข้าสู่ `main` ระบบ Workflow `Auto Enable Merge Queue` จะสั่งเปิด Auto-merge และนำ PR เข้าคิวทันทีโดยอัตโนมัติ
   - GitHub Actions จะรัน `ci.yml` บน Temporary Branch ผ่าน event `merge_group`
   - เมื่อการทดสอบผ่านครบถ้วน โค้ดจะถูก Merge เข้า `main` ทันที และทำการ Build/Push Docker Image ขึ้นสู่ GitHub Container Registry (GHCR) โดยอัตโนมัติ

---

## 📚 Related Documentation

- [Architecture & Boundaries](docs/architecture.md)
- [Product Requirements](docs/product-requirements.md)
- [E2E Staging Journey](docs/e2e-staging-journey.md)
- [Migration History](docs/migration-log.md)
- [Contribution Guidelines](CONTRIBUTING.md)
