# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

리치마작 룰 학습용 모바일 웹 앱. 개요·기능·구조는 @README.md, 점수 트레이너 설계는 @docs/score-trainer-plan.md 참고.

## 명령

- `npm run dev` — 개발 서버 (포트 5175 고정)
- `npm test` — vitest 1회 실행 (채점 엔진 골든 케이스 + 생성기 합법성 + 스모크)
- `npm run build` — `tsc --noEmit` 타입 검사 후 vite 빌드. 빌드는 타입 에러가 있으면 실패한다.
- `npm run lint` — ESLint (flat config: typescript-eslint + react-hooks)
- 단일 테스트: `npx vitest run -t '<테스트명>'`

## 아키텍처

- `src/core/` 는 UI에 의존하지 않는 순수 로직이다. React/DOM을 import하지 말 것.
- `src/features/` 화면, `src/components/` 패 렌더링, `src/App.tsx` 라우팅.
- `core/generator.ts` 는 문제를 만든 뒤 `core/score.ts` 채점 엔진으로 검증해 불가능한 케이스를 차단한다. 생성기를 고칠 때 이 검증 경로를 깨지 않도록 한다.
- `core/yakuData.ts`(역 목록 화면용 정적 데이터)는 `core/score.ts`가 인정하는 역과 일치해야 한다. 한쪽을 바꾸면 다른 쪽도 맞춘다.

## 도메인 규칙 (의도적 차이 — 버그 아님)

작혼 룰 기준이되 아래는 의도적으로 다르게 구현되어 있다. "수정"하지 말 것:

- 뒷도라 미적용 (입력 정보만으로 답이 정해지도록)
- 키리아게 만관 미적용 (4판 30부 = 7700 그대로)
- 상황역(하이테이·천화 등)은 엔진만 구현하고 출제에서는 제외
- 고점법 채택, 0본장 고정

## 스타일

- prettier 설정(`.prettierrc.json`): 4-space 들여쓰기, single quote, printWidth 100. 커밋 전 `npm run format`.
- TypeScript strict, `noUnusedLocals`/`noUnusedParameters` 활성 — 미사용 변수·인자는 빌드 에러가 된다.
- 사용자에게 보이는 텍스트(UI 문구 등)는 한국어로 작성한다.
