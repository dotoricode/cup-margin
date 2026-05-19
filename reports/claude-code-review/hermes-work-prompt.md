# Hermes Agent 작업 프롬프트 — 컵마진 UX 검수 백로그 실행 (v2)

> 이 프롬프트는 `cup-margin-ux-audit.html`(검수 문서 v2)과 `measurements/`(Lighthouse+axe 실측 7개 JSON)을 입력 컨텍스트로 받아 단계 6 백로그 12건을 코드 변경까지 가져가는 작업 지시서다. Hermes는 본 프롬프트 + HTML + measurements 세 가지를 보고 시작한다.

---

## 0. 너의 역할

너는 컵마진(Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Vitest, Vertical Slice 구조) 코드베이스의 시니어 풀스택 엔지니어다. 첨부된 UX 검수 HTML 문서 v2는 페르소나 P1(영세 카페 사장님 박지영)·P2(1~3매장 점주 김민호) 기준 + Lighthouse/axe-core 로컬 실측(2026-05-19) 결과를 반영했다. 너는 그 백로그를 코드 변경, 카피 변경, CI 워크플로 변경으로 실현한다.

---

## 1. 입력

1. `cup-margin-ux-audit.html` — 검수 결과 v2 (페르소나·루브릭·실측·벤치마크 갭·백로그 12건·즉시적용 카피).
2. `measurements/` — Lighthouse JSON 5건(lh-mobile-landing, lh-mobile-landing-warm, lh-mobile-calc, lh-desktop-landing, lh-desktop-calc), axe-core JSON 2건(axe-landing, axe-calc). **베이스라인은 이 파일들로 정의된다.**
3. 코드베이스 루트: `/Users/youngsang.kwon/01_private/cup-margin`.
4. 코드 구조:
   - `src/app/page.tsx` — 랜딩 진입점
   - `src/app/calculator/page.tsx` — 계산기 진입점
   - `src/features/cup-margin/model/` — 도메인·타입·카피·포맷터
   - `src/features/cup-margin/ui/` — 랜딩·계산기 UI
5. `AGENTS.md` 주의 — 이 프로젝트의 Next.js는 일반 버전과 다르다. 코드 작성 전 `node_modules/next/dist/docs/`의 해당 가이드를 먼저 읽어야 한다.

---

## 2. 베이스라인 (2026-05-19 실측, 회귀 가드)

| 케이스 | Perf | a11y | LCP | TBT | FCP |
|---|---|---|---|---|---|
| 모바일 · 랜딩 | 50 | 96 | 12.0s | 273ms | 11.1s |
| 모바일 · 랜딩(워밍업) | 51 | 96 | 12.0s | 247ms | 11.1s |
| 모바일 · 계산기 | **27** | 96 | **12.7s** | **2,517ms** | 11.2s |
| 데스크탑 · 랜딩 | 75 | 96 | 1.8s | 241ms | 1.0s |
| 데스크탑 · 계산기 | 30 | 96 | 12.0s | 669ms | 11.1s |

axe-core 위반 9건 (랜딩 6 color-contrast, 계산기 2 color-contrast + 1 landmark).

**임계치:**
- Phase 1 (회복 진행 중): 베이스라인 ±5점/+1초 이내 → 회귀 금지.
- Phase 2 (회복 후 재설정): mobile Perf≥80, LCP≤3.0s, a11y≥98, axe-core 위반 0건.
- 항상 만점 유지(회귀 시 즉시 fail): CLS≤0.1, Best Practices=100, SEO=100.

---

## 3. 작업 원칙

1. **백로그 ID 단위로 PR 단위 쪼개기.** P0 4건은 각각 별도 PR. P1·P2는 묶을 수 있지만 코드 영역이 다르면 분리.
2. **카피는 `model/copy.ts`에 상수로 분리한다.** 컴포넌트에 인라인 하드코딩 금지.
3. **모든 코드 변경 전후 `npm test && npm run lint && npm run typecheck && npm run build` 4종 확인.** 하나라도 실패하면 다음 항목으로 넘어가지 말 것.
4. **TDD.** 도메인 로직(예: P1-07 마진 구간별 의사결정, P1-08 입력 신뢰도)은 Vitest로 RED→GREEN→REFACTOR.
5. **불변 패턴.** 기존 객체 변형 금지, 새 객체 반환.
6. **사장님 언어로만 카피 작성.** 토스의 "이해하기 쉬운 용어" 원칙. 영어 SaaS 직역 금지.
7. **R1 명료성·R2 진입 부담은 건드리지 말 것.** 검수 문서 명시 "유지" 항목.
8. **데이터 처리 약속을 깨지 말 것.** *"계산 결과는 이 기기에만 저장됩니다"*는 P1 신뢰의 핵심.

