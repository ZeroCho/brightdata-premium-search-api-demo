"use client";
import { useState } from "react";

export default function DocsSearchPage() {
  const [q, setQ] = useState("Next.js App Router에서 Stripe 웹훅 처리할 때 주의할 점 알려줘.");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true); setError(""); setData(null);
    const r = await fetch(`/api/docs-search?q=${encodeURIComponent(q)}`);
    const d = await r.json();
    if (!r.ok) setError(d.error || "실패"); else setData(d);
    setLoading(false);
  }
  return <main><section className="hero"><div className="badge">Bright Data SERP API · LIVE MODE</div><h1>공식문서 우선 프리미엄 검색 API</h1><p>개발 질문을 여러 검색어로 확장하고, 구글 SERP 결과를 공식문서/GitHub/최신성 기준으로 리랭킹합니다.</p></section><section className="card"><h2>개발 질문 입력</h2><div className="searchBox"><input value={q} onChange={(e)=>setQ(e.target.value)} /><button disabled={loading} onClick={run}>공식문서 우선 검색</button></div>{loading && <p>Bright Data SERP API 호출 중…</p>}{error && <p className="warning">{error}</p>}</section>{data && <section className="card" style={{marginTop:18}}><h2>검색 결과</h2><div className="grid"><div className="metric"><strong>{data.successfulQueries}</strong><span>성공 쿼리</span></div><div className="metric"><strong>{data.resultCount}</strong><span>결과</span></div><div className="metric"><strong>{data.uniqueDomains}</strong><span>고유 도메인</span></div></div><h3>확장 쿼리</h3><pre>{JSON.stringify(data.expandedQueries,null,2)}</pre>{data.results.map((x:any)=><article className="result" key={x.url}><a href={x.url} target="_blank">{x.title}</a><p>{x.snippet}</p><div className="meta">{x.domain} · {x.type} · score {x.score} · {x.reasons.join(", ")}</div></article>)}</section>}</main>;
}
