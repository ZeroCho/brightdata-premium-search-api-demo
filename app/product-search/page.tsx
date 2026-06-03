import ResearchLab from "../components/ResearchLab";

export default function ProductResearchPage() {
  return <ResearchLab
    vertical="product"
    badge="vertical search lab · product review"
    title="제품 후기를 쇼핑몰, 커뮤니티, 리뷰 영상으로 분해합니다."
    description="실사용 후기 검색에서 광고성 결과와 공식 스펙, 커뮤니티 반응이 어떻게 다른지 단계별로 보여줍니다."
    defaultQuery="맥북 에어 M4 개발용 괜찮아?"
    examples={["맥북 에어 M4 개발용 괜찮아?", "갤럭시 S25 울트라 실사용 후기 단점", "로보락 로봇청소기 장기 사용 후기"]}
  />;
}