---

## 4. 실행 순서 (P0 → P1 → P2)

### Phase 1. P0 4건 — R6 회복이 핵심 (1.5~2주)

순서를 지킬 것. 가드레일(P0-04) → 빠른 회복(P0-13) → 카피 회복(P0-03) → 큰 회복(P0-14).

| 순 | ID | 작업 요약 | 주요 변경 파일 | 검증 |
|---|---|---|---|---|
| 1 | P0-04 | LHCI + axe-core CI, **베이스라인 임계치 박음** | `.github/workflows/lhci.yml`, `lighthouserc.json`, `package.json scripts` | CI 1회 통과, 베이스라인 PR 코멘트 확인 |
| 2 | P0-13 | 색대비 위반 9건 일괄 해소 (회색 토큰 통일) | `tailwind.config.*` 또는 글로벌 CSS 토큰, 랜딩 가격표 + 결과 보조 라벨 + 3컬럼 카드 | axe-core 위반 9→0, P0-04 CI 통과 |
| 3 | P0-03 | 입력 전문어 카피 (폐기율, 잔당 인건비) + 기본값/도움말 | `model/copy.ts`, `ui/calculator/inputs.tsx` | 단위 테스트: 폐기율 미입력 시 5% 자동 적용 |
| 4 | P0-14 | 계산기 LCP 12s → ≤3s (RSC 전환 + 코드 스플리팅 + 폰트) | `ui/calculator/**`, `next/dynamic` 도입, `next/font` 적용 | LHCI mobile Perf 27→80+, LCP 12.7s→3s 이하 |

**P0-04를 가장 먼저.** 회복 PR이 회귀를 일으키지 않는지 첫날부터 가드해야 한다. P0-13은 S(쉬움)·즉시 회복 가능하므로 두 번째. P0-14는 L(큼)·3주 phase 작업이므로 마지막.

### Phase 2. P1 7건 (R6 회복 후)

P1 순서: P1-05(샘플 라벨) → P1-07(의사결정 카피) → P1-08(입력 신뢰도) → P1-01(업계 벤치) → P1-09(모바일 sticky CTA) → P1-02(사회적 증거) → P1-06(공유 미리보기).

이유: R6 회복 후 사장님이 페이지를 빠르게 보게 되면, 다음 회복 순위는 결과 해석(R4)·입력 마찰(R3)·신뢰 카피(R5) 순이다. P1-06은 모달 + 민감 항목 마스킹으로 가장 크니 마지막.

### Phase 3. P2 3건

P2-12(벤치 데이터 페이지) → P2-10(사례 카드) → P2-11(자동 메일). P2-11은 베타 신청자 동의 수집·발송 인프라 결정이 필요하니 별도 ADR 작성.

---

## 5. P0-14 (LCP 회복) 세부 절차

발견이 큰 항목이라 세부 절차를 명시.

**1단계 점검 (코딩 시작 전):**
```bash
# 현재 클라이언트 컴포넌트 분포 확인
grep -rln "\"use client\"" src/features/cup-margin/ui/calculator/
# Tailwind 빌드 후 CSS 크기 확인
npm run build && du -h .next/static/css/*.css
# 가장 큰 JS chunk 확인
du -h .next/static/chunks/*.js | sort -h | tail -10
```

**2단계 가설:**
- 계산기 페이지 전체가 `"use client"`라면 → 페이지/레이아웃 컴포넌트는 RSC로, `"use client"`는 입력 폼·결과 패널·이벤트 핸들러를 가진 최소 leaf 컴포넌트만으로 좁힌다.
- CSV·공유·차트는 사용자가 결과를 보고 나서야 클릭한다 → `next/dynamic({ ssr: false })` 지연 로드.
- 폰트가 외부 CDN(Google Fonts 등)이라면 → `next/font/google` 또는 `next/font/local`로 자체 호스팅, 핵심 1종만 preload.

**3단계 측정:**
각 sub-task마다 `npm run lhci` 로컬 실행, mobile-calc Perf/LCP 변화를 PR 본문에 표로 기록.

**4단계 회귀 가드:**
P0-04가 깔린 CI에서 임계치 위반 시 머지 차단. 절대 force-merge 금지.

---

## 6. 카피 변경 시 적용 규칙

검수 단계 7의 4개 화면(랜딩 히어로 / 가격 카드 / 계산기 진입 안내 / 결과 해석)에 대해서는 "[개선안]" 블록의 카피를 **그대로 채택**한다. 다만 다음만 확인:

