"use client";

import { useState } from "react";
import type { SearchResponse } from "@/lib/searchPipeline";

export default function Home() {
  const [query, setQuery] = useState("프리미엄 검색 API 직접 만들기");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch(fixture = false) {
    setLoading(true);
    setError(null);
    setData(null);
    const qs = new URLSearchParams({ q: query });
    if (fixture) qs.set("fixture", "1");
    const res = await fetch(`/api/search?${qs.toString()}`);
    const payload = await res.json();
    if (!res.ok) setError(payload.error ?? "검색에 실패했습니다.");
    else setData(payload);
    setLoading(false);
  }

  return (
    <main>
      <section className="hero">
        <div className="badge">Bright Data SERP API × 프리미엄 검색 API</div>
        <h1>비싼 프리미엄 검색 API, 직접 조립하면 구조가 보입니다.</h1>
        <p>
          LLM 쿼리 확장 → Bright Data SERP API 팬아웃 호출 → URL/도메인 중복 제거 →
          RRF·커버리지·도메인 다양성 기반 리랭킹 → JSON API 반환까지 한 화면에서 보여주는 데모입니다.
        </p>
        <div className="pipeline">
          <span>쿼리 확장</span><span>SERP 수집</span><span>중복 제거</span><span>리랭킹</span><span>/api/search JSON</span>
        </div>
      </section>

      <section className="card">
        <h2>실시간 검색 테스트</h2>
        <p>
          프로덕션에서는 Vercel 환경 변수의 Bright Data API 키로 실제 SERP API를 호출합니다.
          fixture 버튼은 촬영/오프라인 확인용이며 제출용 라이브 데모 기준은 아닙니다.
        </p>
        <div className="searchBox">
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="검색어" />
          <button disabled={loading} onClick={() => runSearch(false)}>실제 SERP 호출</button>
          <button disabled={loading} onClick={() => runSearch(true)}>fixture 미리보기</button>
        </div>
        {loading && <p>Bright Data SERP API 호출 중입니다…</p>}
        {error && <p className="warning">{error}</p>}
      </section>

      {data && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>검색 API 결과</h2>
          <div className="grid">
            <div className="metric"><strong>{data.mode}</strong><span>실행 모드</span></div>
            <div className="metric"><strong>{data.resultCount}</strong><span>리랭킹 결과 수</span></div>
            <div className="metric"><strong>{data.uniqueDomains}</strong><span>고유 도메인</span></div>
          </div>
          {data.note && <p className="warning">{data.note}</p>}
          <h3>확장된 쿼리</h3>
          <pre>{JSON.stringify(data.expandedQueries, null, 2)}</pre>
          <div className="results">
            {data.results.map((item) => (
              <article className="result" key={item.url}>
                <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                <p>{item.description}</p>
                <div className="meta">
                  {item.domain} · source: {item.sourceQuery} · <span className="score">score {item.score}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
