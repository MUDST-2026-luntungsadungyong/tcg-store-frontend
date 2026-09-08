# Mythix TCG Store — Frontend

Frontend สำหรับแพลตฟอร์มซื้อขายการ์ด TCG ของ Mythix ครอบคลุมประสบการณ์ Buyer, Seller และ Platform Admin พัฒนาด้วย React, TypeScript และ Vite

[![CI](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/actions/workflows/ci.yml)

## สถานะของโปรเจกต์

| พื้นที่ | สถานะปัจจุบัน |
| --- | --- |
| Authentication | Login/register เชื่อม Spring API, เก็บ session แบบ bearer token และ protected routes พร้อมใช้งาน |
| Buyer storefront | Home, browse/filter, product detail, cart และ profile editors พร้อมใช้งาน |
| Seller portal | Inventory และ listing CRUD พร้อมใช้งาน; onboarding/KYC, orders, dashboard และ payouts อยู่ใน Sprint 2–3 |
| Platform Admin | Route และ layout placeholder มีแล้ว; dashboard, user management, QC และ escrow ยังอยู่ใน roadmap |
| Quality gates | CI รัน Oxlint และ production build; unit tests ครอบคลุม auth contract, state, navigation และ form validation |

รายละเอียด scope, dependencies และ acceptance criteria ล่าสุดอยู่ใน [ISSUE_GUIDE.md](ISSUE_GUIDE.md)

## Tech stack

- React 19 และ React Router 7
- TypeScript 5 และ Vite 8
- Tailwind CSS 3
- Zustand สำหรับ client state
- Axios สำหรับ HTTP client และ auth interceptor
- Oxlint, TypeScript และ Vite build สำหรับ automated checks
- Nginx, Docker และ Kubernetes สำหรับ production deployment

## เริ่มใช้งาน

### Requirements

- Node.js 20 ขึ้นไป
- npm

### Setup

```bash
git clone https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend.git
cd tcg-store-frontend
npm ci --legacy-peer-deps
```

สร้าง `.env` จากไฟล์ตัวอย่าง:

```powershell
Copy-Item .env.example .env
```

หรือบน macOS/Linux:

```bash
cp .env.example .env
```

จากนั้นรัน development server:

```bash
npm run dev
```

เปิด `http://localhost:5173`

## Environment variables

| Variable | Default ใน `.env.example` | รายละเอียด |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Base URL ของ backend API |
| `VITE_ENABLE_MOCK_API` | `false` | `false` เพื่อเชื่อม backend จริง; ตั้งเป็น `true` เฉพาะตอนพัฒนา UI ด้วย mock API |
| `VITE_APP_TITLE` | `Mythix TCG Store` | ชื่อแอปที่แสดงใน UI |
| `VITE_PORT` | `5173` | Port ของ Vite development server |

> ตัวแปร `VITE_*` ถูกฝังตอน build หากเปลี่ยนค่าสำหรับ production ต้อง build image ใหม่ด้วยค่าที่ต้องการ

## บัญชีสำหรับ Mock Mode

ใช้เฉพาะ local development เมื่อ `VITE_ENABLE_MOCK_API=true`

| Role | Email | Password |
| --- | --- | --- |
| Buyer | `user@mythix.com` | `password123` |
| Seller | `seller@mythix.com` | `seller123` |
| Platform Admin | `admin@mythix.com` | `admin123` |

ข้อมูล mock จะถูก persist ใน browser localStorage หากต้องการเริ่มใหม่ให้ล้าง site data ของ `localhost`

## Routes

### หน้าที่พร้อมใช้งาน

| Route | หน้าที่ |
| --- | --- |
| `/` | Landing page และ featured collections |
| `/browse` | ค้นหาและกรองสินค้า |
| `/products/:id` | รายละเอียดสินค้าและเพิ่มลงตะกร้า |
| `/cart` | จัดการสินค้าในตะกร้า |
| `/login`, `/register` | Authentication |
| `/forgot-password`, `/check-email`, `/reset-password`, `/reset-success` | Password recovery flow |
| `/profile` | Profile overview |
| `/profile/edit/personal` | แก้ไขข้อมูลส่วนตัว |
| `/profile/edit/address` | จัดการที่อยู่ |
| `/profile/edit/payment` | จัดการ payment methods |
| `/seller/inventory` | Seller inventory และ listing CRUD |

`/seller`, `/seller/products` และ `/seller/listings` redirect ไป `/seller/inventory`

### Routes ที่เป็น placeholder

- Buyer: `/checkout`, `/orders`
- Seller: `/seller/dashboard`, `/seller/orders`, `/seller/payouts`, `/seller/store-profile`
- Platform Admin: `/platform-admin`, `/platform-admin/dashboard`, `/platform-admin/users`, `/platform-admin/qc-hub`, `/platform-admin/escrow`

Placeholder เหล่านี้ตั้งไว้เพื่อรักษา navigation contract ระหว่างพัฒนา ไม่ได้หมายความว่า feature เสร็จแล้ว

## โครงสร้างโปรเจกต์

```text
tcg-store-frontend/
├── .github/workflows/    # CI และ PR title validation
├── k8s/                  # Kubernetes manifests
├── src/
│   ├── api/              # Axios client, API modules และ mock data
│   ├── components/       # Common, layout และ product components
│   ├── config/           # Environment configuration
│   ├── pages/
│   │   ├── customer/     # Buyer และ authentication pages
│   │   └── seller/       # Seller inventory management
│   ├── router/           # Routes, guards และ placeholders
│   ├── store/            # Zustand stores
│   ├── styles/           # Tailwind entry และ global styles
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Formatting และ shared helpers
├── .env.example
├── Dockerfile
├── nginx.conf
├── tailwind.config.js
└── vite.config.ts
```

Import ภายใน `src` สามารถใช้ alias `@/` ได้ เช่น `@/components/common/Button`

## คำสั่งหลัก

| Command | ใช้ทำอะไร |
| --- | --- |
| `npm run dev` | เปิด Vite development server พร้อม HMR |
| `npm run lint` | ตรวจ static analysis ด้วย Oxlint |
| `npm run build` | ตรวจ TypeScript และสร้าง production bundle ใน `dist/` |
| `npm run preview` | เปิด production bundle บนเครื่อง local |

รัน unit tests ได้ด้วย `npm run test` (Vitest + Testing Library) สำหรับ E2E browser tests ยังติดตามใน [#63](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/63)

## Backend และ Mock API

- `VITE_ENABLE_MOCK_API=true`: API modules ใช้ mock data/localStorage ทำให้พัฒนา UI ได้โดยไม่ต้องรัน backend
- `VITE_ENABLE_MOCK_API=false`: Axios ส่ง request ไปยัง `VITE_API_BASE_URL`
- Development proxy ส่ง request ที่ `/api` ไปยัง backend ที่กำหนดใน Vite config
- Nginx production config ทำ SPA fallback และ proxy `/api/` ไปยัง `tcg-backend-service:8080/api/`

เมื่อต่อ backend จริง ให้ตรวจ API contract, authentication token และ CORS/proxy configuration ให้ตรงกับ environment เป้าหมาย

## Docker และ Kubernetes

Build และรัน Docker image:

```bash
docker build -t tcg-store-frontend:latest .
docker run --rm -p 3000:80 tcg-store-frontend:latest
```

เปิด `http://localhost:3000`

Deploy manifests:

```bash
kubectl apply -f k8s/
kubectl get pods -l app=tcg-frontend
kubectl get svc tcg-frontend-service
```

Service ถูกกำหนดเป็น NodePort `30080` และ Deployment ใช้ 2 replicas พร้อม readiness/liveness probes

> `k8s/configmap.yaml` ไม่สามารถเปลี่ยนค่า `VITE_*` ใน JavaScript bundle ที่ build เสร็จแล้วได้เอง หากต้องการ runtime configuration ต้องเพิ่มกลไก inject config แยกต่างหาก

## Roadmap และเอกสารอ้างอิง

- [Frontend Issue Guide](ISSUE_GUIDE.md) — scope, dependency map, coverage และ Definition of Done
- [Sprint 2 milestone](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/milestone/1) — checkout, order history, Seller lifecycle/orders และ QC/Admin integration
- [Sprint 3 milestone](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/milestone/2) — admin operations, seller dashboard/payouts, testing และ frontend hardening
- [Figma design](https://www.figma.com/design/X2UPaqQCjGuMtijIgtZ3Aq/TCG-DevOp-Project?node-id=0-1&p=f&t=SUyh6jEOjI70TqQO-0)
- [Miro user flows](https://miro.com/app/board/uXjVHyqYJNg=/?share_link_id=544445592582)
- [Contribution guide](CONTRIBUTING.md)

## การร่วมพัฒนา

อ่าน [CONTRIBUTING.md](CONTRIBUTING.md) ก่อนเริ่มงาน โดยสรุป:

1. เลือก GitHub Issue และตรวจ milestone/dependencies
2. สร้าง feature branch ตามประเภทงาน
3. ใช้ Conventional Commits และตั้งชื่อ PR ให้ผ่าน PR title check
4. รัน `npm run lint` และ `npm run build`
5. อ้างอิง issue ใน PR และใช้ `Closes #...` เมื่อ acceptance criteria ครบจริง

`main` เป็น protected branch การเปลี่ยนแปลงต้องผ่าน Pull Request และ CI review

## Known gaps

- Checkout, Buyer order history และ seller portal ส่วนที่เหลือยังไม่เสร็จ
- Platform Admin/QC/Escrow ยังเป็น placeholder
- มี Vitest สำหรับ auth flows; ยังไม่มี coverage gate และ E2E browser suite
- Responsive/accessibility hardening ติดตามใน [#31](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/31)
- Loading/error/empty/offline resilience ติดตามใน [#33](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/33)
