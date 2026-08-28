# 📋 Mythix Frontend Issue Guide & Delivery Plan

> Last updated: 29 สิงหาคม 2026

เอกสารนี้เป็น **Single Source of Truth สำหรับแผนงาน Frontend** โดยอ้างอิงจาก:

1. **[Miro User Stories](https://miro.com/app/board/uXjVHyqYJNg=/?share_link_id=544445592582):** US-01 ถึง US-09
2. **[Figma](https://www.figma.com/design/X2UPaqQCjGuMtijIgtZ3Aq/TCG-DevOp-Project?node-id=0-1&p=f&t=SUyh6jEOjI70TqQO-0):** 60 production frames ใน 9 sections
3. **GitHub Issues:** ใช้เลข GitHub จริงและ acceptance criteria ใน issue body
4. **Course Checkpoints:** CP1-CP7 และกำหนดส่งของแต่ละ Sprint

> Notion ยังไม่ถูกนำมาเป็น requirement source เพราะ connector ปัจจุบันยังไม่มีสิทธิ์อ่านหน้า Mythix Workspace

## หลักการจัดการ Issue

- ใช้หมายเลข GitHub จริง เช่น `#45` ไม่ใช้เลขภายในแบบ “Issue #4”
- ทุก active issue ต้องอยู่ใน Milestone และมี label ของ Sprint
- Feature issue ต้องระบุ route/Figma scope, states, API contract, permission, tests และ dependencies
- PR ต้องอ้างอิง issue และใช้ `Closes #...` เมื่อ scope เสร็จครบจริง
- งานที่ยังติด backend ให้คง issue เปิดไว้หรือแยก follow-up ชัดเจน ห้ามปิดแล้วปล่อย requirement หาย

---

## ✅ Sprint 1 Baseline — Core UI & Seller Inventory

Sprint 1 ส่งมอบ UI/mock flow หลักแล้ว แต่ Auth และ Browse/Cart ยังมี acceptance gaps ที่ย้ายเป็น Sprint 2 carryover

### [#42 — Registration & Login System](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/42) — Carryover to Sprint 2

- [x] Login, Sign Up และ password-reset UI
- [x] Contextual Login Modal
- [x] Zustand auth store และ token persistence
- [x] Protected routes สำหรับ Buyer, Seller และ Platform Admin
- [ ] Real auth/password-reset API integration
- [ ] Session expiry และ `401`/`403` state synchronization
- [ ] Redirect/resume action หลัง Login
- [ ] Automated auth tests

### [#43 — Browse Products & Shopping Cart](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/43) — Carryover to Sprint 2

- [x] Homepage
- [x] Browse/Product List UI
- [x] Product Detail และ Add to Cart
- [x] Cart, quantity controls และ empty state
- [ ] Working search และ filter semantics ที่ตรง Miro/Figma
- [ ] Invalid price, API error/Retry และ out-of-stock feedback
- [ ] Live stock reconciliation และ cart ownership ต่อผู้ใช้
- [ ] Automated Browse/Cart tests

### [#44 — Seller Inventory Management](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/44) — Completed

ดำเนินการแล้วโดย PR #60:

- [x] Responsive grid/table inventory views
- [x] Search, filter, pagination และ view toggle
- [x] Add/Edit Product พร้อม image preview และ validation
- [x] Profit/Margin calculation
- [x] Show/Hide และ customer visibility
- [x] Delete confirmation และ active-order/hidden guards
- [x] Zustand state และ real/mock Seller Product API

งาน Seller นอก Inventory แยกไปที่ #64, #65 และ #66

---

## 🎯 Sprint 2 — Marketplace, Checkout & Fulfillment

**Target:** 17 ตุลาคม 2026

**Milestone:** [Sprint 2](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/milestone/1)

**เป้าหมาย:** ทำ Buyer → Checkout → Seller Fulfillment → Platform Admin QC → Buyer Tracking ให้ทำงานครบ

### Carryover: #42 Authentication

- [ ] Real Login/Register/Forgot/Reset API
- [ ] Reset-token validation และ expiry
- [ ] `401`/`403`, logout และ persisted-state consistency
- [ ] Return to requested route และ resume Guest action
- [ ] Role matrix และ automated tests

### Carryover: #43 Browse & Cart

- [ ] Working Search และ filter contract
- [ ] Invalid Price Filter state
- [ ] Show-only product visibility
- [ ] Loading/empty/error/Retry states
- [ ] Out-of-stock และ insufficient-stock feedback
- [ ] Cart removal confirmation และ live stock reconciliation

### [#45 — Place Order & Checkout](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/45)

- [ ] Order Review สำหรับ Cart และ Buy Now
- [ ] Shipping Address และ Payment Method selectors
- [ ] No-address/no-payment state
- [ ] QC Protection และ 1-leg/2-leg summary
- [ ] Confirm Checkout Modal
- [ ] Stock-lock acquisition, expiry และ conflict
- [ ] Idempotent order creation และ duplicate-submit guard
- [ ] Order Confirmation
- [ ] Buy Now ต้องไม่แก้ cart เดิม
- [ ] Checkout E2E

### [#46 — Platform Admin Order Management & QC Hub](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/46)

- [ ] QC Queue และ QC Detail Pass/Fail
- [ ] Orders/Shipment Monitor และ Order Detail
- [ ] Status timeline และ tracking
- [ ] Override Status และ Force Refund confirmations
- [ ] Contact Buyer & Seller
- [ ] Hub Consolidation และ blocking-order state
- [ ] Pack & Ship confirmation และ Print Label Preview
- [ ] Audit log, notifications และ transition validation

### [#47 — User Profile & Order History](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/47)

- [x] Profile view และ Edit Personal Information
- [x] Edit Shipping Address และ Payment Method UI
- [ ] Multiple addresses และ Default Address
- [ ] Profile/address/payment API states
- [ ] My Orders และ canonical status filters
- [ ] Buyer Order Detail, tracking และ timeline
- [ ] Checkout → My Orders E2E

### [#64 — Seller Lifecycle, KYC, Approval & Storefront](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/64)

- [ ] Become a Seller CTA
- [ ] Seller Onboarding/KYC
- [ ] Pending/Approved/Rejected/Resubmission states
- [ ] Platform Admin Seller Approval Queue
- [ ] Buyer → Seller role activation
- [ ] Store Profile/Settings
- [ ] Public Seller Storefront
- [ ] Seller Product Detail/catalog entry point
- [ ] Show-only product visibility และ route permission matrix

### [#65 — Seller Order Management & QC Fulfillment](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/65)

- [ ] Seller Order Management พร้อม search/filter/pagination
- [ ] Seller Order Detail และ ownership guard
- [ ] 1-leg/2-leg fulfillment actions
- [ ] Shipment handoff, carrier และ tracking
- [ ] QC Hub handoff และ QC status
- [ ] Timeline/audit entry และ Buyer/Admin notifications
- [ ] Conflict/action-failed/rollback states
- [ ] Seller fulfillment E2E

### Sprint 2 Dependency Flow

`#42 Auth + #43 Browse/Cart → #45 Checkout → #47 My Orders + #65 Seller Fulfillment → #46 Admin QC`

`#42 Auth → #64 Become Seller/KYC → Admin Approval → #44 Seller Inventory/Public Storefront`

---

## 🚀 Sprint 3 — Finance, Dashboard & Production Quality

**Target:** 14 พฤศจิกายน 2026

**Milestone:** [Sprint 3](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/milestone/2)

**เป้าหมาย:** ปิดงานการเงิน/Analytics และทำ Frontend ให้พร้อมส่งมอบจริง

### [#48 — Platform Admin Dashboard, Escrow, Payout & Refund](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/48)

- [ ] Dashboard KPI: GMV, Orders, Monthly GMV และ Average Order Value
- [ ] Sales Trend, date filter และ report export
- [ ] Escrow Ledger แบบ Debit/Credit และ Running Balance
- [ ] Ledger filter, pagination และ export
- [ ] Pay One/Pay All พร้อม confirmation และ idempotency
- [ ] Refund Queue detail และ processing states
- [ ] Financial audit trail และ automated tests

### [#66 — Seller Dashboard & Payout History](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/66)

- [ ] Seller sales/order/revenue summaries
- [ ] Pending payout และ action-required widgets
- [ ] Date filter และ links ไป Inventory/Orders/Payouts
- [ ] Payout History, detail, filters, pagination และ export
- [ ] Reconcile Seller totals กับ Platform Admin ledger
- [ ] Dashboard/Payout loading, empty และ error states

### [#31 — Responsive UI & Accessibility](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/31) — Reopened

- [ ] Customer, Seller และ Platform Admin mobile navigation
- [ ] QA ที่ 375px, 768px, 1024px และ 1440px
- [ ] Responsive tables, sidebars, forms และ modals
- [ ] Keyboard navigation และ visible focus
- [ ] Dialog focus trap/Escape/focus restoration
- [ ] ARIA relationships, live regions, contrast และ reduced motion

### [#33 — Frontend Resilience](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/33) — Reopened

- [ ] Wildcard 404 และ route error elements
- [ ] React Error Boundary
- [ ] Mount global Toast provider
- [ ] Loading/empty/error/Retry/offline/timeout states
- [ ] Session-expired และ standard API error handling
- [ ] Optimistic rollback สำหรับ failed mutations

### [#61 — Security & Dependency Audit](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/61)

- [ ] Dependabot
- [ ] `npm audit` ใน CI

### [#62 — Unit & Component Testing](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/62)

- [ ] Vitest + React Testing Library infrastructure
- [ ] Auth, Cart, Filter และ Seller Inventory store tests
- [ ] Form, Browse, Checkout, Profile และ My Orders component tests
- [ ] Modal/Toast/accessibility tests
- [ ] Coverage reporting และ required CI test check

### [#63 — End-to-End Testing](https://github.com/MUDST-2026-luntungsadungyong/tcg-store-frontend/issues/63)

- [ ] Guest → Login → resume action
- [ ] Browse → Cart → Checkout → Confirmation
- [ ] Buy Now โดย cart เดิมไม่เปลี่ยน
- [ ] Seller KYC → Admin Approval → Seller access
- [ ] Seller Inventory → Public Storefront
- [ ] Seller Fulfillment → Admin QC → Buyer Tracking
- [ ] QC Fail → Refund และ Completed Order → Payout
- [ ] Deterministic test data และ CI artifacts

### Sprint 3 Dependency Flow

`#46 QC/Order State → #48 Escrow/Payout/Refund → #66 Seller Dashboard/Payout History`

`#31 Responsive/A11y + #33 Resilience + #61 Security + #62 Unit/Component → #63 Critical E2E`

---

## 🗺️ Requirement Coverage Map

| Requirement/Figma Area | GitHub Issues |
|---|---|
| Authentication | #42 |
| Homepage, Browse, Product, Cart | #43 |
| Checkout Flow | #45 |
| Profile และ Buyer Orders | #47 |
| Seller Inventory | #44 |
| Seller Lifecycle, KYC, Approval, Storefront | #64 |
| Seller Orders และ QC Fulfillment | #65 |
| Seller Dashboard และ Payout History | #66 |
| Platform Admin Orders/QC/Hub | #46 |
| Platform Admin Dashboard/Escrow/Payout/Refund | #48 |
| Responsive และ Accessibility | #31 |
| Error/Loading/Retry/404 | #33 |
| Security และ Automated Tests | #61, #62, #63 |

## ✅ Definition of Done สำหรับทุก Feature Issue

- [ ] ระบุ route และ Figma node/frame ที่เกี่ยวข้อง
- [ ] รองรับ default, loading, empty, validation, error และ success states
- [ ] ระบุ role/permission ของ Guest, Buyer, Seller และ Platform Admin
- [ ] API contract และ error codes ตรงกับ backend
- [ ] Responsive ที่ 375px, 768px, 1024px และ 1440px
- [ ] Keyboard, focus, ARIA, contrast และ reduced-motion ผ่าน acceptance criteria
- [ ] มี Unit/Component/Integration/E2E ตามระดับความเสี่ยง
- [ ] `npm run lint`, `npm run build` และ test checks ผ่าน
- [ ] PR อ้างอิงและปิด issue เมื่อ checklist/acceptance criteria ครบจริง
