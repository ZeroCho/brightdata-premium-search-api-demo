import ResearchLab from "../components/ResearchLab";

export default function CompanyResearchPage() {
  return <ResearchLab
    vertical="company"
    badge="vertical search lab · company reputation"
    title="취업·이직 회사 평판을 커뮤니티, 채용, 뉴스로 분해합니다."
    description="회사명 검색에서 블라인드/잡플래닛/채용공고/뉴스가 어떻게 섞이는지 raw 결과부터 리랭킹까지 보여줍니다."
    defaultQuery="토스 이직 회사 평판 연봉 문화"
    examples={["토스 이직 회사 평판 연봉 문화", "네이버 개발자 면접 후기 조직문화", "카카오 이직 후기 연봉 워라밸"]}
  />;
}
