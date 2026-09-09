# Mythix TCG Trading Frontend

Frontend สำหรับค้นหา จอง แลกเปลี่ยน และบันทึกความเป็นเจ้าของการ์ด TCG ระหว่างผู้ซื้อกับผู้ขาย โดย Mythix ทำหน้าที่เป็น **reservation and ownership system** ไม่ใช่ marketplace ที่รับชำระเงินหรือจัดส่งสินค้า

> งาน restructure รอบนี้กำหนด folder/module boundaries, domain contracts, route skeletons และเอกสารเท่านั้น ยังไม่ได้ implement order workflow, notification delivery หรือ ownership transfer

## Product model

เส้นทางหลักของระบบคือ:

```text
Buyer adds cards
      ↓
RESERVED — seller is notified
      ↓  seller confirms off-platform payment
FULFILLED
      ↓  seller ships outside the platform and marks Sent
SENT — ownership moves to buyer collection
```

- การติดต่อ การชำระเงิน การเตรียมสินค้า และการจัดส่งเกิด **นอก Mythix**
- ระบบไม่มี checkout, payment method, shipping address, shipping label, `PREPARED` หรือ buyer receipt confirmation
- หนึ่ง order เป็นของผู้ขายหนึ่งราย หากตะกร้ามีหลายผู้ขาย ระบบจะแยกเป็นหลาย orders
- การเปลี่ยน `FULFILLED → SENT` ต้องทำ atomically กับการย้ายเจ้าของการ์ดใน backend

รายละเอียดฉบับเต็มอยู่ที่ [Product requirements](docs/product-requirements.md) และประวัติการเปลี่ยนจาก marketplace อยู่ที่ [Migration log](docs/migration-log.md)

## Requirement sources

เมื่อข้อมูลขัดกัน ให้ใช้ลำดับนี้:

1. Product flow ที่ทีมยืนยันล่าสุด
2. [Miro user flow](https://miro.com/app/board/uXjVHyqYJNg=/?share_link_id=157477950006)
3. [Figma](https://www.figma.com/design/X2UPaqQCjGuMtijIgtZ3Aq/TCG-DevOp-Project?node-id=0-1) สำหรับ visual language และ interaction ที่ยังไม่ขัดกับ flow ใหม่
4. Jira ticket และ API contract ที่ผูกกับงาน

Figma เดิมมี Checkout Flow, Storefront, Shipping และ Payment ซึ่งถือเป็น legacy reference จนกว่าจะได้รับการยืนยันใหม่

## Structure

```text
src/
├── app/                    # app shell, layouts, router, global styles
├── entities/               # account, card, notification, reservation
├── features/
│   ├── auth/
│   ├── collection/
│   ├── discovery/
│   ├── listings/
│   ├── notifications/
│   ├── profile/
│   ├── reservation-cart/
│   └── reservations/
├── infrastructure/
│   └── mock-db/            # localStorage adapter สำหรับ mock mode
└── shared/                 # generic API client, UI primitives, config, utilities
```

Dependency direction:

```text
app → features → entities → shared
       ↓
infrastructure/mock-db → entities
```

อ่านกติกาเชิงสถาปัตยกรรมที่ [Architecture](docs/architecture.md)

## Target routes

| Route | ผู้ใช้ | หน้าที่ |
| --- | --- | --- |
| `/` | Public | หน้าเริ่มต้นและการ์ดแนะนำ |
| `/cards` | Public | ค้นหาและกรอง card listings |
| `/cards/:id` | Public | ดูรายละเอียดและเพิ่มลงตะกร้าจอง |
| `/cart` | Signed in | ตรวจรายการและสร้าง reservation orders |
| `/orders` | Signed in | ติดตาม orders ของผู้ซื้อ |
| `/collection` | Signed in | ดูการ์ดที่โอนกรรมสิทธิ์แล้ว |
| `/notifications` | Signed in | ดูเหตุการณ์ order |
| `/profile` | Signed in | ดูชื่อ อีเมล และเบอร์โทร |
| `/profile/edit` | Signed in | แก้ display name และ phone |
| `/workspace/listings` | Seller | เพิ่ม แก้ ลบ กรอง และซ่อน listing |
| `/workspace/orders` | Seller | กดยืนยันรับเงินและเปลี่ยนเป็น Sent |

Route ที่เป็น capability ใหม่ใช้ placeholder เพื่อกำหนด ownership ของ module โดยไม่เริ่ม feature implementation ก่อนมี ticket/API contract

## Local development

ต้องใช้ Node.js 20+ และ npm

```bash
npm install
cp .env.example .env
npm run dev
```

เปิด mock mode เพื่อทดลอง flow โดยไม่ต้องมี backend:

```env
VITE_ENABLE_MOCK_API=true
```

บัญชี mock:

| Role | Email | Password |
| --- | --- | --- |
| Buyer | `user@mythix.com` | ค่าใดก็ได้ที่ผ่าน validation |
| Seller | `seller@mythix.com` | ค่าใดก็ได้ที่ผ่าน validation |
| Admin | `admin@mythix.com` | ค่าใดก็ได้ที่ผ่าน validation; ยังไม่มี admin workspace ใน scope ใหม่ |

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

## Related documentation

- [Product requirements](docs/product-requirements.md)
- [Architecture](docs/architecture.md)
- [Migration log](docs/migration-log.md)
- [Contributing](CONTRIBUTING.md)
