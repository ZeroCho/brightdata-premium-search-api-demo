"use client";

import { useState } from "react";
import ResearchLab from "./ResearchLab";

const demos = [
  {
    id: "demo-1",
    label: "개발자 에러 메시지 검색 도구",
    short: "공식문서·이슈·Q&A 찾기",
    vertical: "dev-error" as const,
    badge: "Developer error search",
    title: "에러 메시지를 넣으면 원인과 해결 후보를 찾아줍니다.",
    description: "개발 중 만난 에러 문장을 넣으면 공식문서, GitHub 이슈, Q&A를 모아 해결 가능성이 높은 순서로 정리합니다.",
    defaultQuery: "Hydration failed because the initial UI does not match",
    examples: ["Hydration failed because the initial UI does not match", "Spring Boot circular dependency error", "Rust borrow checker cannot borrow as mutable"],
    note: "에러 문장을 넣으면 해결 후보를 모아주는 개발자용 검색 도구입니다.",
  },
  {
    id: "demo-2",
    label: "후기 검증",
    short: "제품 리뷰 걸러보기",
    vertical: "product" as const,
    badge: "Review check",
    title: "광고 말고 실제 후기를 먼저 봅니다.",
    description: "제품명을 넣으면 공식 스펙, 커뮤니티 후기, 리뷰 영상, 가격 비교 결과를 나눠 봅니다.",
    defaultQuery: "LG gram Pro 배터리·발열·실사용 평가는 어떤가?",
    examples: ["LG gram Pro 배터리·발열·실사용 평가는 어떤가?", "맥북 에어 M4 개발용 괜찮아?", "갤럭시 S25 울트라 실사용 후기 단점"],
    note: "같은 검색 파이프라인에서 출처 가중치만 바꾼 예시입니다.",
  },
  {
    id: "demo-3",
    label: "평판 모니터링",
    short: "회사·브랜드 추적",
    vertical: "company" as const,
    badge: "Reputation monitor",
    title: "회사와 브랜드 평판을 한 번에 모읍니다.",
    description: "회사명이나 브랜드를 넣으면 커뮤니티, 채용 사이트, 뉴스 결과를 묶어서 봅니다.",
    defaultQuery: "카카오페이 개발자 회사 평판 블라인드 잡플래닛",
    examples: ["카카오페이 개발자 회사 평판 블라인드 잡플래닛", "토스 이직 회사 평판 연봉 문화", "네이버 개발자 면접 후기 조직문화"],
    note: "매일 돌리면 새로 뜬 글과 순위 변화를 볼 수 있습니다.",
  },
];

export default function UnifiedDemos() {
  const [selected, setSelected] = useState(demos[0].id);
  const demo = demos.find((x) => x.id === selected) ?? demos[0];

  return <main>
    <section className="hero">
      <div className="badge">Bright Data SERP API</div>
      <h1>검색 결과를 서비스 화면으로 바꾸기</h1>
      <p>구글 결과를 그대로 보여주지 않고, 목적에 맞게 모으고 걸러서 다시 정렬합니다.</p>
      <div className="pipeline"><span>검색 수집</span><span>중복 제거</span><span>필터</span><span>가중치</span><span>리랭킹</span></div>
    </section>

    <section className="card">
      <h2>데모 선택</h2>
      <div className="tabGrid">
        {demos.map((item, index) => <button key={item.id} className={item.id === selected ? "tabCard active" : "tabCard"} onClick={() => setSelected(item.id)}>
          <strong>{index + 1}. {item.label}</strong>
          <span>{item.short}</span>
          <p>{item.note}</p>
        </button>)}
      </div>
    </section>

    <ResearchLab
      key={demo.id}
      vertical={demo.vertical}
      badge={demo.badge}
      title={demo.title}
      description={demo.description}
      defaultQuery={demo.defaultQuery}
      examples={demo.examples}
    />
  </main>;
}
