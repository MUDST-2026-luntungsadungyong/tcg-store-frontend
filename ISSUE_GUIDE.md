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
- [x] **Page 1: `HomePage` (`src/pages/customer/HomePage.tsx` - เสร็จแล้ว 100%):**
  - [x] Hero Cover Section (ภาพปราสาท + โลโก้ Mythic Market + ปุ่ม Start! เลื่อนลง)
  - [x] Hero Feature Carousel ("The 10 Most Expensive..." สไลด์อัตโนมัติ 3 วินาที)
  - [x] Section "What's new!" (การ์ดข่าวสาร 30th Celebration + ปุ่ม More)
  - [x] Section "The 10 Most Expensive Cards" (การ์ดขาวขอบมน เอียง 3D พร้อมเงาเด้งตอน Hover)
  - [x] Section "The Pokémon Cards Collection" (การ์ดแนวนอนพร้อมป้าย IN STOCK)
- [ ] **Page 2: `BrowsePage` (`src/pages/customer/BrowsePage.tsx` - หน้ารวมแคตตาล็อก `/browse`):**
  - [ ] **UI:** หัวข้อหน้า "The Pokémon Cards Collection"
  - [ ] **UI:** แถบ Top Filter Toolbar (ช่องค้นหา Search, ปุ่มตัวกรองหมวดหมู่เกม, ช่องกรอก Min-Max Price พร้อมปุ่ม Apply)
  - [ ] **UI:** Grid แสดงการ์ดสินค้า 3 คอลัมน์ (การ์ด Slab พื้นขาว `#FFFFFF` ขอบมนตาม Figma)
  - [ ] **UI & Logic (Edge States):**
    - [ ] `Empty Filter State`: แสดงหน้าจอและข้อความเมื่อค้นหา/กรองแล้วไม่พบสินค้า
    - [ ] `Invalid Price Filter State`: แจ้งเตือนขอบสีแดงพร้อมข้อความเตือนเมื่อกรอกราคาผิด (เช่น Min > Max หรือติดลบ)
  - [ ] **Integration:** ดึงข้อมูลจาก `productsApi.getProducts()` เชื่อมกับ `useFilterStore`
- [ ] **Page 3: `ProductDetailPage` (`src/pages/customer/ProductDetailPage.tsx` - หน้ารายละเอียดการ์ด `/products/:id`):**
  - [ ] **UI:** แถบ Breadcrumbs นำทาง (`Home > Pokémon Cards > [Card Name]`)
  - [ ] **UI (ฝั่งซ้าย):** รูปภาพการ์ด Slab ขนาดใหญ่ (PSA 10 Graded) พร้อมเอฟเฟกต์ Drop Shadow
  - [ ] **UI (ฝั่งขวา):** ชื่อการ์ด, ป้ายกำกับเกรด/สภาพ, ราคาบาทตัวโต (`฿2000.00`), ป้ายสถานะสต็อกคงเหลือ, ข้อมูลผู้ขาย (Seller Info)
  - [ ] **UI:** ตัวเลือกปรับจำนวนสินค้า (Quantity Selector), ปุ่ม `Add to Cart` (สีน้ำเงิน), และปุ่ม `Buy Now`
  - [ ] **Interactive Feedback:** แสดง Toast Notification สีเขียวมุมขวาบนเมื่อกดเพิ่มสินค้าลงตะกร้าสำเร็จ
  - [ ] **Guest Guard Modal (`ContextualLoginModal`):** แสดง Popup บังคับเข้าสู่ระบบ ("Log in to continue") ทันทีหากผู้ใช้ที่เป็น Guest พยายามกดซื้อหรือกดใส่ตะกร้า
- [ ] **Page 4: `CartPage` (`src/pages/customer/CartPage.tsx` - หน้าตะกร้าสินค้า `/cart`):**
  - [ ] **UI:** ตารางสรุปรายการสินค้าในตะกร้า (รูปภาพ, ชื่อ, ราคาต่อหน่วย, ตัวปรับจำนวน, ปุ่มลบออกจากตะกร้า)
  - [ ] **UI:** การ์ดสรุปยอดชำระรวม (Subtotal, Tax, Shipping, Total Amount) พร้อมปุ่ม "Proceed to Checkout"
  - [ ] **UI:** Empty Cart State (เมื่อไม่มีของในตะกร้า พร้อมปุ่มกลับไปเลือกซื้อสินค้า)
  - [ ] **Logic (`useCartStore`):** ฟังก์ชัน `addItem`, `removeItem`, `updateQuantity`, `clearCart`
  - [ ] **Validation:** ดักจับไม่ให้กดเพิ่มจำนวนเกินสต็อกคงเหลือที่มีอยู่จริง (`maxStock`)
