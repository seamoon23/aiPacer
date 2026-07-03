type StructuredDataNode = Record<string, unknown>;

const FAQ_ITEMS = [
  {
    question: "AI Pacer는 정확한 토큰 계산기인가요?",
    answer:
      "아닙니다. AI Pacer는 공식 사용량 추적기가 아니라 현재 입력값 기준의 추정 결과를 보여주는 사용량 페이스 계산 도구입니다."
  },
  {
    question: "자동으로 Claude Code나 Codex 사용량을 읽나요?",
    answer:
      "읽지 않습니다. 이번 MVP는 사용자가 서비스 화면에 보이는 숫자를 직접 입력하는 수동형 도구이며 자동 감지, 확장프로그램, API 연동은 포함하지 않았습니다."
  },
  {
    question: "입력한 데이터가 서버에 저장되나요?",
    answer:
      "저장되지 않습니다. 기록과 설정은 브라우저 localStorage에만 저장되며 외부 서버로 전송하지 않습니다."
  },
  {
    question: "Claude Code와 Codex에도 쓸 수 있나요?",
    answer:
      "네. Claude Code의 0->100 표시와 Codex의 100->0 표시를 도구별로 해석해 계산합니다."
  },
  {
    question: "모바일에서도 사용할 수 있나요?",
    answer:
      "가능합니다. 모바일 우선 레이아웃으로 구성해 작은 화면에서도 입력과 결과 카드를 읽기 쉽게 만들었습니다."
  }
] as const;

export function getAiPacerStructuredData(pageUrl: string): StructuredDataNode[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AI Pacer",
      url: "https://example.com/",
      description:
        "브라우저에서 직접 서비스 화면 표시값을 입력해 AI 사용량 페이스를 계산하는 정적 웹 도구 허브"
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "AI Pacer",
      url: pageUrl,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "JavaScript enabled",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      },
      description:
        "Claude Code와 Codex 사용량 표시값을 직접 입력해 오늘의 사용 페이스와 추가 사용 권장량을 계산하는 무료 웹 도구"
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    }
  ];
}
