import { SITE_URL } from "./siteMetadata";

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
      "현재 남은 주간 용량, Claude 플랜, 초기화 요일·시간을 입력합니다. 주 사용시간은 기본 09:00부터 18:00이며 필요하면 바꿀 수 있습니다."
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
      "Pro 1x에서는 소형 2%, 중형 6%, 대형 15%를 사용하고 Max 5x에서는 각각 0.4%, 1.2%, 3%로 보정합니다. 대화 턴과 문맥 규모를 함께 기준으로 같은 오늘 예산에서 가능한 횟수를 보여줍니다."
  },
  {
    question: "Pro와 Max 5x 차이를 반영하나요?",
    answer:
      "네. Pro $20를 1x 기준으로 두고 Max 5x $100은 작업당 추정 소모율을 1/5로 낮춥니다. 서비스의 별도 세션과 주간 모델 한도는 먼저 적용될 수 있습니다."
  }
] as const;

export function getAiPacerStructuredData(pageUrl: string): StructuredDataNode[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AI Pacer",
      url: `${SITE_URL}/`,
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
        "주간 남은 AI 용량, Claude 플랜과 초기화 일정으로 오늘 가능한 소형, 중형, 대형 작업 횟수를 추정하는 무료 계산기"
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