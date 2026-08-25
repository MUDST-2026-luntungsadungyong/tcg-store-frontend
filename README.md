# 🎴 Mythix TCG Store & Trading Platform — Frontend

> **ITDS323 Practical DevOps and Applications** — Mahidol University DST  
> **Repository:** `https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend`  
> **Frontend Stack:** React 18 + Vite + TypeScript + Tailwind CSS (v3) + Zustand + Axios

---

## 📑 สารบัญ (Table of Contents)
1. [Tech Stack & ข้อตกลงเรื่อง CSS Framework](#-tech-stack--ข้อตกลงเรื่อง-css-framework-มาตรฐาน)
2. [คู่มือการใช้ CSS Framework (Tailwind CSS v3) สำหรับทีม](#-คู่มือการใช้-css-framework-tailwind-css-v3-สำหรับทีม)
3. [โครงสร้างโปรเจกต์ (Folder Structure)](#-โครงสร้างโปรเจกต์-folder-structure)
4. [การเริ่มต้นใช้งานโปรเจกต์ (Quick Start)](#-การเริ่มต้นใช้งานโปรเจกต์-quick-start)
5. [คำสั่งพัฒนาและทดสอบ (Development Commands)](#-คำสั่งพัฒนาและทดสอบ-development-commands)
6. [Git Workflow & ข้อตกลงการตั้งชื่อ Commit (Conventional Commits)](#-git-workflow--conventional-commits)
7. [แผนงานพัฒนาตาม Sprint & Checkpoint Timeline](#-แผนงานพัฒนาตาม-sprint--checkpoint-timeline)
8. [คู่มือการแบ่งงานและพัฒนาแบบแยกส่วน (Module Development Guide)](ISSUE_GUIDE.md)
9. [การเชื่อมต่อ Backend (Spring Boot Integration & Mock Mode)](#-การเชื่อมต่อ-backend-spring-boot-integration--mock-mode)
10. [Docker & Kubernetes Deployment](#-docker--kubernetes-deployment)

---

## 🛠️ Tech Stack & ข้อตกลงเรื่อง CSS Framework มาตรฐาน

| หมวดหมู่ | เทคโนโลยีที่ใช้ | วัตถุประสงค์ / หมายเหตุ |
|---|---|---|
| **Core Framework** | React 18 + Vite (TypeScript) | ความเร็วในการโหลดสูง, Hot Module Replacement รวดเร็ว |
| **CSS Framework** | **Tailwind CSS (v3)** + PostCSS | **มาตรฐานหลักของทีม** ป้องกันปัญหา CSS ชนกัน |
| **Design Tokens** | CSS Variables + Figma Tokens | กำหนด Color Palette และ Typography ให้ตรงกับ Figma |
| **State Management**| Zustand | จัดการ Cart, Auth และ Global UI State ได้กระชับ |
| **Routing** | React Router v6 | รองรับ SPA Navigation, Protected Routes และ Admin Guards |
| **HTTP Client** | Axios | มี Interceptors สำหรับแนบ JWT Token อัตโนมัติ |
| **Icons & Helpers** | Lucide React / clsx / tailwind-merge | ไอคอนคมชัด และฟังก์ชันผสาน Tailwind Class |
| **Unit Testing** | Vitest + React Testing Library | รันชุดทดสอบความถูกต้องของ Component และ State |

---

## 🎨 คู่มือการใช้ CSS Framework (Tailwind CSS v3) สำหรับทีม

เพื่อให้สมาชิกในทีมทุกคนเขียนหน้าจอได้สวยงาม สม่ำเสมอ และไม่มีปัญหา Class ชนกันเมื่อ Merge โค้ด:

### 1. ทำไมถึงเลือก Tailwind CSS (v3)?
- **Utility-First**: ไม่ต้องตั้งชื่อ Class เองในไฟล์ `.css` ย่อย ลดปัญหาชื่อ Class ซ้ำกัน
- **Design Consistency**: สมาชิกทุกคนใช้ Spacing, Font Size, Border Radius และ Palette สีเดียวกันตามที่ตั้งไว้ใน `tailwind.config.js`
- **Zero Dead Code**: เมื่อ Build Production ตัว Tailwind จะ Purge CSS ที่ไม่ได้ใช้ออกอัตโนมัติ ทำให้ไฟล์ Bundle มีขนาดเล็กมาก

### 2. Mythix Color Palette (เรียกใช้ผ่าน Tailwind Class ได้ทันที)

| ชื่อ Token ใน Tailwind | รหัสสี HEX | การใช้งาน | ตัวอย่าง Class |
|---|---|---|---|
| `bg-bg-base` | `#0B141F` | สีพื้นหลังหลักของเว็บไซต์ (Main Background) | `className="bg-bg-base"` |
| `bg-bg-surface` | `#131D2D` | สีพื้นหลังส่วน Section / Header | `className="bg-bg-surface"` |
| `bg-bg-card` | `#1B2336` | สีพื้นหลังการ์ดสินค้า / กล่อง Content | `className="bg-bg-card"` |
| `bg-bg-elevated` | `#212B42` | สีพื้นหลัง Modal / Dropdown / Hover Card | `className="bg-bg-elevated"` |
| `bg-bg-input` | `#18202B` | สีพื้นหลัง Input Field / Textarea | `className="bg-bg-input"` |
| `text-brand-blue` | `#72A8FF` | สีหลัก Accent Blue (ปุ่ม Primary, ลิงก์เด่น) | `className="text-brand-blue"` |
| `text-brand-gold` | `#BFA659` | สีทอง Accent Gold (ป้าย QC, เกรด Mint) | `className="text-brand-gold"` |
| `text-status-success` | `#99D9AD` | สีเขียวสถานะสำเร็จ / กำไร | `className="text-status-success"` |
| `text-status-danger` | `#FFA5A5` | สีแดงสถานะยกเลิก / ขาดทุน / ลบ | `className="text-status-danger"` |
| `text-status-warning` | `#FFEAAB` | สีเหลืองสถานะรอตรวจสอบ / Pending | `className="text-status-warning"` |

### 3. Glassmorphism Utilities
ในโปรเจกต์มี Custom Utility Class สำหรับทำเอฟเฟกต์กระจกเบลอ (Glass Effect) ตาม Figma:
- `glass-card` -> พื้นหลังการ์ดกึ่งโปร่งใส + Backdrop Blur 12px + เส้นขอบบาง
- `glass-elevated` -> พื้นหลังกล่องลอยกึ่งโปร่งใส + Backdrop Blur 16px + เส้นขอบสว่าง
- `shadow-glow-blue` -> เงาเรืองแสงสีฟ้าอ่อนรอบปุ่มหรือการ์ด
- `shadow-glow-gold` -> เงาเรืองแสงสีทอง

### 4. กฎเหล็กในการเขียน CSS สำหรับทีม
1. ❌ **ห้าม** เขียน Inline Style แบบ `style={{ color: '#72A8FF', marginTop: '20px' }}`
2. ❌ **ห้าม** สร้างไฟล์ `.css` สุ่มเพื่อเขียน Class เองโดยไม่จำเป็น
3. ✅ **ต้อง** ใช้ Utility Classes ของ Tailwind (เช่น `flex items-center gap-4 p-6 rounded-lg`)
4. ✅ **ต้อง** ใช้งาน Shared Components จาก `src/components/common/` (`Button`, `Input`, `Select`, `Badge`, `Modal`, `Toast`, `Skeleton`) เสมอ

---

## 📂 โครงสร้างโปรเจกต์ (Folder Structure)

```
tcg-store-frontend/
├── .github/
│   └── workflows/
│       ├── pr-title-check.yml   # ตรวจสอบชื่อ PR (Conventional Commits)
│       └── ci.yml               # CI Pipeline (Build, Lint, Unit Test)
├── k8s/                         # Kubernetes Manifests (Deployment, Service, ConfigMap)
├── src/
│   ├── api/                     # รวม API Calls & Data Layer
│   │   ├── client.ts            # Axios Instance + Auth Interceptor
│   │   ├── auth.ts              # Login, Register, Profile API
│   │   ├── products.ts          # Get products, Filter, Stock update
│   │   ├── orders.ts            # Checkout, Order placement, History
│   │   ├── users.ts             # Address & payment management
│   │   ├── admin.ts             # Admin CRUD, Profit calculation, Fulfillment
│   │   ├── storage.ts           # Local persistence for Mock Mode
│   │   └── mock/data.ts         # High-quality Mock Data (Cards, Users, Orders)
│   ├── components/              # React Components
│   │   ├── common/              # Reusable Base Components (Button, Input, Badge, etc.)
│   │   ├── layout/              # Navbar, Footer, AdminSidebar, AdminLayout
│   │   ├── product/             # ProductCard, ProductGrid, ProfitCalculator
│   │   ├── cart/                # CartDrawer, CartItemRow
│   │   └── auth/                # LoginModal
│   ├── hooks/                   # Custom Hooks (useDebounce, useProducts, etc.)
│   ├── pages/                   # หน้าจอตามเส้นทาง URL
│   │   ├── HomePage.tsx         # หน้าแรก
│   │   ├── BrowsePage.tsx       # หน้ารายการการ์ด + Filter Sidebar
│   │   ├── ProductDetailPage.tsx# หน้ารายละเอียดการ์ด + Stock Display
│   │   ├── CartPage.tsx         # หน้าตะกร้าสินค้า
│   │   ├── CheckoutPage.tsx     # หน้าตรวจสอบและสั่งซื้อ
│   │   ├── OrderConfirmationPage.tsx # หน้ายืนยันคำสั่งซื้อ
│   │   ├── LoginPage.tsx        # หน้าเข้าสู่ระบบ
│   │   ├── RegisterPage.tsx     # หน้าสมัครสมาชิก
│   │   ├── ProfilePage.tsx      # หน้าจัดการโปรไฟล์และที่อยู่
│   │   ├── MyOrdersPage.tsx     # หน้าประวัติการสั่งซื้อของฉัน
│   │   └── admin/               # โซนสำหรับ Admin (Dashboard, Products, Orders)
│   ├── router/                  # React Router v6 Configuration & Guards
│   ├── store/                   # Zustand Stores (authStore, cartStore, toastStore)
│   ├── styles/                  # Tailwind & Global Styles (tokens.css, index.css)
│   ├── test/                    # Test Setup & Unit Test Suites
│   ├── types/                   # TypeScript Interfaces ตรงกับ Spring Boot DTOs
│   └── utils/                   # Helper functions (cn, formatPrice, calculateProfit)
├── .env.example                 # ตัวอย่างค่า Environment Variables
├── Dockerfile                   # Multi-stage Dockerfile สำหรับ Production Nginx
├── nginx.conf                   # Nginx Configuration สำหรับ SPA Routing
├── package.json                 # Project Metadata & Dependencies
├── tailwind.config.js           # Tailwind CSS Theme & Token Configuration
└── vite.config.ts               # Vite Configuration & Path Aliases (@/*)
```

---

## 🚀 การเริ่มต้นใช้งานโปรเจกต์ (Quick Start)

### 1. Clone Repository
```bash
git clone https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend.git
cd tcg-store-frontend
```

### 2. เตรียม Environment Variables
คัดลอกไฟล์ `.env.example` ไปเป็น `.env`:
```bash
cp .env.example .env
```

เนื้อหาภายใน `.env`:
```ini
# Base URL สำหรับต่อ Spring Boot Backend หรือ Mock API
VITE_API_BASE_URL=http://localhost:8080/api

# เปิดโหมด Mock API (true = ใช้งานได้ทันทีไม่ต้องเปิด Backend, false = ยิงไป Spring Boot จริง)
VITE_ENABLE_MOCK_API=true

# ชื่อแอปพลิเคชัน
VITE_APP_TITLE="Mythix TCG Store"

# Local Dev Port
VITE_PORT=5173
```

### 3. ติดตั้ง Dependencies
```bash
npm install
```

### 4. รัน Local Development Server
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ `http://localhost:5173`

---

## 💻 คำสั่งพัฒนาและทดสอบ (Development Commands)

| คำสั่ง | รายละเอียด |
|---|---|
| `npm run dev` | รัน Vite Development Server พร้อม Hot Module Replacement |
| `npm run lint` | ตรวจสอบ TypeScript Types และ Syntax Error ทั้งหมด |
| `npm run test` | รันชุด Unit Tests ด้วย Vitest แบบ One-shot |
| `npm run test:watch` | รัน Unit Tests แบบ Watch Mode (Auto re-run เมื่อแก้โค้ด) |
| `npm run build` | ทำการ Compile TypeScript และ Bundle โค้ดลงในโฟลเดอร์ `dist/` |
| `npm run preview` | พรีวิวไฟล์ Build จาก `dist/` ในเครื่อง Local |

---

## 📝 Git Workflow & Conventional Commits

โปรเจกต์นี้ใช้ **GitHub Actions PR Linter** ตรวจสอบชื่อ Pull Request (PR) โดยอัตโนมัติ เพื่อให้เป็นไปตามมาตรฐาน Conventional Commits:

### 1. กฎการตั้งชื่อ Commit และ PR Title

| Prefix | ความหมาย | ตัวอย่าง PR Title | เวอร์ชัน SemVer ที่จะเพิ่ม |
|---|---|---|---|
| `feat:` | เพิ่มฟีเจอร์ใหม่ / หน้าจอใหม่ | `feat: add product filter sidebar by game and price` | Minor (`1.0.0` ➡️ `1.1.0`) |
| `fix:` | แก้ไขบัค UI / Logic การคำนวณ | `fix: resolve stock decrement issue on checkout` | Patch (`1.1.0` ➡️ `1.1.1`) |
| `feat!:` | การเปลี่ยนแปลงโครงสร้างใหญ่ (Breaking) | `feat!: migrate auth storage to encrypted cookie` | Major (`1.1.0` ➡️ `2.0.0`) |
| `docs:` | แก้ไขหรือเพิ่มเอกสาร | `docs: update team CSS guidelines in README` | ไม่ขยับเลขเวอร์ชัน |
| `chore:` | ปรับปรุง Dependency / Config | `chore: update tailwind config and dependencies` | ไม่ขยับเลขเวอร์ชัน |
| `test:` | เพิ่มหรือแก้ไข Unit / E2E Tests | `test: add vitest cases for cartStore and profit calc`| ไม่ขยับเลขเวอร์ชัน |
| `ci:` | แก้ไข GitHub Actions Workflow | `ci: add automated docker build step` | ไม่ขยับเลขเวอร์ชัน |

### 2. Workflow การทำงานของสมาชิกในทีม
1. **เลือก Issue จาก GitHub Issues** ที่ต้องการทำ
2. **สร้าง Git Branch ใหม่** จาก `main` (หรือ `develop`):
   ```bash
   # ตัวอย่าง: feat/s1-05-shared-components
   git checkout -b feat/s1-05-shared-components
   ```
3. **เขียนโค้ดและทดสอบ** (`npm run lint` และ `npm run test`)
4. **Commit โค้ด** ด้วย Conventional Commits:
   ```bash
   git add .
   git commit -m "feat(design-system): implement button and input components"
   git push origin feat/s1-05-shared-components
   ```
5. **เปิด Pull Request บน GitHub**:
   - ตั้งชื่อ PR ให้ตรงกับ Conventional Commits เช่น `feat: implement button and input components`
   - ใส่คำอธิบายและผูกกับ Issue เช่น `Closes #5`
6. **รอ CI Pipeline ตรวจผ่าน** และให้เพื่อนในทีมช่วย Code Review ก่อนกด **Squash and Merge**

---

## 📅 แผนงานพัฒนาตาม Sprint & Checkpoint Timeline

| Sprint | ช่วงเวลา | Milestone / สิ่งที่ต้องส่งมอบ | จำนวน Issues |
|---|---|---|---|
| **Sprint 1** | 25 ส.ค. - 29 ส.ค. | **Checkpoint 2** (Figma + Architecture + Code in Repo) | 7 Issues (`#1` - `#7`) |
| **Sprint 2** | 1 ก.ย. - 5 ก.ย. | Storefront, Browse, Filters & Shopping Cart | 5 Issues (`#8` - `#12`) |
| **Sprint 3** | 8 ก.ย. - 12 ก.ย. | **Checkpoint 3** (Checkout, Profile, Unit Tests & CI Ready) | 6 Issues (`#13` - `#18`) |
| **Sprint 4** | 15 ก.ย. - 26 ก.ย. | **Checkpoint 4** (Admin Panel, Profit Calculator & Dockerfile) | 8 Issues (`#19` - `#26`) |
| **Sprint 5** | 29 ก.ย. - 17 ต.ค. | **Checkpoint 5** (Kubernetes Deployment & Phase 1 Presentation) | 4 Issues (`#27` - `#30`) |
| **Sprint 6** | 17 ต.ค. - 14 พ.ย. | **Checkpoint 6 & 7** (Responsive Polish, E2E Tests & Final Deliverable) | 5 Issues (`#31` - `#35`) |

---

## 🔌 การเชื่อมต่อ Backend (Spring Boot Integration & Mock Mode)

โปรเจกต์ถูกออกแบบเป็น **API-Ready Architecture**:
- เมื่อ `VITE_ENABLE_MOCK_API=true`: ระบบจะใช้ Local Mock Layer พร้อมบันทึกข้อมูลใน `localStorage` ช่วยให้ทีม Frontend พัฒนาและทดสอบได้ทันทีโดยไม่ต้องรอเปิด Backend
- เมื่อ `VITE_ENABLE_MOCK_API=false`: Axios Client ใน `src/api/client.ts` จะยิง Request ตรงไปยัง Spring Boot Backend ตาม URL ที่ระบุใน `VITE_API_BASE_URL`

### บัญชีทดสอบใน Mock Mode:
- **ลูกค้าทั่วไป (Customer):** `user@mythix.com` / รหัสผ่าน: `password123`
- **ผู้ดูแลระบบ (Admin):** `admin@mythix.com` / รหัสผ่าน: `admin123`

---

## 🐳 Docker & Kubernetes Deployment

### 1. Build & Run ด้วย Docker (สำหรับ Checkpoint 4)
```bash
# 1. Build Docker Image
docker build -t tcg-store-frontend:latest .

# 2. Run Container บนพอร์ต 3000
docker run -d -p 3000:80 --name mythix-frontend tcg-store-frontend:latest
```
เปิดใช้งานผ่าน `http://localhost:3000`

### 2. Deploy บน Kubernetes (สำหรับ Checkpoint 5)
```bash
# นำเข้า Manifests ทั้งหมด
kubectl apply -f k8s/

# ตรวจสอบสถานะการทำงานของ Pods และ Services
kubectl get pods -l app=tcg-frontend
kubectl get svc tcg-frontend-service
```

---

## 👥 รายชื่อทีมพัฒนา (Team Members)
- **ChampZa** — Authentication, User Management & Routing
- **yoyaho** — Product Browsing, Filter System & Storefront
- **ssun** — Shopping Cart & Real-time Stock Verification
- **ไกด์** — Checkout Flow, Order Placement & Fulfillment
