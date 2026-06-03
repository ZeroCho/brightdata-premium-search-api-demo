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

function scoreReasons(x: any) {
  const s = x.signals ?? {};
  const reasons = [];
  if ((s.rrf ?? 0) > 0.014) reasons.push("SERP 상위권");
  if ((s.bm25Lite ?? 0) >= 0.25) reasons.push("질문 단어 일치");
  if ((s.verticalBoost ?? 0) > 0) reasons.push(`${x.category} 가중치`);
  if ((s.domainDiversity ?? 0) >= 1) reasons.push("도메인 다양성");
  if ((s.penalty ?? 0) > 0) reasons.push("광고/소셜 감점");
  return reasons.slice(0, 4);
}

function ResultList({ title, items, showScore = false, highlight = false }: { title: string; items: any[]; showScore?: boolean; highlight?: boolean }) {
  return <>
    <h3>{title}</h3>
    <div className={highlight ? "results finalResults" : "results"}>
      {(items ?? []).slice(0, highlight ? 8 : 12).map((x: any, i: number) => (
        <article className={highlight ? `result finalResult rank${i + 1}` : "result"} key={`${title}-${x.url}-${i}`}>
          {highlight && <div className="rankBadge">#{i + 1}</div>}
          <a href={x.url} target="_blank" rel="noreferrer">{x.title}</a>
          <p>{x.description || x.snippet}</p>
          {highlight && <div className="reasonChips">{scoreReasons(x).map((r) => <span key={r}>{r}</span>)}</div>}
          <div className="meta">
            {x.domain} · {x.category} · query: {x.sourceQuery}
            {showScore ? <><br /><span className="score">score {x.score}</span> <span> = RRF {(x.signals?.rrf ?? 0).toFixed(4)}×45 + BM25-lite {(x.signals?.bm25Lite ?? 0).toFixed(2)}×25 + 다양성 {(x.signals?.domainDiversity ?? 0).toFixed(2)}×12 + 출처가중치 {(x.signals?.verticalBoost ?? 0).toFixed(2)}×45 - 페널티 {(x.signals?.penalty ?? 0).toFixed(2)}×40</span></> : ""}
          </div>
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
      <section className="card finalCard">
        <h2>최종 결과: 리랭킹 후 우선순위</h2>
        <p>아래가 실제로 사용자에게 먼저 보여줄 후보입니다. 단순 검색순위가 아니라 RRF, 질문 단어 매칭, 도메인 다양성, 버티컬별 출처 가중치, 페널티를 합쳐 다시 정렬했습니다.</p>
        <ResultList title="하이라이트 결과" items={data.rerankedResults} showScore highlight />
      </section>

      <section className="card">
        <h2>중간 결과 요약</h2>
        <div className="grid"><div className="metric"><strong>{data.rawCount}</strong><span>raw</span></div><div className="metric"><strong>{data.dedupedCount}</strong><span>deduped</span></div><div className="metric"><strong>{data.filteredCount}</strong><span>filtered</span></div></div>
        <h3>팬아웃 쿼리</h3><pre>{JSON.stringify(data.fanoutQueries, null, 2)}</pre>
        <h3>리랭킹 원리</h3>
        <div className="formulaBox">
          <strong>최종점수 = RRF×45 + BM25-lite×25 + 도메인다양성×12 + 버티컬출처가중치×45 - 페널티×40</strong>
          <ul>
            <li><b>RRF</b>: 검색엔진 원래 순위가 높을수록 점수를 줍니다. 계산식은 <code>1 / (60 + 원래순위)</code>입니다. 1등은 약 0.0163, 10등은 약 0.0142라서 순위 차이를 완만하게 반영합니다.</li>
            <li><b>BM25-lite</b>: 진짜 BM25 전체 구현은 아니고, 질문 토큰이 제목/설명/도메인에 얼마나 겹치는지 본 간단 버전입니다. <code>겹친 질문 단어 수 / 질문 단어 수</code>입니다.</li>
            <li><b>도메인 다양성</b>: 같은 도메인이 너무 많이 몰리면 점수를 낮춥니다. <code>1 / 해당 도메인 결과 수</code>입니다.</li>
            <li><b>버티컬 출처 가중치</b>: 개발자 에러는 공식문서/GitHub/Q&A, 여행은 예약·리뷰/블로그/커뮤니티, 제품은 커뮤니티/후기/쇼핑/영상에 가산점을 줍니다.</li>
            <li><b>페널티</b>: 광고성 URL, 소셜/핀터레스트류처럼 리서치 품질이 낮은 출처는 감점합니다.</li>
          </ul>
        </div>
        <h3>파이프라인 설명</h3>{data.explanation.map((x: string)=><p key={x}>{x}</p>)}
      </section>

      <section className="card">
        <h2>도메인 클러스터링</h2>
        <div className="clusterGrid">{data.domainClusters.map((c:any)=><div className="cluster" key={c.domain}><strong>{c.domain}</strong><span>{c.count}개 · {c.category}</span></div>)}</div>
      </section>

      <section className="card"><ResultList title="1. Raw 결과" items={data.rawResults} /></section>
      <section className="card"><ResultList title="2. 중복 제거 후" items={data.dedupedResults} /></section>
      <section className="card"><ResultList title="3. 필터 적용 후" items={data.filteredResults} /></section>
      <section className="card"><ResultList title="4. 리랭킹 상세: 전체 후보 점수" items={data.rerankedResults} showScore /></section>
    </>}
  </main>;
}
