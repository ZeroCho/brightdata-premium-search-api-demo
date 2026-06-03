import ResearchLab from "../components/ResearchLab";

export default function TravelResearchPage() {
  return <ResearchLab
    vertical="travel"
    badge="vertical search lab · travel"
    title="여행 검색 결과를 예약사이트, 후기, 커뮤니티로 묶어봅니다."
    description="호텔/여행 검색에서 raw 결과, 도메인 클러스터, 중복 제거, 지역 토글이 어떻게 작동하는지 보여줍니다."
    defaultQuery="오사카 3박4일 가족여행 호텔"
    examples={["오사카 3박4일 가족여행 호텔", "후쿠오카 온천 료칸 가족여행", "방콕 가성비 호텔 후기"]}
  />;
}
