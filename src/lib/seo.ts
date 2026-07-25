type StructuredDataNode = Record<string, unknown>;

const FAQ_ITEMS = [
  {
    question: "AI Pacer는 정확한 토큰 계산기인가요?",
    answer:
      "아닙니다. 입력한 주간 잔여율과 보수적인 작업 규모 기준으로 오늘 가능한 횟수를 추정하는 계산기입니다."
  },
  {
    question: "어떤 값을 입력하나요?",
    answer:
      "현재 남은 주간 용량과 초기화 요일을 입력합니다. 주 사용시간은 기본 09:00부터 18:00이며 필요하면 바꿀 수 있습니다."
  },
  {
    question: "입력값을 저장하거나 서버로 전송하나요?",
    answer:
      "저장하거나 전송하지 않습니다. 입력값은 현재 화면의 계산에만 사용됩니다."
  },
  {
    question: "Chrome 확장 프로그램에서도 사용할 수 있나요?",
    answer:
      "네. 웹 페이지와 같은 계산기를 Manifest V3 팝업으로 제공하며 브라우저 권한이나 호스트 권한을 요청하지 않습니다."
  },
  {
    question: "소형, 중형, 대형 작업 기준은 무엇인가요?",
    answer:
      "소형은 2%와 20분, 중형은 6%와 60분, 대형은 15%와 150분을 기준으로 용량과 남은 시간 중 더 적은 횟수를 보여줍니다."
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
        "로그인 없이 브라우저에서 바로 쓰는 간단한 웹 유틸리티 모음"
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
        "주간 남은 AI 용량과 초기화 요일로 오늘 가능한 소형, 중형, 대형 작업 횟수를 추정하는 무료 계산기"
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