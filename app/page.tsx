import Link from "next/link";

const labs = [
  {
    href: "/dev-error-search",
    title: "1. 개발자 에러 리서치",
    desc: "에러 메시지 → 공식문서/GitHub/StackOverflow/블로그 raw 결과 → 클러스터링 → 리랭킹",
  },
  {
    href: "/travel-search",
    title: "2. 여행·호텔 리서치",
    desc: "호텔 검색 → 예약사이트/후기/커뮤니티 결과를 도메인별로 묶고 필터링",
  },
  {
    href: "/product-search",
    title: "3. 제품 후기 리서치",
    desc: "전자제품 검색 → 쇼핑몰/커뮤니티/유튜브/공식 스펙을 분리해서 비교",
  },
];

export default function Home() {
  return <main>
    <section className="hero">
      <div className="badge">Bright Data SERP API · vertical research lab</div>
      <h1>검색 엔진이 결과를 어떻게 조립하는지 중간 과정을 보여줍니다.</h1>
      <p>B2C 서비스처럼 포장하지 않고, raw 결과부터 도메인 클러스터링, 중복 제거, 필터링, 팬아웃 쿼리, RRF/BM25-lite 리랭킹까지 그대로 노출합니다.</p>
      <div className="pipeline"><span>raw results</span><span>domain cluster</span><span>dedupe</span><span>filter</span><span>research mode</span><span>rerank</span></div>
    </section>
    <section className="card">
      <h2>버티컬 3개</h2>
      <div className="results">
        {labs.map((lab) => <article className="result" key={lab.href}>
          <Link href={lab.href}>{lab.title}</Link>
          <p>{lab.desc}</p>
          <div className="meta">Bright Data SERP API · Google/Bing · KR/US/JP · include/exclude domain</div>
        </article>)}
      </div>
    </section>
    <section className="card">
      <h2>촬영 포인트</h2>
      <p>완성된 답만 보여주는 게 아니라 “왜 이 결과가 위로 올라왔는지”를 설명합니다.</p>
      <pre>{`RRF = 1 / (60 + 검색순위)\nBM25-lite = 질문 단어가 제목/설명에 얼마나 겹치는지\nVertical boost = 에러검색은 공식문서/GitHub/Q&A, 여행은 예약/후기/커뮤니티, 제품은 커뮤니티/후기/쇼핑/영상에 가중치`}</pre>
    </section>
  </main>;
}
