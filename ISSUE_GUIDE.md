# 📋 Master Issue Guide & Development Plan (Revised with Detailed TODOs)

คู่มือนี้คือ **Single Source of Truth** ที่ผสานระหว่าง:
1. **User Stories (Functional):** อิงจากเอกสาร `DevOps_User Flow.csv` (US-01 ถึง US-09)
2. **Figma UI (Visual & Flow):** อิงจากการแมปใน `.agents/miro-userflows.md` (Seller / Platform Admin / Buyer)
3. **Course Checkpoints (Timeline):** อิงจากกติกา CP1-CP7

---

## 🎯 Sprint 1: CP3 - Runnable Code & Core Flows (Target: 12 ก.ย.)
*เป้าหมาย: ระบบหลักรันได้ (Auth, Browse, Cart, CRUD พื้นฐาน)*

### Issue #1: [US-01] ระบบ Registration & Login
- [ ] **UI:** สร้าง `LoginPage` (อิงดีไซน์ Card พื้นหลังมืด) พร้อมฟอร์ม Email/Password
- [ ] **UI:** สร้าง `RegisterPage` พร้อม Validation (เช็ค Email format, Password length)
- [ ] **UI:** สร้าง Component `ContextualLoginModal` เป็น Popup สำหรับดักผู้ใช้ Guest (reusable)
- [ ] **Logic/State:** ติดตั้ง Zustand/Redux สำหรับเก็บ `auth_token`, `user_role`, และ `user_id`
- [ ] **Integration:** ผูก API `POST /api/auth/login` เก็บ JWT token ลง LocalStorage/Cookie
- [ ] **Integration:** ผูก API `POST /api/auth/register`
- [ ] **Routing:** ทำ Protected Route (บังคับ redirect ไปหน้า Login หากไม่มี Token)

### Issue #2: [US-02 & US-03] ระบบ Browse Products และ Shopping Cart
- [ ] **UI:** สร้างหน้า `HomePage` ดึง Component Card สินค้ามาแสดง
- [ ] **UI:** สร้าง `FilterBar` (Search text, Min/Max Price, Rarity, Game)
- [ ] **UI:** สร้างหน้า `ProductDetailPage` แสดงรูปใหญ่ฝั่งซ้าย ข้อมูลฝั่งขวา พร้อมป้าย Stock
- [ ] **UI:** สร้างปุ่ม `AddToCartButton` พร้อมระบบ Toast Notification เวลาเพิ่มสำเร็จ
- [ ] **UI:** สร้างหน้า `CartPage` แสดงรายการสินค้า, ราคารวม
- [ ] **Logic:** ระบบตะกร้า (Cart State): ฟังก์ชัน Increase (+), Decrease (-), Remove (x)
- [ ] **Logic:** Validation: ไม่สามารถกด Add to Cart หรือ + สินค้าเกินจำนวน Stock ได้
- [ ] **Integration:** ผูก API `GET /api/products` (พร้อม Query parameters สำหรับ Filter)

### Issue #3: [US-05] ระบบ Inventory Management (ฝั่ง Seller)
- [ ] **UI:** สร้าง Layout พื้นฐานของ `SellerDashboard` (Sidebar nav 5 รายการ)
- [ ] **UI:** สร้างตาราง `ProductManagementTable` แสดงรายการการ์ดที่ลงขาย
- [ ] **UI:** สร้าง `AddEditProductModal` (ฟอร์มอัปโหลดรูป, ชื่อ, ราคา, ต้นทุน, สต็อก)
- [ ] **UI:** เพิ่ม Toggle Switch สำหรับเปลี่ยนสถานะ (Show / Hide)
- [ ] **Logic:** เช็คเงื่อนไขก่อนการ Delete (ห้ามลบหากมี Active Order อยู่) -> แสดง Error Toast
- [ ] **Integration:** ผูก API `POST /api/seller/products`, `PUT /api/seller/products/{id}`, `DELETE`

---

