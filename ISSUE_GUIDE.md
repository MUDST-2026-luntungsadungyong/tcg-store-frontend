# 📋 คู่มือการแบ่งงานและแผนพัฒนาแบบแยกส่วน (Master Issue & Development Guide)

คู่มือนี้คือ **Master Source of Truth** ที่ผ่านการวิเคราะห์จากระบบ Figma แบบเจาะลึก 100% (ครอบคลุมทั้ง 8 Sections บน Canvas และ Design Tokens จาก MCP API) เพื่อให้นักพัฒนาทุกคนเห็นภาพรวมและรายละเอียดของทุก Issue อย่างครบถ้วน

---

## 🎨 Design Tokens & Shared Rules (ข้อตกลงร่วมกัน)
- **Colors:** 
  - พื้นหลังหลัก (Main Bg): `#0B141F`
  - พื้นหลังการ์ด/กล่อง: `#1B2336`, `#212B42`
  - พื้นหลังการ์ดสินค้า (Product Slab): **`#FFFFFF` (บังคับใช้สีขาวเท่านั้น)**
  - สีเน้น (Accent/Gold): `#EAB308`
  - สีปุ่มหลัก (Primary Button): `#72A8FF`
- **Typography:** `IBM Plex Sans Thai` สำหรับหัวข้อ, `Inter` สำหรับรายละเอียด
- **Layout:** ความกว้าง Content สูงสุด `1440px` (Max-width)

---

## 🏗️ 1. Foundation & Design System Module (ระบบพื้นฐาน)
**อ้างอิงจาก Figma Section:** `Design System & Iteration Scratch`
*หมวดนี้คือการสร้างชิ้นส่วนพื้นฐานให้เสร็จก่อนเริ่มทำหน้าเว็บอื่นๆ*

- **Issue #1: Setup Tailwind & Design Tokens**
  - นำค่าสี (Hex codes) และ Typography ข้างต้นไปตั้งค่าใน `tailwind.config.js`
- **Issue #2: Core UI Components**
  - สร้าง `Button.tsx` (Primary Blue, Secondary Outline, Gold)
  - สร้าง `Input.tsx` (พื้นหลัง `#18202B`, ขอบมน)
  - สร้าง `Badge.tsx` (สถานะราคาขึ้นสีเขียว `#16A34A` พื้นหลัง `#DCFCE7`)
- **Issue #3: Global Layout (Navbar & Footer)**
  - **Navbar:** พื้นหลัง `#151B2B` โลโก้ M (แถบยาว) ซ้าย, ช่องค้นหาตรงกลาง, ปุ่ม Login ขวา
  - **Footer:** พื้นหลัง `#0B111A` โลโก้ Mythic TCG ซ้าย + 3 คอลัมน์ลิงก์ (Policy, Service, Company)

---

## 👤 2. Auth & User Management Module (ระบบบัญชีผู้ใช้)
**อ้างอิงจาก Figma Section:** `auth` & `profile`
*ระบบเข้าสู่ระบบและจัดการโปรไฟล์ส่วนตัว*

- **Issue #4: Authentication Flow**
  - หน้า Login / Register (แบบ Card พื้นหลังมืด)
  - หน้า Forgot Password / Reset Password
  - Modal "Log in to continue" (Popup ดักผู้ใช้ที่ยังไม่ล็อกอินตอนกดปุ่มสำคัญ)
- **Issue #5: User Profile Management**
  - หน้าแก้ไขข้อมูลส่วนตัว (Personal Details)
  - หน้าการจัดการที่อยู่จัดส่ง (Address Book)
  - หน้าการตั้งค่าความปลอดภัยเปลี่ยนรหัสผ่าน (Security)
- **Issue #6: Buyer Dashboard (My Orders)**
  - หน้ารายการประวัติคำสั่งซื้อทั้งหมดของลูกค้า พร้อมป้ายสถานะ (Pending, Shipped, Delivered)

---

## 🛍️ 3. Storefront & Catalog Module (ระบบหน้าร้าน)
**อ้างอิงจาก Figma Section:** `Shop & Browse` & `Product Detail Scratch`
*หน้าเว็บหลักสำหรับลูกค้าเลือกซื้อการ์ด*

