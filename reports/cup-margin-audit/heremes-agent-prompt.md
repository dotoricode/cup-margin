# Heremes Agent 개선 작업 프롬프트

당신은 `/Users/youngsang.kwon/01_private/cup-margin` 저장소를 개선하는 구현 agent입니다. 먼저 `AGENTS.md`를 읽고, Next.js 관련 코드를 수정하기 전에는 현재 설치된 Next 문서 위치를 확인하세요. 이 저장소의 `CONTEXT.md`도 읽어 Cup Margin의 도메인 용어와 이번 검수 결정사항을 따르세요.

## 입력 자료

- 실제 검수 HTML: `reports/cup-margin-audit/index.html`
- 스크린샷: `reports/cup-margin-audit/assets/`
- 원시 도구 결과: `reports/cup-margin-audit/raw/`
- 주 컴포넌트 후보: `src/features/cup-margin/ui/CupMarginLanding.tsx`
- 계산 모델 후보: `src/features/cup-margin/model/calculateMultiMenuMargin.ts`, `src/features/cup-margin/model/copy.ts`

## 작업 범위

첫 개선 패스에서는 HTML 리포트의 P0 항목을 전부 구현하고, P1 중 2-3개만 선택해 구현하세요. P2는 코드로 만들지 말고 설계 메모 또는 TODO 수준으로 남기세요.

## 구현 우선순위

1. P0-1: `/calculator` 첫 진입을 9개 샘플 입력 나열이 아니라 “한 메뉴 직접 입력” 흐름으로 줄이세요. 샘플 9개는 명시적 버튼 뒤로 보내고, P1 사용자에게 처음 보이는 입력 수를 줄이세요.
2. P0-2: 결과 패널의 첫 문장을 “지금 가격 유지 / 인상 검토 / 원가 우선 점검”처럼 의사결정 문장으로 바꾸고, 근거 수식은 접거나 보조 영역으로 배치하세요.
3. P0-3: 개인정보/저장 신뢰 문구를 랜딩 히어로, 계산기 안내, 저장 카드에 일관되게 넣으세요. 핵심은 “계산값은 기본적으로 이 기기에만 저장, 서버 전송 없음, 공유 링크를 만들 때만 URL에 포함”입니다. 실제 구현이 다르면 코드를 확인하고 문구를 맞추세요.
4. P0-4: 접근성/성능 문제를 바로 고치세요. Pa11y와 axe가 지적한 대비 부족 색상, 모바일 input 높이 44px 미만, 모바일 Lighthouse LCP/FCP 지연 원인을 우선 처리하세요.

## P1 후보

- 계산기 상단 카피를 “샘플 카페 기준”보다 “내 메뉴 하나만 바꿔도 결과가 바뀝니다” 중심으로 바꾸기
- 월 운영비 입력 앞에 “모르면 0원으로 시작” 선택지를 제공하기
- 가격 카드의 무료/베이직/스탠다드 차이를 “오늘 계산 / 다음 달 비교 / 여러 매장 비교”로 재정리하기
- 결과 저장 버튼을 “이 기기에 저장하고 링크 복사”로 바꾸고 데이터 포함 범위를 설명하기
- 모바일 하단 sticky 결과바에 다음 행동 버튼 하나만 남기기

## 검증

- `npm run lint`
- `npm run typecheck`
- `npm test`
- 가능하면 `npx pa11y https://cup-margin.vercel.app/calculator --reporter json` 또는 로컬 배포 URL에 대해 동일 검사를 실행하세요.
- 변경 후 모바일 360px, 414px, 데스크탑 1440px 스크린샷을 확인해 텍스트 겹침과 첫 화면 과밀 여부를 점검하세요.

## 완료 보고 형식

- 변경한 파일 목록
- 구현한 P0/P1 항목
- 실행한 검증 명령과 결과
- 남겨둔 P2 설계 메모
