# Mythix TCG Store — Frontend

Frontend ของแพลตฟอร์มซื้อขายการ์ด TCG สำหรับ Buyer, Seller และ Platform Admin
พัฒนาด้วย React, TypeScript และ Vite

[![CI](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/actions/workflows/ci.yml)

## Source of truth

- งานและ acceptance criteria: [Jira board](https://nunkantinan.atlassian.net/jira/software/projects/SCRUM/boards/1)
- UI และ interaction: [Figma](https://www.figma.com/design/X2UPaqQCjGuMtijIgtZ3Aq/TCG-DevOp-Project?node-id=0-1)
- Backend และ API contract: [tcg-store-backend](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-backend)

Repository นี้ไม่เก็บ backlog หรือ issue guide ซ้ำกับ Jira หาก ticket, Figma และ API contract
ไม่ตรงกัน ให้แก้แหล่งข้อมูลต้นทางก่อนเริ่ม implementation

## สถานะปัจจุบัน

| Area | สถานะบน `main` |
| --- | --- |
| Authentication | Login/register/current-user เชื่อม backend แล้ว; password recovery ยังรอ backend contract |
| Marketplace | Home, browse, product detail และ cart มี UI/mock flow; real product/cart APIs ยังอยู่ใน Jira |
| Profile | Profile และ edit forms มี UI/mock flow; real profile/address/payment APIs ยังไม่ครบ |
| Seller | Inventory UI และ API adapter มีแล้ว; verification, dashboard, orders, collection, payouts และ storefront รอ ticket |
| Buyer orders/checkout | Route boundary เตรียมไว้ แต่ implementation ยังไม่เสร็จ |
| Platform Admin | Route/layout boundary เตรียมสำหรับ monitoring, QC Hub และ escrow |
| Quality | Oxlint, TypeScript build และ Vitest พร้อมใช้; E2E/security gates ติดตามใน Jira |

คำว่า “มี UI” หรือ “มี mock” ไม่เท่ากับเชื่อม backend สำเร็จ

## Tech stack

- React 19 และ React Router 7
- TypeScript 6 และ Vite 8
- Tailwind CSS 3
- Zustand สำหรับ client state
- Axios สำหรับ HTTP client
- Vitest และ Testing Library
- Nginx, Docker และ Kubernetes

## เริ่มใช้งาน

ต้องใช้ Node.js 20 ขึ้นไปและ npm

```bash
git clone https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend.git
cd tcg-store-frontend
npm ci --legacy-peer-deps
```

สร้าง `.env` จาก `.env.example` แล้วเริ่ม development server:

```powershell
Copy-Item .env.example .env
npm run dev
```

เปิด `http://localhost:5173`

## Environment variables

| Variable | Default | รายละเอียด |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Backend base URL |
| `VITE_ENABLE_MOCK_API` | `false` | เปิดเฉพาะเมื่อต้องพัฒนา UI โดยยังไม่มี backend |
| `VITE_APP_TITLE` | `Mythix TCG Store` | ชื่อแอป |
| `VITE_PORT` | `5173` | Development port |

ตัวแปร `VITE_*` ถูกฝังตอน build การเปลี่ยน production config ต้อง build image ใหม่

## โครงสร้างโปรเจกต์

```text
src/
├── app/                     # Bootstrap, application layouts และ router composition
│   ├── layouts/
│   ├── router/
│   └── styles/
├── features/                # Business capability แยกตาม Jira/Figma domain
│   ├── admin/
│   ├── auth/
│   ├── cart/
│   ├── catalog/
│   ├── checkout/
│   ├── orders/
│   ├── profile/
│   └── seller/
├── shared/                  # โค้ดที่ไม่มี business ownership
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── lib/
│   ├── mocks/
│   └── types/
├── test/
└── main.tsx
```

อ่านกติกา dependency และตำแหน่งไฟล์ใหม่ใน [Architecture](docs/architecture.md)

## Routes

Route definitions อยู่กับ feature ใน `src/features/*/routes.tsx` และถูกประกอบที่
`src/app/router/index.tsx`

| Area | Routes |
| --- | --- |
| Public catalog | `/`, `/browse`, `/products/:id`, `/stores/:sellerId` |
| Authentication | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| Buyer account | `/profile`, `/orders`, `/orders/:id`, `/become-a-seller` |
| Cart/checkout | `/cart`, `/checkout` |
| Seller | `/seller/inventory`, `/seller/dashboard`, `/seller/orders`, `/seller/collection`, `/seller/payouts`, `/seller/store-profile` |
| Platform Admin | `/platform-admin/monitoring`, `/platform-admin/qc-hub`, `/platform-admin/escrow` |

หน้าที่ยังไม่ implement จะแสดง placeholder ชัดเจนและต้องมี Jira ticket ก่อนลงมือ

## คำสั่งหลัก

| Command | ใช้ทำอะไร |
| --- | --- |
| `npm run dev` | เปิด Vite development server |
| `npm run lint` | ตรวจ static analysis |
| `npm run test` | รัน unit/component tests |
| `npm run build` | ตรวจ TypeScript และสร้าง production bundle |
| `npm run preview` | เปิด bundle ที่ build แล้ว |

ก่อนเปิด PR ต้องรัน:

```bash
npm run lint
npm run test
npm run build
```

## Workflow

1. เลือก Jira ticket และอ่าน linked backend ticket
2. เปิด Figma node/frame ที่ ticket อ้างอิง
3. สร้าง branch เช่น `feat/scrum-25-buyer-order-history`
4. เพิ่มหรือแก้เฉพาะ feature owner ของงานนั้น
5. ถ้า API เปลี่ยน ให้ตกลง backend contract ก่อนแก้ mock/type
6. ใส่ Jira key, Figma node และผลตรวจใน PR

อ่านรายละเอียดใน [CONTRIBUTING.md](CONTRIBUTING.md)

## Deployment

```bash
docker build -t tcg-store-frontend:latest .
docker run --rm -p 3000:80 tcg-store-frontend:latest
```

Nginx ทำ SPA fallback และ proxy `/api/` ไปยัง backend service การตั้งค่า Kubernetes อยู่ใน `k8s/`
