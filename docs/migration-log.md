# Migration Log: Marketplace to Trading Platform

วันที่: 2026-09-09  
Branch: `refactor/scrum-37-feature-first-architecture`  
Baseline before this migration: `a4cb492`

เอกสารนี้เก็บเหตุผลและรายการโครงสร้างเดิมที่เปลี่ยน/ลบตามคำขอ เพื่อให้ย้อนดูได้แม้ implementation ไม่อยู่ใน working tree แล้ว

## Inputs reviewed

- Product flow ที่ผู้ใช้ยืนยันในงานนี้
- [Miro user flow](https://miro.com/app/board/uXjVHyqYJNg=/?share_link_id=157477950006): product/listing list, edit-save-validation, delete, filter, visibility, profile name/phone และ collection
- [Figma](https://www.figma.com/design/X2UPaqQCjGuMtijIgtZ3Aq/TCG-DevOp-Project?node-id=0-1): visual language และ legacy frames เช่น Checkout Flow, Storefront, Admin
- repository, tests และ PR #70 ณ baseline

## Structural changes

| Before | After | Reason |
| --- | --- | --- |
| `features/catalog` | `features/discovery` | capability คือค้นหา card listings |
| `features/cart` | `features/reservation-cart` | cart เตรียม reservation ไม่ใช่ checkout |
| `features/orders` | `features/reservations` | model lifecycle ใหม่ |
| `features/seller` | `features/listings` | seller capability ที่ชัดเจน |
| `shared/mocks` | `infrastructure/mock-db` | mock persistence เป็น infrastructure adapter |
| `StoreLayout` | `PublicLayout` | ไม่ผูก app shell กับ store/marketplace |
| `SellerLayout` | `WorkspaceLayout` | รองรับ trading workspace |
| `shared/types` | `entities/account`, `card`, `notification`, `reservation` | แยก domain vocabulary และ pure rules |

เพิ่ม route skeleton ของ `features/collection` และ `features/notifications` เพื่อกำหนด module ownership โดยยังไม่มี feature implementation

## Removed scope and files

| Removed | Why |
| --- | --- |
| `src/features/checkout/` | ไม่มี platform checkout/payment |
| `src/features/profile/pages/EditPaymentMethodPage.tsx` | payment เกิดนอกระบบ |
| `src/features/profile/pages/EditShippingAddressPage.tsx` | delivery arrangement เกิดนอกระบบ |
| `src/shared/assets/cards/` | assets ใช้กับ stored payment method ที่ถูกถอด |
| `src/features/admin/` และ `PlatformAdminLayout.tsx` | legacy marketplace admin ยังไม่อยู่ใน requirement ใหม่ |
| legacy `catalog`, `cart`, `orders`, `seller` paths | ถูกแทนด้วย feature names ใหม่ด้านบน |
| `PREPARED`, shipping label, 2-day SLA, buyer received confirmation | product flow ระบุให้ลบ |

## Planned behavior mapping (historical; superseded by the canonical order lifecycle in `architecture.md`)

- `/cart` จะสร้าง order และแจ้ง seller โดยไม่มี tax/shipping/payment step
- cart ที่มีหลาย seller จะถูกแยกเป็นหลาย seller-scoped orders
- seller จะกด **I have received the money** เพื่อเปลี่ยน `PENDING → CONFIRMED`
- seller จะกด **Mark as sent** เพื่อเปลี่ยน `CONFIRMED → SENT`; backend persists `SENT` and notifies buyer on this transition
- buyer ยืนยันการได้รับสินค้าในภายหลังเพื่อเปลี่ยน `SENT → FULFILLED`
- transition เป็น `SENT` จะสร้าง collection entries ของ buyer แบบ atomic
- profile target แก้ได้เฉพาะ display name และ phone ตาม Miro
- seller listing module ยังคงเป็น owner ของ add/edit/validation/delete/filter/visibility behavior

รายการนี้ใช้สำหรับแตก feature tickets ต่อไป รอบนี้ไม่เพิ่ม API calls, order actions, notification page logic หรือ ownership mutation

## Compatibility notes

- Mock storage ใช้ keys รุ่นใหม่ (`mythix_mock_*_v1`) เพื่อไม่อ่าน marketplace schema เก่าโดยบังเอิญ
- API paths ใน architecture เป็น proposed contract ต้อง review กับ backend
- `FULFILLED` เป็นการยืนยันรับสินค้าของ buyer; payment acknowledgement คือ `CONFIRMED`
- `CANCELLED` คงไว้เป็น operational terminal state แต่ยังไม่มี user-facing action

## Recovery

ไฟล์ที่ลบยังอยู่ใน Git history ตัวอย่างการดูไฟล์เดิม:

```bash
git show a4cb492:src/features/checkout/routes.tsx
```

ถ้าต้องนำบางส่วนกลับมา ให้ restore เฉพาะไฟล์ที่ได้รับ requirement ใหม่ ห้าม restore ทั้ง marketplace flow โดยไม่ review product boundaries