- [ ] **Integration & Routes:** อัปเดต `src/router/index.tsx` รองรับ Route `/browse`, `/products/:id`, `/cart`

### Issue #3: [US-05] ระบบ Inventory Management & CRUD (ฝั่ง Seller)
- [ ] **UI (Layout & Shell):**
  - [ ] ใช้งาน `SellerLayout` และ `SellerSidebar` (เมนู: Dashboard, Add/Edit Listing, Inventory, Payouts)
  - [ ] จัดโครงสร้างหน้า `ProductManagementPage` (`/seller/inventory`) รองรับ Responsive & Dark Theme
- [ ] **UI (Product Management Views):**
  - [ ] สร้างแถบเครื่องมือบนสุด: ช่อง Search ครอบคลุมทุกฟิลด์, ปุ่ม Filter หมวดหมู่เกม, ปุ่ม `+ Add Product`, และปุ่มสลับ Grid View / Table View
  - [ ] สร้างมุมมอง **Grid View (`ProductInventoryGrid`):** การ์ดแสดงรูปภาพ, ชื่อการ์ด, ป้ายเกม, ราคา (฿), ต้นทุน (฿), สต็อก, ป้ายสถานะ Show/Hide, และ Action Dropdown
  - [ ] สร้างมุมมอง **Table View (`ProductManagementTable`):** ตารางแสดงรูป Thumbnail, ชื่อ, หมวดหมู่เกม, ราคาขาย, ต้นทุน, กำไรสุทธิ/Margin (สีเขียว), จำนวนสต็อก, สวิตช์เปิด/ปิดสถานะ, ปุ่ม Edit (ดินสอ), ปุ่ม Delete (ถังขยะ)
- [ ] **UI (Add / Edit Product Modal & Form):**
  - [ ] สร้าง Component `AddEditProductModal` (Modal พื้นหลังเข้ม `#1B2336` ขอบมนตาม Figma)
  - [ ] กล่องอัปโหลดรูปภาพ (Image Dropzone): รองรับ Drag & Drop, JPG/PNG, แสดงภาพตัวอย่าง Preview และปุ่มลบภาพ
  - [ ] ฟอร์มกรอกข้อมูลการ์ด: ชื่อการ์ด (Card Name), หมวดหมู่เกม (Game / Category Select), สภาพการ์ด/เกรด (Condition / PSA Grade)
  - [ ] ฟอร์มกรอกตัวเลข: ราคาขาย (Selling Price ฿), ต้นทุน (Acquisition Cost ฿), จำนวนสต็อก (Stock Quantity)
  - [ ] **ระบบคำนวณกำไรเรียลไทม์ (Course Req #6):** คำนวณ Estimated Profit (`Price - Cost`) และ Margin % อัตโนมัติทันทีที่พิมพ์ตัวเลข พร้อมแสดงตัวอักษรสีเขียว/แดง
  - [ ] Form Validation & Error States: ตรวจสอบช่อง Required, ตัวเลขติดลบ, สต็อกไม่ถูกต้อง แสดงขอบแดงและ Error Hint ชัดเจน
- [ ] **UI & Logic (Status Toggle & Delete Guard):**
  - [ ] **Show / Hide Toggle Switch:** สลับสถานะได้ทันทีจากหน้าตาราง โดยสินค้าที่ `Hide` จะถูกซ่อนออกจากหน้าลูกค้า (`BrowsePage` และ `HomePage`)
  - [ ] **Delete Confirmation Modal:** Popup ยืนยันการลบสินค้า
  - [ ] **Business Rule Validation Guard (กฎการลบ):**
    - [ ] ตรวจสอบว่าสินค้ามีคำสั่งซื้อที่ค้างดำเนินการอยู่ (`Active Orders`) หรือไม่? หากมี -> บล็อกการลบและแจ้งเตือน Error Toast/Modal
    - [ ] บังคับให้ต้องเปลี่ยนสถานะสินค้าเป็น `Hide` ก่อน ถึงจะยอมให้กดปุ่มลบได้
- [ ] **Integration & State Management:**
  - [ ] สร้าง `useSellerInventoryStore` (Zustand) สำหรับจัดการ State รายการสินค้า, Search/Filter, และ Pagination/View toggle
  - [ ] ผูก API `GET /api/seller/products` (ดึงรายการการ์ดของผู้ขาย พร้อม Search & Filter Query)
  - [ ] ผูก API `POST /api/seller/products` (สร้าง Listing สินค้าใหม่)
  - [ ] ผูก API `PUT /api/seller/products/{id}` (อัปเดตข้อมูลการ์ด)
  - [ ] ผูก API `PATCH /api/seller/products/{id}/status` (เปลี่ยนสถานะ Show / Hide)
  - [ ] ผูก API `DELETE /api/seller/products/{id}` (ลบสินค้า)

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
