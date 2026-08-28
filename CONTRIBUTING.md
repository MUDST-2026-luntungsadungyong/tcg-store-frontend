# 🤝 Contributing Guide & Team Conventions

คู่มือและข้อปฏิบัติสำหรับการพัฒนาโปรเจกต์ **Mythix TCG Store Frontend** สำหรับสมาชิกทุกคนในทีม

---

## 🎨 1. มาตรฐาน CSS Framework (Tailwind CSS v3)

เพื่อป้องกันปัญหา CSS ชนกันและรักษา Design Consistency ให้เหมือน Figma:

1. **ใช้ Tailwind Utility Classes เท่านั้น**:
   - ไม่เขียน inline style (`style={{ ... }}`)
   - ไม่สร้าง class แบบ arbitrary ในไฟล์ css อื่น
2. **เรียกใช้ Color Palette จาก Theme**:
   - พื้นหลังหลัก: `bg-bg-base`
   - การ์ดสินค้า Slab: `bg-white` (สำคัญ!)
   - การ์ดยกระดับ / Modal: `bg-bg-elevated`
   - อินพุต: `bg-bg-input`
   - สีฟ้าหลัก: `text-brand-blue` / `bg-brand-blue`
   - สีทองไฮไลท์: `text-brand-gold` (`#EAB308`)
3. **ใช้งาน Reusable Components**:
   - ปุ่ม: ใช้ `<Button variant="primary | secondary | gold | danger" />` จาก `@/components/common/Button`
   - อินพุต: ใช้ `<Input label="..." error="..." />` จาก `@/components/common/Input`
   - ป้ายสถานะ: ใช้ `<Badge variant="success | warning | danger | gold" />` จาก `@/components/common/Badge`

---

## 🌿 2. Git Branching Strategy

- **`main`**: Production-ready code (Protected branch — ห้าม push ตรงเด็ดขาด)
- **`develop`**: Integration branch สำหรับรวบรวมฟีเจอร์ของแต่ละ Sprint
- **Feature / Fix branches**:
  - `feat/us-01-login`
  - `feat/us-02-browse`
  - `fix/us-03-cart-quantity`

---

## 💬 3. ข้อตกลงการตั้งชื่อ Commit & PR (Conventional Commits)

โปรเจกต์มี **GitHub Actions PR Title Linter** คอยตรวจเช็ค:

| Prefix | ตัวอย่าง | ผลกระทบต่อเวอร์ชัน |
|---|---|---|
| `feat:` | `feat: add product filter sidebar` | Minor (`1.0.0` ➡️ `1.1.0`) |
| `fix:` | `fix: resolve cart stock validation` | Patch (`1.1.0` ➡️ `1.1.1`) |
| `feat!:` | `feat!: overhaul state to Zustand` | Major (`1.1.0` ➡️ `2.0.0`) |
| `docs:` | `docs: update setup guide in README` | ไม่ขยับเวอร์ชัน |
| `chore:` | `chore: update dependencies` | ไม่ขยับเวอร์ชัน |
| `test:` | `test: add cartStore unit test` | ไม่ขยับเวอร์ชัน |
| `ci:` | `ci: update GitHub Actions workflow` | ไม่ขยับเวอร์ชัน |

---

## 📋 4. PR Checklist ก่อนส่ง Review

ก่อนเปิด Pull Request และขอให้เพื่อน Review:
- [ ] รัน `npm run lint` ผ่าน (ตรวจ static lint ด้วย Oxlint)
- [ ] รัน `npm run build` ผ่าน (ตรวจ TypeScript types และ production bundle)
- [ ] ตั้งชื่อ PR ตาม Conventional Commits (เช่น `feat: add shopping cart page`)
- [ ] ใส่หมายเลข Issue ใน Description (เช่น `Closes #2`)
- [ ] ตรวจสอบว่า UI สอดคล้องกับ Figma และรองรับ Responsive