## 🎯 Sprint 2: CP5 - Marketplace & K8s Deploy (Target: 17 ต.ค.)
*เป้าหมาย: ระบบ Marketplace, QC Hub และ Escrow ทำงานได้ครบ (2-leg shipping)*

### Issue #4: [US-04] ระบบ Place Order & Checkout
- [ ] **UI:** สร้างหน้า `OrderReviewPage` แสดงรายการสรุป (Summary Card)
- [ ] **UI:** สร้างกล่องแสดง `ShippingAddress` (ดึงจาก Profile มาแสดง)
- [ ] **UI:** สร้าง Toggle Option: `QC Protection (+Fee)` สำหรับเปิดใช้ 2-leg shipping
- [ ] **UI:** สร้างหน้า `OrderConfirmationPage` (Success State)
- [ ] **Logic:** ตรวจสอบ Stock-lock (ส่ง Request ไปกันสต็อกชั่วคราว) ถ้าไม่ได้ให้เด้ง Error Modal
- [ ] **Integration:** ผูก API `POST /api/orders/checkout` (แปลงของใน Cart เป็น Order -> Status: Pending)

### Issue #5: [US-07] ระบบ Order Management & QC Hub (Platform Admin)
- [ ] **UI:** สร้างตาราง `QCQueueTable` (แสดงของที่ Seller ส่งมาถึง Hub)
- [ ] **UI:** สร้างหน้า `QCDetailScreen` สำหรับกด Pass / Fail พร้อมเช็กลิสต์สภาพการ์ด
- [ ] **UI:** สร้างตาราง `OrderShipmentMonitor` ดูภาพรวมสถานะ (1-leg vs 2-leg)
- [ ] **Logic:** การกด Pass -> เปลี่ยนสถานะเป็น `QC_PASSED` และเข้าคิว Pack & Ship
- [ ] **Logic:** การกด Fail -> เปลี่ยนสถานะเป็น `QC_FAILED` และโยนเข้าคิว Refund Buyer
- [ ] **Integration:** ผูก API เปลี่ยนสถานะ Order (`PUT /api/admin/orders/{id}/status`) พร้อมเก็บบันทึก Audit Log (Timestamp)

### Issue #6: [US-08 & US-09] ระบบ User Profile & Order History
- [ ] **UI:** สร้างหน้า `ProfileSettingsPage` (ฟอร์มแก้ไขชื่อ, เบอร์โทร)
- [ ] **UI:** สร้างหน้า `AddressBookPage` (ปุ่ม Add New Address / Edit Address)
- [ ] **UI:** สร้างหน้า `MyOrdersPage` สำหรับ Buyer แสดงรายการคำสั่งซื้อ
- [ ] **Logic:** เพิ่ม Tabs filter สถานะในหน้า My Orders (All, Pending, Shipped, Completed)
- [ ] **Integration:** ผูก API `PUT /api/users/profile`, `GET /api/users/orders`

---

## 🎯 Sprint 3: CP6 & CP7 - Final Delivery (Target: 14 พ.ย.)
*เป้าหมาย: ระบบหลังบ้านแอดมิน, สรุปบัญชี Escrow, และเก็บตกงานทั้งหมด*

### Issue #7: [US-06] Platform Admin Dashboard & Payouts
- [ ] **UI:** สร้างตารางสรุปบัญชี `EscrowLedgerTable` (Double-entry: Debit/Credit, Running Balance)
- [ ] **UI:** สร้างตาราง `PayoutQueue` สรุปยอดเงินที่ต้องโอนให้ Seller
- [ ] **UI:** สร้างหน้า `RefundQueue` สำหรับ Order ที่ QC ไม่ผ่าน
- [ ] **Logic:** ปุ่ม "Pay All" หรือ Pay ทีละบรรทัด พร้อม Confirm Modal ป้องกันการกดผิด
- [ ] **Integration:** ผูก API `GET /api/admin/escrow/ledger`, `POST /api/admin/payouts/process`
