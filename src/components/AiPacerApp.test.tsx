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
    render(<AiPacerApp />);

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
    render(<AiPacerApp />);

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
      screen.getByText("선택: 화요일 0시 초기화")
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /달콤이/ })).toHaveAttribute(
      "data-character-status",
      "push"
    );

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("27회");
    expect(rows[2]).toHaveTextContent("9회");
    expect(rows[3]).toHaveTextContent("3회");
  });

  it("opens the calculation guide with external support links", () => {
    render(<AiPacerApp />);

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

    const supportLink = screen.getByRole("link", {
      name: "GitHub Sponsors"
    });
    expect(supportLink).toHaveAttribute("target", "_blank");
    expect(supportLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener")
    );
  });

  it("warns when the work time range is invalid", () => {
    render(<AiPacerApp />);

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
    const { container } = render(<AiPacerApp variant="extension" />);

    expect(container.firstElementChild).toHaveClass(
      "pacer-app--extension"
    );
  });
});
