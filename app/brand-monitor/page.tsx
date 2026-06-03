"use client";
import { useState } from "react";

function list(items: any[]) {
  return items?.length ? (
    <div className="results">
      {items.map((x: any) => (
        <article className="result" key={x.url}>
          <a href={x.url} target="_blank" rel="noreferrer">{x.currentRank || x.rank}위 · {x.title}</a>
          <div className="meta">{x.domain} · {x.category}{x.previousRank ? ` · ${x.previousRank}위 → ${x.currentRank}위` : ""}</div>
        </article>
      ))}
    </div>
  ) : <p>변화 없음</p>;
}

export default function BrandMonitorPage() {
  const [q, setQ] = useState("ZeroChoTV AI coding tools");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(action: string) {
    setLoading(true);
    setError("");
    setData(null);
    const r = await fetch(`/api/brand-monitor?action=${action}&q=${encodeURIComponent(q)}`);
    const d = await r.json();
    if (!r.ok) setError(d.error || "실패");
    else setData(d);
    setLoading(false);
  }

  return (
    <main>
      <section className="hero">
        <div className="badge">zerocho.dev · monitoring thread</div>
        <h1>검색 결과가 어제랑 뭐가 달라졌는지 봅니다.</h1>
        <p>브랜드나 경쟁사 키워드를 구글 SERP로 가져오고, 이전 스냅샷과 비교합니다.</p>
      </section>

      <section className="card">
        <h2>모니터링 키워드</h2>
        <div className="searchBox">
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="모니터링 키워드" />
          <button disabled={loading} onClick={() => run("compare")}>비교</button>
          <button disabled={loading} onClick={() => run("save")}>저장</button>
        </div>
        {loading && <p>모니터링 스레드 작성 중…</p>}
        {error && <p className="warning">{error}</p>}
      </section>

      {data && (
        <section className="card">
          <h2>변화 요약</h2>
          <div className="grid">
            <div className="metric"><strong>{data.resultCount}</strong><span>current</span></div>
            <div className="metric"><strong>{data.uniqueDomains}</strong><span>domains</span></div>
            <div className="metric"><strong>{data.previousSnapshotAt ? "있음" : "없음"}</strong><span>previous</span></div>
          </div>
          <p>신규 {data.diff.newlyFound.length} · 사라짐 {data.diff.disappeared.length} · 상승 {data.diff.movedUp.length} · 하락 {data.diff.movedDown.length}</p>
          <h3>새로 등장</h3>{list(data.diff.newlyFound)}
          <h3>사라짐</h3>{list(data.diff.disappeared)}
          <h3>순위 상승</h3>{list(data.diff.movedUp)}
          <h3>순위 하락</h3>{list(data.diff.movedDown)}
          <h3>현재 상위 결과</h3>
          <div className="results">
            {data.topResults.map((x: any) => (
              <article className="result" key={x.url}>
                <a href={x.url} target="_blank" rel="noreferrer">{x.rank}위 · {x.title}</a>
                <p>{x.snippet}</p>
                <div className="meta">{x.domain} · {x.category}</div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
