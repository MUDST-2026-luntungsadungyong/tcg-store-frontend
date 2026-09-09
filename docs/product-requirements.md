# Product Requirements: Reservation-based TCG Trading

สถานะ: approved direction สำหรับ frontend restructure วันที่ 2026-09-09

Implementation status: เอกสารนี้กำหนด target behavior เท่านั้น งาน restructure ไม่ได้ implement flow นี้

## Product intent

Mythix เปลี่ยนจาก marketplace checkout เป็น trading web ที่ช่วยค้นหาการ์ด จองสินค้า แจ้งเตือนคู่ค้า ติดตามสถานะ และบันทึกเจ้าของการ์ด การสื่อสาร เงิน และ logistics เป็นความรับผิดชอบของ buyer/seller นอกระบบ

## Approved user flow

1. ผู้ซื้อเพิ่ม card ลงตะกร้า แล้วกด **ดำเนินการจอง**; ระบบตรวจ availability และสร้าง Order
2. ระบบแจ้งเตือนผู้ขายว่ามีคนจอง
3. ผู้ขายกับผู้ซื้อสื่อสารกัน **นอกระบบ**
4. ผู้ซื้อจ่ายเงินให้ผู้ขาย **นอกระบบ**
5. ผู้ขายรับทราบแล้วกลับมาหน้าจัดการ Order
6. ผู้ขายกด **ได้รับเงินแล้ว** ในระบบ
7. ระบบเปลี่ยนสถานะเป็น `FULFILLED`
8. ~~ผู้ขายมีเวลาจัดส่ง 2 วันทำการ~~ — removed
9. ผู้ขายจัดเตรียมสินค้า **นอกระบบ**
10. ~~ผู้ขายพิมพ์ใบจ่าหน้า~~ — removed
11. ~~ระบบเปลี่ยนสถานะเป็น `PREPARED`~~ — removed
12. ผู้ขายนำสินค้าไปส่ง **นอกระบบ**
13. ผู้ขายเปลี่ยนสถานะในระบบเป็น `SENT`
14. ~~ผู้ซื้อได้รับสินค้า~~ — ไม่ track ในระบบ
15. ~~ผู้ซื้อกดได้รับสินค้าแล้ว~~ — removed
16. พร้อมกับการเปลี่ยนเป็น `SENT` ระบบเปลี่ยนเจ้าของการ์ดในฐานข้อมูลเป็นผู้ซื้อ และแสดงใน collection ของผู้ซื้อ

## State semantics

| Status | ผู้ทำ action | ความหมาย |
| --- | --- | --- |
| `RESERVED` | System | card ถูกจอง, stock ถูกกัน, seller ถูกแจ้งเตือน |
| `FULFILLED` | Seller | seller ยืนยันว่าได้รับเงินนอกระบบแล้ว; ยังไม่โอน ownership |
| `SENT` | Seller | seller ยืนยันการส่งนอกระบบ; ownership ถูกโอนไป buyer collection |
| `CANCELLED` | Operational/future | terminal escape hatch; ไม่ใช่ approved happy-path UI ในรอบนี้ |

ชื่อ `FULFILLED` คงไว้ตาม requirement แม้ความหมายทางธุรกิจคือ payment acknowledged

## Business invariants

- ผู้ใช้ต้อง sign in ก่อนเพิ่ม card ลง reservation cart หรือสร้าง order
- listing ต้องเป็น `SHOW` และ stock ต้องเพียงพอขณะสร้าง order
- หนึ่ง order มี buyer หนึ่งคนและ seller หนึ่งคน; cart ข้าม seller ถูก split เป็นหลาย orders
- seller เฉพาะเจ้าของ order เท่านั้นที่เปลี่ยน status ได้
- อนุญาต transition `RESERVED → FULFILLED → SENT` เท่านั้นใน happy path
- ห้ามข้าม status หรือย้อน status
- ownership transfer เกิดครั้งเดียวเมื่อ `FULFILLED → SENT`
- การ create order/reserve stock/notify seller ต้อง atomic ใน production
- การ mark sent/transfer ownership/notify buyer ต้อง atomic ใน production

## In scope

- card discovery/detail
- reservation cart
- create and view orders
- seller listing CRUD/filter/visibility ตาม Miro
- seller payment acknowledgement และ mark sent
- seller/buyer order notifications
- buyer collection หลัง ownership transfer
- profile display name และ phone

## Explicitly out of scope

- payment gateway, stored card, payment verification by Mythix
- shipping address, shipping rate, carrier integration, label printing, tracking number
- delivery SLA, `PREPARED`, buyer received confirmation
- in-app chat, dispute/refund flow
- marketplace storefront, commission/tax calculation และ platform admin UI เดิม

## Source reconciliation

- Product flow ในเอกสารนี้เป็น source of truth สูงสุด
- Miro ยืนยัน seller listing management: list, add, edit, validation, delete, filter และ visibility รวมถึง profile name/phone และ collection
- Figma ยังคงใช้สี typography spacing component และ interaction reference ได้
- Figma frames ชื่อ Checkout Flow, Buyer Account & Storefront, shipping/payment และ platform-admin เป็น legacy scope จนกว่าจะ revalidate

## Open backend decisions

- cancellation policy และคืน reserved stock
- idempotency key สำหรับ create order และ mark sent
- concurrency strategy ขณะ reserve stock
- notification delivery channel นอกเหนือจาก in-app inbox
- audit event และ authorization policy สำหรับ ownership transfer
