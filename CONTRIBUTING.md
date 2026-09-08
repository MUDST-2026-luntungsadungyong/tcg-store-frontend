# Contributing to Mythix Frontend

## Before starting

1. อ่าน ticket จาก [Jira board](https://nunkantinan.atlassian.net/jira/software/projects/SCRUM/boards/1)
2. อ่าน linked backend ticket และ dependency
3. เปิด Figma node/frame ที่เกี่ยวข้องจาก [Figma](https://www.figma.com/design/X2UPaqQCjGuMtijIgtZ3Aq/TCG-DevOp-Project?node-id=0-1)
4. ตรวจว่า API contract, field, enum และ permission ชัดเจนก่อนเขียน implementation

Repository นี้ไม่ใช้ GitHub Issues เป็น backlog และไม่เก็บ acceptance criteria ซ้ำจาก Jira

## Branches

`main` และ `develop` เป็น protected branches ห้าม push ตรง

ชื่อ branch ต้องมี Jira key:

```text
feat/scrum-15-auth-integration
fix/scrum-12-stock-reservation
refactor/scrum-37-feature-first-architecture
docs/scrum-31-accessibility-guide
```

รูปแบบที่อนุญาตคือ `<type>/scrum-<number>-<kebab-case>`

## Project boundaries

- Business code อยู่ใน `src/features/<feature>`
- Application composition อยู่ใน `src/app`
- Generic code ที่ไม่มี business owner อยู่ใน `src/shared`
- Cross-feature import ต้องผ่าน public `index.ts` ของ feature
- ห้ามย้าย business logic เข้า shared เพื่อหลบ dependency rule
- Route ใหม่ต้องประกาศใน `src/features/<feature>/routes.tsx`

อ่านรายละเอียดที่ [docs/architecture.md](docs/architecture.md)

## UI conventions

- ใช้ Tailwind CSS และ design tokens ที่มีอยู่
- ใช้ primitive จาก `@/shared/components`
- Component ที่ใช้เฉพาะ feature ให้อยู่ใน feature นั้น
- ตรวจ responsive, keyboard navigation, focus, loading, empty และ error states ตาม ticket/Figma
- Figma section ที่มีคำว่า `Scratch` ไม่ถือเป็น approved implementation source จนกว่า Jira ticket จะอ้าง node นั้น

## API changes

- HTTP client กลางอยู่ที่ `src/shared/api/client.ts`
- Endpoint adapter และ response normalization อยู่ใน `feature/api`
- ห้ามใช้ mock shape เป็นหลักฐานว่า backend contract รองรับแล้ว
- ถ้า endpoint/field/enum เปลี่ยน ให้ตกลงกับ backend และอัปเดต tests/fixtures ใน PR เดียวกัน
- ห้ามให้ component อ่าน raw backend response โดยตรง

## Commit and PR title

ใช้ Conventional Commits:

```text
feat(auth): integrate login flow (SCRUM-15)
fix(cart): handle stale stock response (SCRUM-17)
refactor(app): split routes by feature (SCRUM-37)
```

PR title ต้องขึ้นต้นด้วย type ที่รองรับ เช่น `feat`, `fix`, `docs`, `refactor`, `test`, `ci` หรือ `chore`

## Verification

รันทุกคำสั่งก่อนเปิด PR:

```bash
npm run lint
npm run test
npm run build
```

## Pull request checklist

- [ ] Branch มี Jira key ถูกต้อง
- [ ] PR ระบุ Jira ticket และ linked backend ticket
- [ ] PR ระบุ Figma node/frame ที่ใช้
- [ ] การเปลี่ยนแปลงอยู่ใน feature owner ที่ถูกต้อง
- [ ] Mock, types และ API adapter ไม่ขัดกับ backend contract
- [ ] Loading/empty/error/unauthorized/responsive states ครบตาม scope
- [ ] `npm run lint`, `npm run test` และ `npm run build` ผ่าน
- [ ] ไม่มี secret, `.env` หรือ credential ถูก commit
