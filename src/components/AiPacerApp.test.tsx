import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AiPacerApp from "./AiPacerApp";

describe("AiPacerApp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-27T09:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the immediate calculator without tracking controls", () => {
    render(<AiPacerApp locale="ko" />);

    expect(
      screen.getByRole("heading", {
        name: "오늘, 얼마나 달려도 될까?"
      })
    ).toBeInTheDocument();
    const mascot = screen.getByRole("img", { name: /달콤이/ });
    expect(mascot).toBeInTheDocument();
    expect(mascot).toHaveAttribute("src");
    expect(mascot.getAttribute("src")).not.toBe("");
    expect(screen.getByText("달콤이 says")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "오늘 작업 추천" })
    ).toBeInTheDocument();
    expect(screen.queryByText("최근 기록")).not.toBeInTheDocument();
    expect(screen.queryByText("알림 설정")).not.toBeInTheDocument();
  });

  it("recalculates the three task counts as inputs change", () => {
    render(<AiPacerApp locale="ko" />);

    const mondayButton = screen.getByRole("button", { name: "월요일" });
    const tuesdayButton = screen.getByRole("button", { name: "화요일" });
    expect(mondayButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.change(screen.getByLabelText("주간 남은 용량"), {
      target: { value: "100" }
    });
    fireEvent.click(tuesdayButton);

    expect(mondayButton).toHaveAttribute("aria-pressed", "false");
    expect(tuesdayButton).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText("선택: 화요일 00:00 초기화")
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /달콤이/ })).toHaveAttribute(
      "data-character-status",
      "push"
    );

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("50회");
    expect(rows[2]).toHaveTextContent("16회");
    expect(rows[3]).toHaveTextContent("6회");
    expect(
      screen.getByText("대 6회 + 중 1회 + 소 2회")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "세 행은 같은 예산을 공유하므로 서로 더하지 않습니다."
      )
    ).toBeInTheDocument();
  });

  it("keeps recommendations available after the default hours", () => {
    vi.setSystemTime(new Date("2026-07-28T21:00:00"));
    render(<AiPacerApp locale="ko" />);

    fireEvent.change(screen.getByLabelText("주간 남은 용량"), {
      target: { value: "39" }
    });
    fireEvent.click(screen.getByRole("button", { name: "화요일" }));

    expect(screen.getByText("6.5%")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("3회");
    expect(rows[2]).toHaveTextContent("1회");
    expect(rows[3]).toHaveTextContent("0회");
    expect(
      screen.queryByText("오늘 주 사용시간은 끝났어요")
    ).not.toBeInTheDocument();
  });

  it("applies the Max 5x plan correction", () => {
    render(<AiPacerApp locale="ko" />);

    const proButton = screen.getByRole("button", {
      name: "Pro, 월 20달러, 1배 용량"
    });
    const maxButton = screen.getByRole("button", {
      name: "Max 5x, 월 100달러, 5배 용량"
    });

    expect(proButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(maxButton);

    expect(proButton).toHaveAttribute("aria-pressed", "false");
    expect(maxButton).toHaveAttribute("aria-pressed", "true");
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("약 0.4%");
    expect(rows[1]).toHaveTextContent("21회");
    expect(rows[2]).toHaveTextContent("7회");
    expect(rows[3]).toHaveTextContent("2회");
    expect(
      screen.getByText(/Max 5x · 같은 오늘 예산/)
    ).toBeInTheDocument();
  });

  it("opens the calculation guide with external support links", () => {
    render(<AiPacerApp locale="ko" />);

    const dialog = document.querySelector<HTMLDialogElement>(
      "#pacer-help-dialog"
    );
    expect(dialog?.open).toBe(false);

    fireEvent.click(
      screen.getByRole("button", { name: "계산 기준 보기" })
    );

    expect(dialog?.open).toBe(true);

    expect(
      screen.getByRole("heading", { name: "계산 기준" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "플랜 보정" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "별도 세션 한도" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/시간은 횟수를 제한하지 않습니다/)
    ).toBeInTheDocument();

    const supportLink = screen.getByRole("link", {
      name: "GitHub Sponsors"
    });
    expect(supportLink).toHaveAttribute("target", "_blank");
    expect(supportLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener")
    );
    const kofiLink = screen.getByRole("link", {
      name: "Ko-fi (PayPal)"
    });
    expect(kofiLink).toHaveAttribute(
      "href",
      "https://ko-fi.com/seamoon23"
    );
    expect(kofiLink).toHaveAttribute("target", "_blank");
    expect(kofiLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener")
    );
    expect(
      screen.getByRole("img", { name: /실제 샴고양이 달콤이/ })
    ).toHaveAttribute("src", "/aiPacer/assets/dalkomi-portrait.webp");
    expect(
      screen.queryByRole("link", { name: "Buy Me a Coffee" })
    ).not.toBeInTheDocument();
  });

  it("warns when the work time range is invalid", () => {
    render(<AiPacerApp locale="ko" />);

    fireEvent.change(screen.getByLabelText("주 사용 시작 시간"), {
      target: { value: "18:00" }
    });
    fireEvent.change(screen.getByLabelText("주 사용 종료 시간"), {
      target: { value: "09:00" }
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "종료 시간은 시작 시간보다 최소 1시간 뒤여야 합니다."
    );
  });

  it("supports the compact extension presentation", () => {
    const { container } = render(<AiPacerApp variant="extension" locale="ko" />);

    expect(container.firstElementChild).toHaveClass(
      "pacer-app--extension"
    );
  });
  it("recalculates against a custom reset time", () => {
    render(<AiPacerApp locale="ko" />);

    fireEvent.change(screen.getByLabelText("초기화 시간"), {
      target: { value: "12:30" }
    });

    expect(
      screen.getByText("선택: 월요일 12:30 초기화")
    ).toBeInTheDocument();
    expect(screen.getByText("4시간")).toBeInTheDocument();
  });

  it("renders English copy when the browser locale is English", () => {
    render(<AiPacerApp variant="extension" locale="en" />);

    expect(
      screen.getByRole("heading", { name: "How much can I use today?" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Monday" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", {
        name: "Pro, 20 dollars monthly, 1 times capacity"
      })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Dalkomi says")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Today’s task plan" })
    ).toBeInTheDocument();
    expect(screen.getByText("Example mix")).toBeInTheDocument();
    expect(
      screen.getByText(/five-hour or session limit/)
    ).toBeInTheDocument();
  });
});
