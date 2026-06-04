"use client";

import { useState } from "react";

type Props = {
  vertical: "dev-error" | "product" | "company";
  badge: string;
  title: string;
  description: string;
  defaultQuery: string;
  examples: string[];
};

type RerankWeights = {
  rrf: number;
  bm25Lite: number;
  domainDiversity: number;
  verticalBoost: number;
  penalty: number;
};

const DEFAULT_WEIGHTS: RerankWeights = {
  rrf: 45,
  bm25Lite: 25,
  domainDiversity: 12,
  verticalBoost: 45,
  penalty: 40,
};

function formulaText(weights: RerankWeights) {
  return `RRF×${weights.rrf} + BM25-lite×${weights.bm25Lite} + 도메인다양성×${weights.domainDiversity} + 출처가중치×${weights.verticalBoost} - 페널티×${weights.penalty}`;
}

function scoreReasons(x: any) {
  const s = x.signals ?? {};
  const reasons = [];
  if ((s.rrf ?? 0) > 0.014) reasons.push("검색 상위");
  if ((s.bm25Lite ?? 0) >= 0.25) reasons.push("질문과 가까움");
  if ((s.verticalBoost ?? 0) > 0) reasons.push(`${x.category} 가중치`);
  if ((s.domainDiversity ?? 0) >= 1) reasons.push("도메인 분산");
  if ((s.penalty ?? 0) > 0) reasons.push("품질 감점");
  return reasons.slice(0, 4);
}

function ResultList({ title, items, showScore = false, highlight = false, weights = DEFAULT_WEIGHTS }: { title: string; items: any[]; showScore?: boolean; highlight?: boolean; weights?: RerankWeights }) {
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
            {showScore ? <><br /><span className="score">score {x.score}</span> <span> = RRF {(x.signals?.rrf ?? 0).toFixed(4)}×{weights.rrf} + BM25-lite {(x.signals?.bm25Lite ?? 0).toFixed(2)}×{weights.bm25Lite} + 다양성 {(x.signals?.domainDiversity ?? 0).toFixed(2)}×{weights.domainDiversity} + 출처가중치 {(x.signals?.verticalBoost ?? 0).toFixed(2)}×{weights.verticalBoost} - 페널티 {(x.signals?.penalty ?? 0).toFixed(2)}×{weights.penalty}</span></> : ""}
          </div>
        </article>
      ))}
    </div>
  </>;
}

function RemovedList({ title, items, emptyText }: { title: string; items: any[]; emptyText: string }) {
  return <div className="removedPanel">
    <h3>{title}</h3>
    {(items ?? []).length === 0 ? <div className="emptyState">{emptyText}</div> : <div className="removedList">
      {items.map((x: any, i: number) => <article className="removedItem" key={`${title}-${x.url}-${i}`}>
        <strong>{x.title}</strong>
        <p>{x.removedReason}</p>
        <div className="meta">원래 raw {x.rank}위 · {x.domain} · query: {x.sourceQuery}</div>
        {x.keptTitle && <div className="meta">남긴 항목: {x.keptTitle}</div>}
        <code>{x.url}</code>
      </article>)}
    </div>}
  </div>;
}