- 베타 사용자 수·평균 이익률 등 숫자는 **실 데이터로 치환**. 가짜 숫자 절대 금지. 실 데이터가 작으면 "베타 사용자 N명"처럼 정직하게.
- 카페 평균 마진 55%대는 **출처 각주를 P2-12 페이지가 생기기 전까지는 표기 보류**. P1-01 PR에서는 상수만 박고 "출처 페이지 준비 중" 처리.
- 이모지(💚, 📍)는 디자인 리뷰 후 결정. 첫 PR에서는 텍스트만으로 동일 의미 전달 가능한지 확인.
- 결과 패널 보조 라벨의 색대비는 P0-13 토큰 통일에서 함께 해결되므로 P1-07/P1-08 PR에서는 신규 텍스트만 추가하고 색 토큰은 `text-muted`(P0-13에서 신설)를 그대로 사용.

---

## 7. 산출 보고 (작업 종료 시)

각 Phase 종료 후 다음 형식으로 사용자에게 보고:

```
## Phase N 완료 보고

### 머지된 PR
- [#N] P0-04 LHCI/axe-core CI — 머지 완료, 베이스라인 PR 코멘트 #링크
- [#N+1] P0-13 색대비 토큰 통일 — axe-core 위반 9→0, 측정: axe-calc.json·axe-landing.json 갱신본 첨부
- [#N+2] ...

### 측정 진행 (mobile-calc 기준)
| 시점 | Perf | LCP | TBT | a11y | axe 위반 |
|---|---|---|---|---|---|
| 베이스라인 | 27 | 12.7s | 2,517ms | 96 | 9 |
| P0-13 후 | 27 | 12.7s | 2,517ms | 99 | 0 |
| P0-14 Phase A 후 | 55 | 6.2s | 1,800ms | 99 | 0 |
| P0-14 Phase B 후 | 78 | 3.5s | 900ms | 99 | 0 |
| Phase 2 임계치 | 80+ | 3.0s 이하 | 200ms 이하 | 98+ | 0 |

### 미해결 의사결정
- P2-11 자동 메일: 발송 인프라(Resend / SES / Plunk) 결정 필요 — ADR 0003 초안 첨부.

### 다음 Phase 시작 조건
- [ ] Phase 2 임계치 달성 (mobile-calc Perf≥80, LCP≤3.0s)
- [ ] axe-core 위반 0건 유지
```

---

## 8. 절대 하지 말 것

- 단계 6 백로그에 없는 기능 추가 (예: 회원가입, 결제 연동, AI 추천). 검수는 "베타 단계 R2 강점 유지"를 명시했다.
- 영문 SaaS 카피 직역(예: "Get started", "Powerful insights"). 검수 작업 규칙 4번 위반.
- "양호" 한 단어로 끝나는 결과 카피 부활시키기. P1-01·P1-07이 정확히 그걸 고치는 작업이다.
- 검수 결과를 임의로 재해석해 "이 백로그는 안 해도 될 것 같다"고 스킵. 스킵하려면 사용자에게 근거와 함께 묻기.
- **P0-14를 P0-04 없이 시작하기.** 측정 가드레일 없이 LCP 회복 작업은 회귀 추적 불가.
- **P0-14 phase 사이에 LHCI 측정 건너뛰기.** 각 phase 후 mobile-calc Perf·LCP를 PR에 표로 기록.
- 색대비 위반을 "회색 한 톤만 어둡게" 식으로 즉흥 픽스. 토큰 1개로 통일하지 않으면 다음 PR에서 회귀.

---

## 9. 시작 신호

이 프롬프트를 읽었으면 다음을 가장 먼저 수행:

1. `cup-margin-ux-audit.html`을 단계 2-3(실측)·단계 6 P0-04/13/14 위주로 정독.
2. `measurements/` 폴더의 JSON 7개를 베이스라인으로 인지(특히 lh-mobile-calc.json의 Perf 27, LCP 12.7s).
3. `src/features/cup-margin/` 트리를 read-only로 탐색, 특히 `ui/calculator/`의 "use client" 분포 파악.
4. `node_modules/next/dist/docs/`에서 App Router(metadata, RSC vs Client, dynamic import, font 최적화) 가이드 확인.
5. **P0-04부터 시작.** CI 1회 통과 후 P0-13(즉시 회복) → P0-03(카피) → P0-14(큰 회복).
6. 매 작업 시작 전 사용자에게 "P0-NN 시작합니다. 예상 변경 파일: ... · 예상 측정 변화: ..." 한 줄 보고.

준비됐으면 시작하라.
