"use client";
import { useState } from "react";

function list(items:any[]) { return items?.length ? <ul>{items.map((x:any)=><li key={x.url}><a href={x.url} target="_blank">{x.currentRank || x.rank}위 · {x.title}</a><div className="meta">{x.domain} · {x.category}{x.previousRank ? ` · 이전 ${x.previousRank}위 → 현재 ${x.currentRank}위` : ""}</div></li>)}</ul> : <p>없음</p>; }

export default function BrandMonitorPage() {
  const [q, setQ] = useState("ZeroChoTV AI coding tools");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function run(action:string) {
    setLoading(true); setError(""); setData(null);
    const r = await fetch(`/api/brand-monitor?action=${action}&q=${encodeURIComponent(q)}`);
    const d = await r.json();
    if (!r.ok) setError(d.error || "실패"); else setData(d);
    setLoading(false);
  }
  return <main><section className="hero"><div className="badge">Bright Data SERP API · LIVE MODE</div><h1>브랜드/경쟁사 모니터링</h1><p>현재 구글 SERP를 저장하고 이전 스냅샷과 비교해 신규 등장, 사라짐, 순위 변화를 보여줍니다.</p></section><section className="card"><h2>키워드 입력</h2><div className="searchBox"><input value={q} onChange={(e)=>setQ(e.target.value)} /><button disabled={loading} onClick={()=>run("compare")}>비교</button><button disabled={loading} onClick={()=>run("save")}>저장</button></div>{loading && <p>Bright Data SERP API 호출 중…</p>}{error && <p className="warning">{error}</p>}</section>{data && <section className="card" style={{marginTop:18}}><h2>모니터링 결과</h2><div className="grid"><div className="metric"><strong>{data.resultCount}</strong><span>현재 결과</span></div><div className="metric"><strong>{data.uniqueDomains}</strong><span>고유 도메인</span></div><div className="metric"><strong>{data.previousSnapshotAt ? "있음" : "없음"}</strong><span>이전 스냅샷</span></div></div><p>신규 {data.diff.newlyFound.length} · 사라짐 {data.diff.disappeared.length} · 상승 {data.diff.movedUp.length} · 하락 {data.diff.movedDown.length}</p><h3>새로 등장</h3>{list(data.diff.newlyFound)}<h3>사라짐</h3>{list(data.diff.disappeared)}<h3>순위 상승</h3>{list(data.diff.movedUp)}<h3>순위 하락</h3>{list(data.diff.movedDown)}<h3>현재 상위 결과</h3>{data.topResults.map((x:any)=><article className="result" key={x.url}><a href={x.url} target="_blank">{x.rank}위 · {x.title}</a><p>{x.snippet}</p><div className="meta">{x.domain} · {x.category}</div></article>)}</section>}</main>;
}
