# Bright Data 프리미엄 검색 API 데모

Bright Data SERP API로 흔히 말하는 “프리미엄 검색 API”의 핵심 파이프라인을 직접 조립한 Next.js App Router + TypeScript 예제입니다.

## Live Demo

- Vercel: 배포 후 URL 입력
- API endpoint: `/api/search?q=프리미엄%20검색%20API`

## GitHub Repository

- Public GitHub repo: 생성 후 URL 입력

## 핵심 기능

- LLM/에이전트 검색 API에서 자주 쓰는 쿼리 확장 흐름을 코드로 단순화
- Bright Data SERP API 팬아웃 호출
- URL 정규화 및 중복 제거
- 도메인 다양성, 쿼리 커버리지, RRF, BM25-lite 신호 기반 리랭킹
- `/api/search`에서 최종 JSON 반환
- UI에서 검색 결과와 리랭킹 점수 표시

## 로컬 실행 방법

```bash
npm install
cp .env.example .env.local
# .env.local에 Bright Data 값 입력
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## Bright Data API 키 설정 방법

1. Bright Data 콘솔에 로그인합니다: https://brightdata.com/cp/start
2. SERP API zone을 생성합니다: https://brightdata.com/cp/learn_more/serp-api
3. API key를 발급합니다.
4. `.env.local` 또는 Vercel Environment Variables에 아래 값을 설정합니다.

```bash
BRIGHT_DATA_API_KEY=your_bright_data_api_key
BRIGHT_DATA_SERP_ZONE=serp_api1
```

## Vercel 배포 방법

```bash
npm install -g vercel
vercel login
vercel env add BRIGHT_DATA_API_KEY production
vercel env add BRIGHT_DATA_SERP_ZONE production
vercel --prod
```

배포 후 README의 Live Demo URL을 실제 URL로 바꿉니다.

## Mock/fixture 관련 주의

`DEMO_MODE=fixture` 또는 `/api/search?fixture=1`은 API 키가 없는 촬영/오프라인 확인용입니다.
협업 제출용 라이브 데모는 이 모드를 쓰면 안 됩니다. 프로덕션 Vercel 환경에서는 `BRIGHT_DATA_API_KEY`와 `BRIGHT_DATA_SERP_ZONE`을 설정해서 런타임에서 Bright Data SERP API를 실제 호출해야 합니다.

## 광고 고지 예시

> 이 영상은 Bright Data의 지원을 받아 제작되었습니다. 다만 영상 내용은 실제 개발 관점에서 직접 구현하고 확인한 내용을 중심으로 구성했습니다.
