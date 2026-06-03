"use client";

import { useState } from "react";
import type { SearchResponse } from "@/lib/searchPipeline";

export default function Home() {
  const [query, setQuery] = useState("React 19에서 폼 처리 방식이 어떻게 바뀌었는지 공식 문서 기준으로 정리해줘");
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
        <div className="badge">zerocho.dev · live search thread</div>
        <h1>AI 검색 API, 안에서 뭐 하는지 직접 까봅니다.</h1>
        <p>질문 하나를 공식문서용 영어 검색어로 바꾸고, 실제 구글 SERP를 가져와서 중복 제거와 리랭킹까지 돌립니다.</p>
        <div className="pipeline">
          <span>query expansion</span><span>Google SERP</span><span>dedupe</span><span>rerank</span><span>JSON API</span>
        </div>
      </section>

      <section className="card">
        <h2>검색어</h2>
        <p>버튼을 눌렀을 때만 Bright Data SERP API를 호출합니다.</p>
        <div className="searchBox">
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="검색어" />
          <button disabled={loading} onClick={() => runSearch(false)}>실제 호출</button>
          <button disabled={loading} onClick={() => runSearch(true)}>샘플 보기</button>
        </div>
        {loading && <p>검색 스레드 작성 중…</p>}
        {error && <p className="warning">{error}</p>}
      </section>

      {data && (
        <section className="card">
          <h2>검색 스레드</h2>
          <div className="grid">
            <div className="metric"><strong>{data.mode}</strong><span>mode</span></div>
            <div className="metric"><strong>{data.resultCount}</strong><span>results</span></div>
            <div className="metric"><strong>{data.uniqueDomains}</strong><span>domains</span></div>
          </div>
          {data.note && <p className="warning">{data.note}</p>}
          <h3>확장 쿼리</h3>
          <pre>{JSON.stringify(data.expandedQueries, null, 2)}</pre>
          <div className="results">
            {data.results.map((item) => (
              <article className="result" key={item.url}>
                <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                <p>{item.description}</p>
                <div className="meta">
                  {item.domain} · {item.sourceQuery} · <span className="score">score {item.score}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
