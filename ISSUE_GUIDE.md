# 📋 คู่มือการแบ่งงานและพัฒนาแบบแยกส่วน (Module Development Guide)

คู่มือนี้จัดทำขึ้นเพื่อช่วยให้นักพัฒนาในทีมสามารถแบ่งงานและทำงานขนานกัน (Parallel Development) ได้โดยไม่เกิด Code Conflict หรือต้องรอให้อีกคนทำงานเสร็จก่อน (Blocker)

โปรเจกต์ TCG Store Frontend ถูกแบ่งออกเป็น **5 Modules หลัก** ที่มีความเป็นอิสระต่อกัน สมาชิกในทีมสามารถเลือกหยิบกลุ่ม Issue ใน Module ที่สนใจไปพัฒนาได้เลย โดยไม่จำเป็นต้องทำเรียงตามหมายเลข Issue เสมอไป

---

## 🏗️ 1. Foundation & Design System Module (ระบบพื้นฐาน)
**หมวดนี้คือโครงสร้างพื้นฐานที่ทุกคนต้องใช้ร่วมกัน** ควรให้คนใดคนหนึ่งรับผิดชอบทำให้เสร็จก่อน หรือทำไปพร้อมๆ กันตอนเริ่มโปรเจกต์ เพื่อเป็นฐานให้คนอื่นเรียกใช้
- **เป้าหมาย:** สร้าง Core UI Components (Button, Input, Modal, Toast), ตั้งค่า Tailwind Theme และระบบ CI/CD Pipeline
- **Issues ที่เกี่ยวข้อง:** `#1`, `#2`, `#3`, `#4`, `#5`, `#6`
- **ทักษะที่ใช้:** DevOps, CSS/Tailwind, React Component Design

## 👤 2. Auth & User Management Module (ระบบจัดการผู้ใช้)
**หมวดนี้จะโฟกัสที่ระบบสมาชิกและการจัดการ Profile ของผู้ใช้**
- **เป้าหมาย:** ทำหน้า Login/Register, ระบบจัดการ Authentication ด้วย Zustand, หน้า Profile เพื่อจัดการที่อยู่ และหน้าประวัติคำสั่งซื้อ (My Orders)
- **Issues ที่เกี่ยวข้อง:** `#7`, `#15`, `#16`
- **ทักษะที่ใช้:** Form Validation, State Management, JWT Integration (Mock)

## 🛍️ 3. Storefront & Catalog Module (ระบบหน้าร้านและค้นหาสินค้า)
**หมวดนี้จะโฟกัสที่ฝั่งผู้ซื้อ (Customer) ในการเลือกดูสินค้าและการนำเสนอสินค้า**
- **เป้าหมาย:** พัฒนาหน้า Homepage (Hero Banner, Trending Cards), หน้า Browse (ระบบค้นหา, Filter Sidebar), และหน้ารายละเอียดสินค้า (Product Detail)
- **Issues ที่เกี่ยวข้อง:** `#8`, `#9`, `#10`
- **ทักษะที่ใช้:** UI/UX Design, React Router (URL Params), Debounce Search

## 🛒 4. Cart & Checkout Module (ระบบตะกร้าและชำระเงิน)
**หมวดนี้จะเน้นเรื่อง State Management และ Business Logic เป็นหลัก**
- **เป้าหมาย:** พัฒนาระบบ Zustand Cart Store, Add-to-cart Toast, หน้าตะกร้าสินค้า (แก้ไขจำนวนและลบ), และหน้า Checkout ยืนยันการสั่งซื้อพร้อมตัดสต็อก
- **Issues ที่เกี่ยวข้อง:** `#11`, `#12`, `#13`, `#14`
- **ทักษะที่ใช้:** Zustand, Complex Form State, Data Calculation

## 🛠️ 5. Admin Backoffice Module (ระบบหลังบ้าน)
**หมวดนี้แยกไปเขียน Layout ของ Admin และระบบจัดการข้อมูลเชิงลึกโดยเฉพาะ**
- **เป้าหมาย:** สร้าง Admin Dashboard, ตารางจัดการสินค้า (Add/Edit/Delete), ระบบคำนวณกำไร/Margin แบบ Real-time, และระบบอัปเดตสถานะการจัดส่ง (Fulfillment)
- **Issues ที่เกี่ยวข้อง:** `#19`, `#20`, `#21`, `#22`, `#23`, `#24`, `#32`
- **ทักษะที่ใช้:** Data Table, CRUD Operations, Business Logic Guards (Miro Constraints)

---

## 💡 ข้อแนะนำสำหรับการทำงานแยก Module

1. **ตกลง Data Type ก่อน:** ให้ทีมตกลงโครงสร้างข้อมูล (TypeScript Interfaces) ในไฟล์ `src/types/index.ts` ให้ตรงกันก่อนเริ่มงาน เช่น โครงสร้างของ `Product` หรือ `Order` จะหน้าตาเป็นอย่างไร
2. **ใช้ Mock API ไปก่อน:** ถ้า Backend ยังไม่เสร็จ แต่ละ Module สามารถเขียน Mock Data จำลอง Response จาก API ของตัวเองในโฟลเดอร์ `src/api/` เพื่อให้ทำงานต่อได้เลย
3. **แบ่ง Branch ตามฟีเจอร์:** ให้ทีมแตก Branch ออกจาก `main` ตามฟีเจอร์ เช่น `feature/auth-login`, `feature/cart-checkout` แล้วค่อยเปิด Pull Request กลับมา
4. **สื่อสารกันในทีม:** หากต้องแก้ไข Shared Component เช่น `Button.tsx` ให้แจ้งทีมใน Discord หรือ Group Line เสมอเพื่อป้องกัน Conflict
