import ResearchLab from "../components/ResearchLab";

export default function DevErrorResearchPage() {
  return <ResearchLab
    vertical="dev-error"
    badge="vertical search lab · developer error"
    title="에러 메시지를 raw 검색부터 리랭킹까지 뜯어봅니다."
    description="공식문서, GitHub 이슈, StackOverflow, 블로그가 어떻게 섞이는지 중간 결과를 단계별로 보여줍니다."
    defaultQuery="Hydration failed because the initial UI does not match"
    examples={["Hydration failed because the initial UI does not match", "Spring Boot circular dependency error", "Rust borrow checker cannot borrow as mutable"]}
  />;
}
