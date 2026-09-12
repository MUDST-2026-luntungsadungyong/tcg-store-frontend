# Contributing to Mythix

## เริ่มงานจาก requirement ที่ถูกต้อง

ก่อนแก้โค้ด ให้อ่านแหล่งข้อมูลตามลำดับความสำคัญ:

1. Product flow ที่ทีมยืนยันล่าสุดใน [docs/product-requirements.md](docs/product-requirements.md)
2. Miro user flow ที่เกี่ยวข้อง
3. Figma node/frame สำหรับหน้าตาและ interaction ที่ยังอยู่ใน scope
4. Jira ticket, linked backend ticket และ API contract

ถ้าแหล่งข้อมูลขัดกัน ห้ามเดาจากหน้าจอเก่า ให้บันทึกข้อขัดแย้งใน PR และยืนยัน product behavior ก่อน implementation โดยเฉพาะ Figma เดิมที่ยังมี marketplace checkout, payment และ shipping flow

## Branch และ commit

`main` และ `develop` เป็น protected branches โดย branch naming ใช้กติกาแยกตามชนิดงาน:

```text
feat/scrum-15-reservation-notification
fix/scrum-42-ownership-transfer
refactor/scrum-37-trading-architecture
docs/scrum-31-order-lifecycle
```

งาน feature, docs, test, ci, chore, refactor และ build ใช้รูปแบบ `<type>/scrum-<number>-<kebab-case>` ส่วนงานแก้ไขเร่งด่วน, audit หรือ cross-cutting maintenance ใช้ `fix/<kebab-case>` ได้โดยไม่ต้องฝัง Jira key ในชื่อ branch แต่ PR ต้องระบุ ticket/เหตุผลที่เกี่ยวข้องเมื่อมี

ตัวอย่าง:

```text
fix/api-integration-audit
```

commit ใช้ Conventional Commits เช่น:

```text
feat(SCRUM-42): transfer cards when seller marks order sent
```

## Product boundaries

- Mythix สร้าง reservation order, แจ้งเตือน, เก็บสถานะ และบันทึก ownership
- Mythix ไม่รับเงิน ไม่เก็บ payment method ไม่จัดการที่อยู่/ขนส่ง และไม่มี in-app chat
- อย่าเพิ่ม `PREPARED`, shipping label, delivery SLA หรือ buyer receipt confirmation โดยไม่มี requirement ใหม่
- `FULFILLED` หมายถึง seller ยืนยันว่าได้รับเงินนอกระบบแล้ว
- `SENT` หมายถึง seller ส่งสินค้าแล้ว และเป็น trigger ของ ownership transfer
- การสร้าง order ต้องตรวจ visibility/stock และ reserve stock แบบ atomic ที่ backend
- order หนึ่งรายการต้องมี seller เดียว

## Code boundaries

- `src/entities` เก็บ vocabulary, types และ pure lifecycle rules
- `src/features/<feature>` เก็บ capability ที่ผู้ใช้มองเห็น รวม API adapter, model, page และ route
- `src/app` ประกอบ route/layout เท่านั้น
- `src/infrastructure/mock-db` เป็น adapter สำหรับ mock mode ไม่ใช่ source of truth ของ production
- `src/shared` เก็บเฉพาะ generic code และห้าม import จาก business feature
- หลีกเลี่ยง cross-feature deep import; ถ้า feature ต้องแชร์ public capability ให้ export ผ่าน `index.ts`
- API enum, mock data, UI label และ test ต้องเปลี่ยนพร้อมกัน

## UI และ accessibility

- ใช้ visual tokens เดิมจาก Figma ได้ แต่ copy และ action ต้องสะท้อน reservation flow
- ทุก async page ต้องมี loading, empty และ error state
- button ที่มีแต่ icon ต้องมี accessible name
- modal ต้องจัดการ focus และปิดด้วย Escape
- form error ต้องผูกกับ field และประกาศผ่าน `role="alert"` เมื่อเหมาะสม
- ทดสอบ desktop และ mobile width ที่ได้รับผลกระทบ

## ก่อนเปิด PR

```bash
npm run lint
npm run test
npm run build
```

ใน PR ให้ระบุ:

- Jira ticket และ backend dependency
- Product flow/Miro/Figma ที่ใช้อ้างอิง
- state transition หรือ ownership impact
- API/migration impact
- สิ่งที่ลบหรือ de-scope
- วิธี verify รวมถึง mock flow ที่ทดลอง
