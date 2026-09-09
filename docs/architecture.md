# Frontend Architecture

สถาปัตยกรรมนี้ออกแบบตาม capability ของ trading/reservation platform ไม่ใช่หน้าจอของ marketplace เดิม

## Layers

### `src/entities`

นิยามภาษากลางของระบบที่ไม่ผูกกับ React หรือ HTTP:

- `account`: `User`, `Role`
- `card`: `CardListing`, `CollectionEntry`, visibility
- `reservation`: cart item, order, status และ state transition
- `notification`: เหตุการณ์ที่ส่งให้ buyer/seller

State vocabulary เช่น `RESERVED → FULFILLED → SENT` ถูกประกาศเป็น entity contract ส่วน transition implementation ต้องมากับ feature ticket และ backend contract

### `src/features`

แต่ละ folder คือ business capability:

| Feature | Responsibility |
| --- | --- |
| `auth` | session และ role navigation |
| `discovery` | browse/filter/detail ของ listing ที่มองเห็นได้ |
| `reservation-cart` | เลือกจำนวนและเตรียมคำขอจอง |
| `reservations` | create order, seller status actions, buyer order history |
| `listings` | seller CRUD/filter/visibility |
| `collection` | ownership view ของผู้ซื้อ |
| `notifications` | order activity ของผู้ใช้ |
| `profile` | display name และ phone |

Feature ติดต่อ backend ผ่าน adapter ใน `api/` และประกาศ route ใน `routes.tsx`

### `src/infrastructure`

`mock-db` จำลอง persistence ผ่าน `localStorage` ใช้เฉพาะเมื่อ `VITE_ENABLE_MOCK_API=true` รูปแบบข้อมูลต้องตรงกับ entity และ production API contract

### `src/app`

ประกอบ application shell, global layout, protected route และ feature routes ไม่มี business transition อยู่ที่นี่

### `src/shared`

มีเฉพาะ generic API client, environment config, reusable UI primitives, toast และ utility ที่ไม่มี business owner

## Dependency direction

```text
app ───────────────→ features
                         │
                         ├────────→ entities
                         ├────────→ shared
                         └────────→ infrastructure/mock-db (mock adapter only)

infrastructure/mock-db ─→ entities
entities ────────────────→ shared (เฉพาะ generic utility ถ้าจำเป็น)
```

ห้าม `entities` import `features`/`app`, ห้าม `shared` import business layer และห้ามให้ feature หนึ่งเข้าถึง implementation ภายในของอีก featureโดยไม่ผ่าน public API

## Reservation aggregate

Order เป็น aggregate root และต้องมี seller เดียว:

```text
RESERVED
  └─ seller confirms off-platform payment → FULFILLED
       └─ seller marks shipment sent → SENT
            └─ transfer every order item to buyer collection
```

Production backend ต้องทำ operation ต่อไปนี้ใน transaction เดียว:

- create order + validate listing + reserve stock + create seller notification
- `FULFILLED → SENT` + write `sentAt` + transfer ownership + create buyer notification

แผนภาพนี้เป็น target contract ไม่ใช่ implementation ใน restructure PR นี้ Frontend ทำ optimistic UX ได้เฉพาะ action ที่ rollback ชัดเจน และห้ามจำลอง ownership transfer แยกจาก status request ใน production

## Route composition

- Public shell: home, discovery, card detail, auth และ route skeleton ของ signed-in buyer views
- Seller workspace: `/workspace/listings` และ route skeleton `/workspace/orders` หลัง `SELLER` guard
- Admin UI, checkout และ shipping UI ถูกถอดจนกว่าจะมี requirement ใหม่

## API boundary

API response ต้อง normalize ที่ feature adapter ก่อนเข้า store/page ห้ามให้ component รู้จัก backend wrapper เช่น `data.content` หรือ legacy enum

Target endpoints:

| Method | Endpoint | Result |
| --- | --- | --- |
| `GET` | `/listings` | visible listings |
| `POST` | `/orders` | one or more seller-scoped reservation orders |
| `GET` | `/orders/me` | buyer orders |
| `GET` | `/seller/orders` | seller orders |
| `PATCH` | `/seller/orders/:id/payment-received` | `RESERVED → FULFILLED` |
| `PATCH` | `/seller/orders/:id/sent` | `FULFILLED → SENT` + ownership transfer |
| `GET` | `/collection` | current user collection |
| `GET` | `/notifications` | current user notifications |

Endpoint names เป็น proposed contract เท่านั้น ยังไม่ได้ implement ใน restructure นี้ และต้อง review กับ backend ก่อน production integration
