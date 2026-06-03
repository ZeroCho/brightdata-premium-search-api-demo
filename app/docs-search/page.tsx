"use client";
import { useState } from "react";

export default function DocsSearchPage() {
  const [q, setQ] = useState("Next.js App Router에서 Stripe 웹훅 처리할 때 주의할 점 알려줘.");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError("");
    setData(null);
    const r = await fetch(`/api/docs-search?q=${encodeURIComponent(q)}`);
    const d = await r.json();
    if (!r.ok) setError(d.error || "실패");
    else setData(d);
    setLoading(false);
  }

  return (
    <main>
      <section className="hero">
        <div className="badge">zerocho.dev · docs first thread</div>
        <h1>블로그보다 공식문서를 먼저 올리는 검색 API.</h1>
        <p>개발 질문을 여러 쿼리로 바꾼 뒤, 공식문서·공식사이트·GitHub에 더 높은 점수를 줍니다.</p>
      </section>

      <section className="card">
        <h2>개발 질문</h2>
        <div className="searchBox">
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="개발 질문" />
          <button disabled={loading} onClick={run}>검색</button>
        </div>
        {loading && <p>공식문서 스레드 작성 중…</p>}
        {error && <p className="warning">{error}</p>}
      </section>

      {data && (
        <section className="card">
          <h2>공식문서 우선 결과</h2>
          <div className="grid">
            <div className="metric"><strong>{data.successfulQueries}</strong><span>queries</span></div>
            <div className="metric"><strong>{data.resultCount}</strong><span>results</span></div>
            <div className="metric"><strong>{data.uniqueDomains}</strong><span>domains</span></div>
          </div>
          <h3>확장 쿼리</h3>
          <pre>{JSON.stringify(data.expandedQueries, null, 2)}</pre>
          <div className="results">
            {data.results.map((x: any) => (
              <article className="result" key={x.url}>
                <a href={x.url} target="_blank" rel="noreferrer">{x.title}</a>
                <p>{x.snippet}</p>
                <div className="meta">{x.domain} · {x.type} · score {x.score} · {x.reasons.join(", ")}</div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