function RerankChanges({ items }: { items: any[] }) {
  return <div className="rerankList">
    {(items ?? []).length === 0 ? <div className="emptyState">정렬할 결과가 없습니다.</div> : items.slice(0, 12).map((x: any, i: number) => {
      const label = x.rankDelta > 0 ? "상승" : x.rankDelta < 0 ? "하락" : "유지";
      return <article className={`rerankItem ${x.rankDelta > 0 ? "up" : x.rankDelta < 0 ? "down" : "same"}`} key={`${x.url}-${i}`}>
        <strong>{x.title}</strong>
        <div className="rankMove"><span>필터 {x.beforeRank}위</span><b>→</b><span>정렬 {x.afterRank}위</span><em>{label}</em><span>score {x.score}</span></div>
        <p>{x.description || x.snippet}</p>
        <div className="meta">{x.domain} · {x.category} · query: {x.sourceQuery}</div>
      </article>;
    })}
  </div>;
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
  const [데이터, setFixture] = useState(true);
  const [weights, setWeights] = useState<RerankWeights>(DEFAULT_WEIGHTS);
  const [devMode, setDevMode] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function setWeight(key: keyof RerankWeights, value: string) {
    const n = Number(value);
    setWeights((prev) => ({ ...prev, [key]: Number.isFinite(n) ? Math.max(0, Math.min(200, n)) : 0 }));
  }

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
      wRrf: String(weights.rrf),
      wBm25Lite: String(weights.bm25Lite),
      wDomainDiversity: String(weights.domainDiversity),
      wVerticalBoost: String(weights.verticalBoost),
      wPenalty: String(weights.penalty),
    });
    if (데이터) qs.set("데이터", "1");
    const res = await fetch(`/api/research?${qs}`);
    const payload = await res.json();
    if (!res.ok) setError(payload.error || "실패");
    else setData(payload);
    setLoading(false);
  }

  return <div className="researchLab">
    <section className="hero">
      <div className="badge">{props.badge}</div>
      <h1>{props.title}</h1>
      <p>{props.description}</p>
      {devMode && <div className="pipeline"><span>원본 결과</span><span>도메인 묶기</span><span>중복 제거</span><span>필터</span><span>검색어 확장</span><span>점수 계산</span></div>}
    </section>

    <section className="card searchServiceCard">
      <div className="sectionHeader serviceHeader">
        <div>
          <h2>검색</h2>
          <p>{devMode ? "개발자 모드에서는 검색 과정과 점수 계산까지 같이 봅니다." : "질문을 입력하면 정리된 검색 결과만 보여줍니다."}</p>
        </div>
        <button type="button" className={devMode ? "toggleButton active" : "toggleButton"} onClick={() => setDevMode((v) => !v)}>
          {devMode ? "개발자 모드 켜짐" : "개발자 모드"}
        </button>
      </div>
      <div className="searchBox"><input value={q} onChange={(e)=>setQ(e.target.value)} /><button disabled={loading} onClick={run}>{loading ? "검색 중…" : "검색"}</button></div>
      {devMode && <div className="pipeline">{props.examples.map((x)=><button type="button" className="chipButton" key={x} onClick={()=>setQ(x)}>{x}</button>)}</div>}
      {loading && <p>검색 결과를 정리하는 중…</p>}
      {error && <p className="warning">{error}</p>}
    </section>

    {devMode && <section className="card">
      <h2>옵션</h2>
      <div className="controlGrid">
        <label><span>리서치 모드</span><select value={research ? "1" : "0"} onChange={(e)=>setResearch(e.target.value === "1")}><option value="1">검색어 확장</option><option value="0">한 번만 검색</option></select></label>
        <label><span>엔진</span><select value={engine} onChange={(e)=>setEngine(e.target.value)}><option value="google">Google</option><option value="bing">Bing</option></select></label>
        <label><span>지역</span><select value={gl} onChange={(e)=>setGl(e.target.value)}><option value="kr">KR</option><option value="us">US</option><option value="jp">JP</option></select></label>
        <label><span>언어</span><select value={hl} onChange={(e)=>setHl(e.target.value)}><option value="ko">ko</option><option value="en">en</option><option value="ja">ja</option></select></label>
        <label><span>표시 개수</span><input type="number" min={3} max={30} value={limit} onChange={(e)=>setLimit(Number(e.target.value))} /></label>
        <label><span>데이터</span><select value={데이터 ? "1" : "0"} onChange={(e)=>setFixture(e.target.value === "1")}><option value="0">실제 API</option><option value="1">샘플 데이터</option></select></label>
      </div>
      <div className="searchBox"><input placeholder="포함할 도메인" value={include} onChange={(e)=>setInclude(e.target.value)} /><input placeholder="뺄 도메인" value={exclude} onChange={(e)=>setExclude(e.target.value)} /></div>
    </section>}

    {devMode && <section className="card weightCard">
      <div className="sectionHeader">
        <div>
          <h2>점수 조절</h2>
          <p>숫자를 바꾸고 다시 돌리면 순위가 달라집니다.</p>
        </div>
        <button type="button" className="secondaryButton" onClick={() => setWeights(DEFAULT_WEIGHTS)}>초기화</button>
      </div>
      <div className="weightGrid">
        <label><span>RRF</span><input type="number" min={0} max={200} step={1} value={weights.rrf} onChange={(e)=>setWeight("rrf", e.target.value)} /></label>
        <label><span>BM25-lite</span><input type="number" min={0} max={200} step={1} value={weights.bm25Lite} onChange={(e)=>setWeight("bm25Lite", e.target.value)} /></label>
        <label><span>도메인 분산</span><input type="number" min={0} max={200} step={1} value={weights.domainDiversity} onChange={(e)=>setWeight("domainDiversity", e.target.value)} /></label>
        <label><span>출처 가중치</span><input type="number" min={0} max={200} step={1} value={weights.verticalBoost} onChange={(e)=>setWeight("verticalBoost", e.target.value)} /></label>
        <label><span>페널티</span><input type="number" min={0} max={200} step={1} value={weights.penalty} onChange={(e)=>setWeight("penalty", e.target.value)} /></label>
      </div>
      <div className="formulaPreview"><strong>점수식</strong><code>score = {formulaText(weights)}</code></div>
    </section>}

    {data && <>
      <section className="card finalCard">
        <h2>{devMode ? "먼저 볼 결과" : "검색 결과"}</h2>
        <p>{devMode ? "구글 순서 그대로가 아니라, 이 서비스 기준으로 다시 정렬한 결과입니다." : "가장 관련 높은 결과부터 정리했습니다."}</p>
        <ResultList title={devMode ? "추천 결과" : "결과"} items={data.rerankedResults} showScore={devMode} highlight={devMode} weights={data.params?.weights ?? weights} />
      </section>

      {devMode && <>
      <section className="card">
        <h2>1. 원본 결과</h2>
        <p>Bright Data SERP API에서 가져온 원재료입니다. 아직 중복 제거, 필터, 점수 계산을 적용하지 않은 상태입니다.</p>
        <div className="grid"><div className="metric"><strong>{data.rawCount}</strong><span>원본 결과</span></div><div className="metric"><strong>{data.fanoutQueries?.length ?? 0}</strong><span>확장 검색어</span></div><div className="metric"><strong>{data.domainClusters?.length ?? 0}</strong><span>도메인 묶음</span></div></div>
        <h3>확장된 검색어</h3><pre>{JSON.stringify(data.fanoutQueries, null, 2)}</pre>
        <h3>도메인별 묶음</h3>
        <div className="clusterGrid">{data.domainClusters.map((c:any)=><div className="cluster" key={c.domain}><strong>{c.domain}</strong><span>{c.count}개 · {c.category}</span></div>)}</div>
        <ResultList title="원본 목록" items={data.rawResults} />
      </section>

      <section className="card">
        <h2>2. 중복 제거</h2>
        <p>같은 URL, UTM만 다른 URL, 같은 글로 보이는 결과를 합친 단계입니다.</p>
        <div className="grid"><div className="metric"><strong>{data.rawCount}</strong><span>중복 제거 전</span></div><div className="metric"><strong>{data.dedupedCount}</strong><span>중복 제거 후</span></div><div className="metric"><strong>{(data.dedupeRemoved ?? []).length}</strong><span>중복으로 제외</span></div></div>
        <RemovedList title="중복으로 뺀 결과" items={data.dedupeRemoved ?? []} emptyText="중복 없음" />
        <ResultList title="중복 제거 후 목록" items={data.dedupedResults} />
      </section>

      <section className="card">
        <h2>3. 필터 적용</h2>
        <p>포함/제외 도메인, 광고성 결과, 품질 낮은 출처를 걸러낸 단계입니다.</p>
        <div className="grid"><div className="metric"><strong>{data.dedupedCount}</strong><span>필터 전</span></div><div className="metric"><strong>{data.filteredCount}</strong><span>필터 후</span></div><div className="metric"><strong>{(data.filterRemoved ?? []).length}</strong><span>필터로 제외</span></div></div>
        <RemovedList title="필터로 뺀 결과" items={data.filterRemoved ?? []} emptyText="필터 제외 없음" />
        <ResultList title="필터 적용 후 목록" items={data.filteredResults} />
      </section>

      <section className="card">
        <h2>4. 점수 상세</h2>
        <p>필터를 통과한 결과에 RRF, BM25-lite, 도메인 분산, 출처 가중치, 페널티를 적용해서 최종 순서를 정합니다.</p>
        <div className="formulaBox">
          <strong>최종점수 = {formulaText(data.params?.weights ?? weights)}</strong>
          <p className="muted">기본값은 RRF 45, BM25-lite 25, 도메인 분산 12, 출처 가중치 45, 페널티 40입니다. 위 입력값을 바꾸고 다시 실행하면 같은 원본 결과라도 정렬 순서가 달라집니다.</p>
          <ul>
            <li><b>RRF</b>: 원래 검색 순위도 반영합니다. 계산은 <code>1 / (60 + 원래순위)</code>입니다.</li>
            <li><b>BM25-lite</b>: 제목과 설명에 질문 단어가 얼마나 겹치는지 봅니다. <code>겹친 질문 단어 수 / 질문 단어 수</code>입니다.</li>
            <li><b>도메인 분산</b>: 한 도메인이 결과를 독점하지 않게 조절합니다. <code>1 / 해당 도메인 결과 수</code>입니다.</li>
            <li><b>버티컬 출처 가중치</b>: 데모별로 믿을 만한 출처를 다르게 봅니다. 에러는 공식문서/GitHub, 후기는 커뮤니티/영상, 평판은 블라인드/잡플래닛/뉴스를 더 봅니다.</li>
            <li><b>페널티</b>: 광고성 글이나 의미 없는 소셜 결과는 뒤로 보냅니다.</li>
          </ul>
        </div>
        <h3>순위 변화</h3>
        <RerankChanges items={data.rerankChanges ?? []} />
        <ResultList title="점수 계산 후 최종 목록" items={data.rerankedResults} showScore weights={data.params?.weights ?? weights} />
        <h3>처리 순서</h3>{data.explanation.map((x: string)=><p key={x}>{x}</p>)}
      </section>
      </>}
    </>}
  </div>;
}