- **Issue #7: Homepage Reconstruction**
  - **Hero:** ภาพปราสาทมืดกว้างเต็มจอ + โลโก้ MYTHIC MARKET
  - **Expensive Cards 2025:** ภาพการ์ดเอียงฝั่งซ้าย + ข้อความสีทองฝั่งขวา
  - **What's New!:** แบนเนอร์สไลเดอร์แนวนอน (Carousel) 
  - **10 Most Expensive / Collection:** Grid แสดงการ์ด 4-5 คอลัมน์แนวตั้ง และแนวนอน
- **Issue #8: Browse Catalog Page**
  - หน้าแสดงรายการสินค้าทั้งหมด พร้อมแถบ Filter ด้านบน (Search, Game, Price, Condition, QC)
  - แสดงผลลัพธ์เป็น Grid ของ `ProductCard` แนวตั้งสีขาว
- **Issue #9: Product Detail Page & Actions**
  - หน้าแสดงรายละเอียดการ์ด: ฝั่งซ้ายโชว์รูป Slab ใหญ่, ฝั่งขวาแสดงชื่อ/ราคา/ข้อมูล
  - ปุ่ม `Add to Cart` (กดแล้วโชว์ Toast สีเขียวมุมขวา)
  - แสดงประวัติกราฟราคา (ถ้ามีในดีไซน์)

---

## 🛒 4. Cart & Checkout Module (ระบบตะกร้าและชำระเงิน)
**อ้างอิงจาก Figma Section:** `Buyer Account & ...`
*ระบบการซื้อขายและการทำธุรกรรม*

- **Issue #10: Shopping Cart State**
  - การจัดการ State (Zustand) สำหรับตะกร้าสินค้า 
  - หน้ารายการสินค้าในตะกร้า, ปุ่มเพิ่ม/ลดจำนวน, ปุ่มลบ, คำนวณราคารวม
- **Issue #11: Checkout Flow**
  - ฟอร์มเลือกที่อยู่จัดส่ง (ดึงจาก Profile)
  - ตัวเลือกวิธีการชำระเงิน (QR Code, Credit Card, Escrow)
  - สรุปยอดเงิน (Order Summary) ก่อนยืนยัน
- **Issue #12: Order Confirmation & Tracking**
  - หน้าจอความสำเร็จ (Success) หลังชำระเงิน
  - หน้าจอติดตามพัสดุ (Order Tracking Timeline)

---

## 🛠️ 5. Admin & Seller Backoffice (ระบบหลังบ้าน)
**อ้างอิงจาก Figma Section:** `platform-admin` & `seller`
*ระบบจัดการสำหรับเจ้าของแพลตฟอร์มและผู้ขาย*

### ฝั่ง Platform Admin
- **Issue #13: Admin Dashboard & User Management**
  - หน้า Overview ภาพรวมรายได้และสถิติเว็บ
  - ระบบจัดการสิทธิ์และ แบนผู้ใช้ (User Management)
- **Issue #14: QC Hub & Dispute Resolution**
  - ระบบตรวจสอบสภาพการ์ด (QC Inspection) เทียบกับรูปภาพ
  - ระบบจัดการข้อพิพาท (Disputes) ระหว่างผู้ซื้อและผู้ขาย
- **Issue #15: Financial & Payout Management**
  - อนุมัติการถอนเงิน (Payouts) ให้กับผู้ขาย

### ฝั่ง Seller (ผู้ขาย)
- **Issue #16: Seller Dashboard & Inventory**
  - หน้าแรกสรุปยอดขายของร้าน
  - ตารางจัดการสต็อกสินค้า (Active Listings)
- **Issue #17: Add / Edit Listing Form**
  - ฟอร์มลงขายการ์ด (อัปโหลดรูป, กรอกชื่อ, เลือกหมวดหมู่, ใส่ราคา, เกรด, สภาพ)
- **Issue #18: Order Fulfillment & Earnings**
  - หน้าจัดการจัดส่งสินค้า (พิมพ์ใบปะหน้า, อัปเดตเลขแทร็ก)
  - หน้าสรุปรายได้และกดปุ่มขอถอนเงิน (Request Payout)

---

## 📝 กฎการพัฒนา
1. **Pixel-Perfect UI:** อ้างอิง Layout และระยะห่างตามรูปภาพใน Figma ให้เหมือนที่สุด 
2. **Component Reuse:** พยายามดึง `Button`, `Input`, `ProductCard` ใน Design System มาใช้เสมอ ห้ามสร้างใหม่พร่ำเพรื่อ
3. **Data Type First:** ตกลง Type Interface (`src/types/`) ของ Product, Order, User ให้จบก่อนเริ่มต่อ API
