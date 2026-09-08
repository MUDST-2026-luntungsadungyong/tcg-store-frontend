# Frontend Architecture

โปรเจกต์ใช้ feature-first architecture เพื่อให้ requirement จาก Jira/Figma เปลี่ยนได้โดยไม่กระทบทั้ง codebase

## Layers

### `src/app`

ประกอบ application เท่านั้น เช่น root component, global layouts, route composition และ error boundary
ไม่วาง business API, domain store หรือ feature page ใน layer นี้

### `src/features/<feature>`

หนึ่ง feature แทน business capability ที่มี owner และ Jira scope ชัดเจน ภายในเลือกใช้ folder เท่าที่จำเป็น:

```text
feature/
├── api/          # Request adapter และ response normalization
├── components/   # UI ที่ใช้เฉพาะ feature
├── layouts/      # Feature-owned layout/sidebar
├── lib/          # Pure business helpers
├── model/        # Zustand store, state machine และ feature types
├── pages/        # Route-level screens
├── routes.tsx    # Route definitions ของ feature
└── index.ts      # Public API สำหรับ feature อื่น
```

ห้ามสร้าง folder ว่างเพื่อเดา requirement ล่วงหน้า เพิ่มเมื่อ ticket ต้องใช้จริง

### `src/shared`

เก็บเฉพาะโค้ดที่ไม่มี business owner เช่น HTTP client, primitive UI, generic utility, config และ test mocks
`shared` ห้าม import จาก `features` หรือ `app`

## Dependency rules

```text
app ───────> features ───────> shared
 │                              ▲
 └──────────────────────────────┘
```

- `app` import ได้จากทุก feature และ shared
- feature import implementation ภายใน feature ตัวเองได้
- การเรียกข้าม feature ต้อง import ผ่าน `@/features/<feature>` public API
- `shared` import ได้เฉพาะ shared
- ห้าม import page ของ feature หนึ่งเข้าอีก feature
- API response ต้อง normalize ที่ `feature/api` ก่อนเข้า component/store

## Routing

แต่ละ feature เป็นเจ้าของ route definitions ของตัวเอง ส่วน `src/app/router/index.tsx` มีหน้าที่ประกอบ route,
layout และ permission boundary เท่านั้น

Route ที่ยังไม่เสร็จใช้ `PlaceholderPage` เพื่อให้ navigation contract เห็นชัด แต่ placeholder ไม่ถือว่า feature Done

## State

- Zustand store อยู่ใน `feature/model`
- Server response ไม่ควรถูกเก็บซ้ำหลาย store
- Persist เฉพาะข้อมูลที่ต้องอยู่ข้าม reload และแยกข้อมูลต่อ user
- Auth/session hooks ถูก inject เข้า shared HTTP client เพื่อป้องกัน `shared -> feature` dependency

## API and mocks

- `src/shared/api/client.ts` ดูแล transport/interceptor เท่านั้น
- Endpoint และ response adapter อยู่ใน feature ที่เป็นเจ้าของ
- Mock storage เป็น development adapter ไม่ใช่ API contract
- เมื่อ backend contract เปลี่ยน ต้องแก้ adapter, types, fixtures และ tests ใน PR เดียวกัน

## Adding work from Jira

1. หา feature owner ที่ตรงกับ ticket
2. เพิ่ม page/component/API/store ใน feature เดิม
3. ถ้าเป็น capability ใหม่จริงจึงสร้าง feature ใหม่
4. เพิ่ม route ใน `feature/routes.tsx`
5. export เฉพาะสิ่งที่ feature อื่นจำเป็นต้องใช้ผ่าน `index.ts`
6. แนบ Figma node และ linked backend ticket ใน PR

## Naming

- Components/pages: `PascalCase.tsx`
- Hooks/stores: `useName.ts`
- API adapters: ชื่อ resource เช่น `products.ts`
- Tests: อยู่ข้างไฟล์เป้าหมายด้วย `.test.ts` หรือ `.test.tsx`
- Branch: `<type>/scrum-<number>-<kebab-case>`
