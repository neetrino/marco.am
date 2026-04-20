# Զարգացման առաջընթաց — Shop Marco

**Նախագիծ.** Shop Marco  
**Փուլ.** Փաստաթղթավորում + տեխնիկական խստություն  
**Վերջին թարմացում.** 2026-04-20

---

## Ամփոփ աղյուսակ

| Փուլ | Ստատուս | Նշում |
|------|---------|--------|
| Նորմատիվ բազա (ESLint + Cursor rules vs Next.js) | ✅ Ավարտված (commit) | Phase-1 ratchet, App Router default-export carve-out |
| Docs alignment (README, BRIEF, TECH_CARD, architecture) | ✅ Այս PR/կոմիթ | TBD տողերով որտեղ չկա հաստատում |
| ESLint warning queue (any, max-lines, next/img, hooks) | ⏳ Հաջորդ | Չբարձրացնել `--max-warnings` առանց նվազեցման |
| Inline styles cleanup | ⏳ Համ planned | `00-core.mdc` |
| Բիզնես-փաստերի հաստատում (domain, PSP, email) | ⏳ Սպասում | Բոլորը BRIEF/TECH_CARD TBD |

---

## Կատարված (վերջին)

- **2026-04-20** — ESLint ratchet. `pnpm lint` ֆիքսված է ներկա warning քանակի վրա; նոր զգուշացումները կոտրվում են build-ը։
- **2026-04-20** — Թարմացված `README.md`, `docs/BRIEF.md`, ավելացված `docs/TECH_CARD.md`, `docs/01-ARCHITECTURE.md`, `docs/PROGRESS.md`։

---

## Հաջորդ առաջադրանքներ (առաջնահերթություն)

1. Նվազեցնել ESLint warnings-ը փաթեթներով (any → typed errors, `next/image`, function length) և **իջեցնել** `--max-warnings`-ը `package.json`-ում յուրաքանչյուր փուլից հետո։
2. Հաստատել արտադրանքի public անունը/դոմենը և լցնել BRIEF/TECH_CARD TBD-ները։
3. Inline styles → Tailwind/CSS per `00-core.mdc`։

---

## Բլոկեր

- **Չկա կոդային բլոկեր** այս փուլում։ Տեղեկատվական՝ տես վերևի TBD։

---

## Նշումներ

- GitHub remote/repo անունը կարող է տարբերվել npm package անվանից — նորմալիզացնել փաստաթղթերում մեկ անգամ՝ հաստատման ժամանակ։
