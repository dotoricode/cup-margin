# 컵마진 (CupMargin)

한 잔 팔면 진짜 얼마 남는지 보여주는 카페 사장님용 메뉴 마진 계산 MVP입니다.

## MVP 목표

- 메뉴 1개를 무료로 계산한다.
- 판매가, 재료비, 포장비, 플랫폼 수수료, 폐기율, 인건비, 고정비 배부를 입력한다.
- 한 잔당 남는 돈, 마진율, 월 예상 이익, 손익분기 잔수를 보여준다.
- 500원/1,000원 가격 인상 시나리오를 바로 비교한다.
- 무료 체험 → 월 9,900원 베이직 플랜으로 이어지는 저마찰 SaaS 흐름을 검증한다.

## 아키텍처

Vertical Slice Architecture로 시작합니다.

```txt
src/
  app/
    page.tsx                 # 라우트 진입점, slice만 조립
    layout.tsx               # 메타데이터와 공통 HTML
  features/
    cup-margin/
      model/                 # 계산 도메인, 타입, 카피, 포맷터
      ui/                    # 컵마진 랜딩과 계산기 UI
```

다음 기능은 `features/<feature-name>` 단위로 추가합니다.

- `inventory-pack`: 폐기·발주 기록
- `review-pack`: 리뷰 대응 체크
- `staff-pack`: 알바 온보딩·노무 체크
- `pricing-pack`: 가격 인상 실험 리포트

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest
- 배포 예정: Vercel

## 로컬 실행

```bash
npm install
npm run dev
```

## 검증 명령

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## 제품 카피

- 제품명: 컵마진
- 영문명: CupMargin
- 슬로건: 한 잔 팔면, 진짜 얼마 남을까요?
- GitHub 설명: A lightweight margin notebook for cafe owners.
