# Bright Data 프리미엄 검색 API 데모

Bright Data SERP API로 실제 구글 검색 결과를 가져오고, 쿼리 확장/중복 제거/리랭킹을 거쳐 AI 앱용 JSON 검색 API로 만드는 Next.js App Router + TypeScript 데모입니다.

## Live Demo

- VPS preview: http://76.13.187.180:3117
- API endpoint: `/api/search?q=React%2019%20폼%20처리`
- Vercel: GitHub/Vercel 인증 후 입력 예정

## Search Pipeline Labs

- 1. 개발자 에러 검색 엔진: `/dev-error-search`
- 2. 전자제품 실사용 후기 검색 엔진: `/product-search`
- 3. 취업/이직 회사 평판 검색 엔진: `/company-search`

## Related Demo Variants

- 공식문서 우선 검색 API: `/docs-search`
- 브랜드/경쟁사 모니터링: `/brand-monitor`

## GitHub Repository

- Public GitHub repo: GitHub 인증 후 생성 예정

## 핵심 기능

- 검색어를 여러 쿼리로 확장
- Bright Data SERP API 팬아웃 호출
- URL 정규화 및 중복 제거
- 도메인 다양성, 쿼리 커버리지, RRF, BM25-lite 신호 기반 리랭킹
- `/api/search`에서 최종 JSON 반환
- UI에서 결과와 점수 표시

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저: `http://localhost:3000`

## Bright Data API 키 설정

1. Bright Data 콘솔 로그인: https://brightdata.com/cp/start
2. SERP API zone 생성: https://brightdata.com/cp/learn_more/serp-api
3. API key 발급
4. `.env.local` 또는 Vercel Environment Variables에 설정

```bash
BRIGHT_DATA_API_KEY=your_bright_data_api_key
BRIGHT_DATA_SERP_ZONE=serp_api1
```

## Vercel 배포

```bash
npm install -g vercel
vercel login
vercel env add BRIGHT_DATA_API_KEY production
vercel env add BRIGHT_DATA_SERP_ZONE production
vercel --prod
```

## Mock/fixture 주의

`DEMO_MODE=fixture` 또는 `/api/search?fixture=1`은 오프라인 확인용입니다. 제출용 라이브 데모는 런타임에서 Bright Data SERP API를 실제 호출해야 합니다.

## 광고 고지 예시

> 이 영상은 Bright Data의 지원을 받아 제작되었습니다. 다만 영상 내용은 실제 개발 관점에서 직접 구현하고 확인한 내용을 중심으로 구성했습니다.
