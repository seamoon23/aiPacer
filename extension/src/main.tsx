import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import AiPacerApp from "../../src/components/AiPacerApp";
import "./extension.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("AI Pacer popup root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AiPacerApp variant="extension" />
  </StrictMode>
);
