import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import AiPacerApp from "../../src/components/AiPacerApp";
import { resolvePacerLocale } from "../../src/lib/pacerCalculator";
import "./extension.css";

type ChromeWithI18n = typeof globalThis & {
  chrome?: { i18n?: { getUILanguage?: () => string } };
};

const chromeApi = (globalThis as ChromeWithI18n).chrome;
const localeOverride = new URLSearchParams(window.location.search).get(
  "lang"
);
const extensionLocale =
  localeOverride === "ko" || localeOverride === "en"
    ? localeOverride
    : resolvePacerLocale(
        chromeApi?.i18n?.getUILanguage?.() ?? window.navigator.language
      );
document.documentElement.lang = extensionLocale;

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("AI Pacer popup root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AiPacerApp variant="extension" locale={extensionLocale} />
  </StrictMode>
);
