"use client";

import { useState } from "react";

type Props = {
  vertical: "dev-error" | "travel" | "product";
  badge: string;
  title: string;
  description: string;
  defaultQuery: string;
  examples: string[];
};

function ResultList({ title, items, showScore = false }: { title: string; items: any[]; showScore?: boolean }) {
  return <>
    <h3>{title}</h3>
    <div className="results">
      {(items ?? []).slice(0, 12).map((x: any, i: number) => (
        <article className="result" key={`${title}-${x.url}-${i}`}>
          <a href={x.url} target="_blank" rel="noreferrer">{x.title}</a>
          <p>{x.description || x.snippet}</p>
          <div className="meta">{x.domain} · {x.category} · query: {x.sourceQuery}{showScore ? ` · score ${x.score}` : ""}</div>
        </article>
      ))}
    </div>
  </>;
}

export default function ResearchLab(props: Props) {
  const [q, setQ] = useState(props.defaultQuery);
  const [research, setResearch] = useState(true);
  const [engine, setEngine] = useState("google");
  const [gl, setGl] = useState("kr");
  const [hl, setHl] = useState("ko");
  const [limit, setLimit] = useState(12);
  const [include, setInclude] = useState("");
  const [exclude, setExclude] = useState("");
  const [fixture, setFixture] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true); setError(""); setData(null);
    const qs = new URLSearchParams({
      vertical: props.vertical,
      q,
      research: research ? "1" : "0",
      engine,
      gl,
      hl,
      limit: String(limit),
      include,
      exclude,
    });
    if (fixture) qs.set("fixture", "1");
    const res = await fetch(`/api/research?${qs}`);
    const payload = await res.json();
    if (!res.ok) setError(payload.error || "실패");
    else setData(payload);
    setLoading(false);
  }

  return <main>
    <section className="hero">
      <div className="badge">{props.badge}</div>
      <h1>{props.title}</h1>
      <p>{props.description}</p>
      <div className="pipeline"><span>raw SERP</span><span>domain clustering</span><span>dedupe</span><span>filters</span><span>fanout research</span><span>RRF/BM25-lite</span></div>
    </section>

    <section className="card">
      <h2>입력</h2>
      <div className="searchBox"><input value={q} onChange={(e)=>setQ(e.target.value)} /><button disabled={loading} onClick={run}>파이프라인 실행</button></div>
      <div className="pipeline">{props.examples.map((x)=><button type="button" className="chipButton" key={x} onClick={()=>setQ(x)}>{x}</button>)}</div>
    </section>

    <section className="card">
      <h2>필터 / 토글</h2>
      <div className="controlGrid">
        <label><span>리서치 모드</span><select value={research ? "1" : "0"} onChange={(e)=>setResearch(e.target.value === "1")}><option value="1">팬아웃 쿼리 확장 ON</option><option value="0">단일 쿼리</option></select></label>
        <label><span>엔진</span><select value={engine} onChange={(e)=>setEngine(e.target.value)}><option value="google">Google</option><option value="bing">Bing</option></select></label>
        <label><span>지역</span><select value={gl} onChange={(e)=>setGl(e.target.value)}><option value="kr">KR</option><option value="us">US</option><option value="jp">JP</option></select></label>
        <label><span>언어</span><select value={hl} onChange={(e)=>setHl(e.target.value)}><option value="ko">ko</option><option value="en">en</option><option value="ja">ja</option></select></label>
        <label><span>결과 개수</span><input type="number" min={3} max={30} value={limit} onChange={(e)=>setLimit(Number(e.target.value))} /></label>
        <label><span>fixture</span><select value={fixture ? "1" : "0"} onChange={(e)=>setFixture(e.target.value === "1")}><option value="0">실제 Bright Data</option><option value="1">샘플</option></select></label>
      </div>
      <div className="searchBox"><input placeholder="포함 도메인: react.dev, github.com" value={include} onChange={(e)=>setInclude(e.target.value)} /><input placeholder="제외 도메인: pinterest.com, facebook.com" value={exclude} onChange={(e)=>setExclude(e.target.value)} /></div>
      {loading && <p>raw SERP부터 다시 계산 중…</p>}
      {error && <p className="warning">{error}</p>}
    </section>

    {data && <>
      <section className="card">
        <h2>중간 결과 요약</h2>
        <div className="grid"><div className="metric"><strong>{data.rawCount}</strong><span>raw</span></div><div className="metric"><strong>{data.dedupedCount}</strong><span>deduped</span></div><div className="metric"><strong>{data.filteredCount}</strong><span>filtered</span></div></div>
        <h3>팬아웃 쿼리</h3><pre>{JSON.stringify(data.fanoutQueries, null, 2)}</pre>
        <h3>원리</h3>{data.explanation.map((x: string)=><p key={x}>{x}</p>)}
      </section>

      <section className="card">
        <h2>도메인 클러스터링</h2>
        <div className="clusterGrid">{data.domainClusters.map((c:any)=><div className="cluster" key={c.domain}><strong>{c.domain}</strong><span>{c.count}개 · {c.category}</span></div>)}</div>
      </section>

      <section className="card"><ResultList title="1. Raw 결과" items={data.rawResults} /></section>
      <section className="card"><ResultList title="2. 중복 제거 후" items={data.dedupedResults} /></section>
      <section className="card"><ResultList title="3. 필터 적용 후" items={data.filteredResults} /></section>
      <section className="card"><ResultList title="4. RRF/BM25-lite 리랭킹" items={data.rerankedResults} showScore /></section>
    </>}
  </main>;
}
