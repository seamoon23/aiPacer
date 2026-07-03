import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AiPacerApp from "./AiPacerApp";
import { STORAGE_KEYS } from "../lib/storage";
import type { UsageSnapshot } from "../lib/types";

function seedSnapshots(snapshots: UsageSnapshot[]) {
  window.localStorage.setItem(STORAGE_KEYS.snapshots, JSON.stringify(snapshots));
}

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}

function installNotificationMock(
  permission: NotificationPermission,
  requestResult: NotificationPermission = permission
) {
  const notificationConstructor = vi.fn();
  const requestPermission = vi.fn().mockResolvedValue(requestResult);

  Object.defineProperty(window, "Notification", {
    configurable: true,
    writable: true,
    value: Object.assign(notificationConstructor, {
      permission,
      requestPermission
    })
  });

  return {
    notificationConstructor,
    requestPermission
  };
}

function getDisclosureByTestId(testId: string): HTMLDetailsElement {
  return screen.getByTestId(testId) as HTMLDetailsElement;
}

describe("AiPacerApp", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "Notification");
    window.localStorage.clear();
    let uuidIndex = 0;
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      uuidIndex += 1;
      return `00000000-0000-4000-8000-${String(uuidIndex).padStart(12, "0")}`;
    });
  });

  it("calculates a recommendation and stores a recent snapshot from the form", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "85" }
    });
    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "60" }
    });
    fireEvent.change(screen.getByLabelText("메모"), {
      target: { value: "주요 워크플로 테스트" }
    });

    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect(await screen.findByText("SAFE")).toBeInTheDocument();
    expect(screen.getAllByText(/이 패턴이면/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThanOrEqual(2);

    const historySection = screen
      .getByRole("heading", { name: "localStorage에 최근 10개까지 보관" })
      .closest("section");
    expect(historySection).not.toBeNull();
    expect(within(historySection as HTMLElement).getByText("Codex")).toBeInTheDocument();
    expect(within(historySection as HTMLElement).getByText("주요 워크플로 테스트")).toBeInTheDocument();

    await waitFor(() => {
      const snapshots = JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.snapshots) ?? "[]"
      );
      expect(snapshots[0]).toMatchObject({
        id: "00000000-0000-4000-8000-000000000001",
        providerName: "Codex",
        sessionRemainingPct: 85,
        weeklyRemainingPct: 60,
        sessionDisplayPct: 85,
        weeklyDisplayPct: 60,
        memo: "주요 워크플로 테스트"
      });
    });
  });

  it("treats Claude display values as used-up percentages and Codex values as remaining percentages", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    fireEvent.change(screen.getByLabelText("도구 선택"), {
      target: { value: "claude-code" }
    });
    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "43" }
    });
    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "66" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect((await screen.findAllByText("57.0%")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("34.0%").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("도구 선택"), {
      target: { value: "codex" }
    });
    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "43" }
    });
    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "66" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect((await screen.findAllByText("43.0%")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("66.0%").length).toBeGreaterThan(0);
  });

  it("keeps only Codex and Claude Code in the tool selector", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    const options = within(screen.getByLabelText("도구 선택")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Codex",
      "Claude Code"
    ]);
  });

  it("removes the task intensity selector from the manual input flow", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    expect(screen.queryByLabelText("작업 강도")).not.toBeInTheDocument();
  });

  it("keeps weekly settings out of the entry form and manages them separately per tool", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    const entrySection = screen
      .getByRole("heading", {
        name: "서비스 화면에 보이는 숫자를 그대로 입력하세요"
      })
      .closest("section");
    expect(entrySection).not.toBeNull();
    expect(
      within(entrySection as HTMLElement).queryByLabelText(/주간 리셋 일시/)
    ).not.toBeInTheDocument();
    expect(
      within(entrySection as HTMLElement).queryByLabelText(/하루 5시간 세션 소진 목표/)
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "주간 설정 열기" }));

    fireEvent.change(screen.getByLabelText(/주간 리셋 일시/), {
      target: { value: "2026-07-06T07:00" }
    });
    fireEvent.change(screen.getByLabelText(/하루 5시간 세션 소진 목표/), {
      target: { value: "3" }
    });

    fireEvent.change(screen.getByLabelText("도구 선택"), {
      target: { value: "claude-code" }
    });

    expect(screen.getByText("Claude Code 기준값을 관리 중입니다.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/주간 리셋 일시/), {
      target: { value: "2026-07-04T09:30" }
    });
    fireEvent.change(screen.getByLabelText(/하루 5시간 세션 소진 목표/), {
      target: { value: "1" }
    });

    fireEvent.change(screen.getByLabelText("도구 선택"), {
      target: { value: "codex" }
    });

    expect(screen.getByLabelText(/주간 리셋 일시/)).toHaveValue("2026-07-06T07:00");
    expect(screen.getByLabelText(/하루 5시간 세션 소진 목표/)).toHaveValue(3);

    fireEvent.change(screen.getByLabelText("도구 선택"), {
      target: { value: "claude-code" }
    });

    expect(screen.getByLabelText(/주간 리셋 일시/)).toHaveValue("2026-07-04T09:30");
    expect(screen.getByLabelText(/하루 5시간 세션 소진 목표/)).toHaveValue(1);
  });

  it("stores work hours and can start a new provider week", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");
    fireEvent.click(screen.getByRole("button", { name: "주간 설정 열기" }));

    fireEvent.change(screen.getByLabelText("주 사용 시작"), {
      target: { value: "10:00" }
    });
    fireEvent.change(screen.getByLabelText("주 사용 종료"), {
      target: { value: "19:00" }
    });
    fireEvent.click(screen.getByRole("button", { name: "새 주간 시작" }));

    expect(await screen.findByText(/새 주간이 생성되었습니다/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect((await screen.findAllByText(/10:00~19:00/)).length).toBeGreaterThan(0);

    const snapshots = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.snapshots) ?? "[]"
    );
    expect(snapshots[0].weekId).toMatch(/^codex-/);
    expect(snapshots[0].workdayStart).toBe("10:00");
    expect(snapshots[0].workdayEnd).toBe("19:00");
  });

  it("switches the hero summary to a chart dashboard after calculation", async () => {
    render(<AiPacerApp />);

    await screen.findByText("오늘 어느 AI를 달릴까요?");
    expect(screen.queryByText("오늘 한눈에 보기")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect(await screen.findByText("오늘 한눈에 보기")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "오늘 페이스 핵심 차트" })).toBeInTheDocument();
  });

  it("shows a race coach dashboard that compares Codex and Claude Code", async () => {
    seedSnapshots([
      {
        id: "codex-latest",
        weekId: "codex-week",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-07-01T12:00:00+09:00",
        sessionRemainingPct: 75,
        weeklyRemainingPct: 82,
        weeklyResetAt: "2026-07-06T07:00",
        taskRiskType: "normal"
      },
      {
        id: "claude-latest",
        weekId: "claude-week",
        providerType: "claude-code",
        providerName: "Claude Code",
        createdAt: "2026-07-01T11:30:00+09:00",
        sessionRemainingPct: 35,
        weeklyRemainingPct: 31,
        weeklyResetAt: "2026-07-04T08:00",
        taskRiskType: "normal"
      },
      {
        id: "codex-morning",
        weekId: "codex-week",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-07-01T09:00:00+09:00",
        sessionRemainingPct: 90,
        weeklyRemainingPct: 90,
        weeklyResetAt: "2026-07-06T07:00",
        taskRiskType: "normal"
      },
      {
        id: "claude-morning",
        weekId: "claude-week",
        providerType: "claude-code",
        providerName: "Claude Code",
        createdAt: "2026-07-01T09:10:00+09:00",
        sessionRemainingPct: 55,
        weeklyRemainingPct: 48,
        weeklyResetAt: "2026-07-04T08:00",
        taskRiskType: "normal"
      }
    ]);

    render(<AiPacerApp />);

    expect(await screen.findByRole("heading", { name: "AI 레이스 코치" })).toBeInTheDocument();
    expect(screen.getByText("Codex vs Claude Code")).toBeInTheDocument();
    expect(screen.getByText("Codex가 따라잡을 차례입니다")).toBeInTheDocument();
    expect(
      screen.getByText("많이 남아 있습니다. 필요한 작업은 Codex에 더 맡겨도 좋습니다.")
    ).toBeInTheDocument();
    expect(screen.getByText("토끼 페이스")).toBeInTheDocument();
    expect(screen.getByText("거북이 페이스")).toBeInTheDocument();
  });

  it("uses the top area as a compact decision board instead of long intro copy", async () => {
    render(<AiPacerApp />);

    const heroSection = (await screen.findByRole("heading", {
      name: "오늘 어느 AI를 달릴까요?"
    })).closest("section");
    expect(heroSection).not.toBeNull();
    const heroQueries = within(heroSection as HTMLElement);

    expect(heroQueries.getByRole("heading", { name: "AI 레이스 코치" })).toBeInTheDocument();
    expect(heroQueries.getByText("첫 기록을 넣으면 바로 레이스가 열립니다")).toBeInTheDocument();
    expect(heroQueries.getByText("숫자 2개 입력하면 오늘 더 쓸 AI가 보입니다.")).toBeInTheDocument();
    expect(heroQueries.queryByText(/AI Pacer는 Claude Code와 Codex 사용량을 자동 수집하지 않습니다/)).not.toBeInTheDocument();
    expect(heroQueries.queryByText("서버 저장 없음")).not.toBeInTheDocument();
  });

  it("switches the hero from first-visit guidance to a record-based coach message", async () => {
    seedSnapshots([
      {
        id: "low-remaining",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-07-01T10:00:00+09:00",
        sessionRemainingPct: 13,
        weeklyRemainingPct: 52,
        weeklyResetAt: "2026-07-06T07:00",
        dailySessionTarget: 2,
        taskRiskType: "normal"
      }
    ]);

    render(<AiPacerApp />);

    const heroSection = (await screen.findByRole("heading", {
      level: 1,
      name: "새 대형 작업은 잠시 미루세요"
    })).closest("section");
    expect(heroSection).not.toBeNull();
    const heroQueries = within(heroSection as HTMLElement);

    expect(heroQueries.queryByText("숫자 2개 입력하면 오늘 더 쓸 AI가 보입니다.")).not.toBeInTheDocument();
    expect(heroQueries.getByText(/Codex 기준/)).toBeInTheDocument();
  });

  it("keeps the hero coach from repeating the same warning in the summary chart", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "13" }
    });
    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "52" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    const heroSection = (await screen.findByRole("heading", {
      level: 1,
      name: "새 대형 작업은 잠시 미루세요"
    })).closest("section");
    expect(heroSection).not.toBeNull();
    const heroQueries = within(heroSection as HTMLElement);

    expect(heroQueries.getAllByText("새 대형 작업은 잠시 미루세요")).toHaveLength(1);
    expect(heroQueries.getByText(/Codex 기준/)).toBeInTheDocument();
    expect(heroQueries.queryByText("오늘 남은 페이스")).not.toBeInTheDocument();
    expect(heroQueries.getByText("남은 페이스")).toBeInTheDocument();
    expect(heroQueries.getByText("대형 작업 재입력")).toBeInTheDocument();
    expect(heroQueries.getByText("리셋 대기")).toBeInTheDocument();
    expect(heroQueries.queryByText("40분")).not.toBeInTheDocument();
  });

  it("keeps the manual input form compact for repeated entries", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 숫자 2개만 입력하면 됩니다");

    expect(
      screen.getByText(/도구와 표시값만 빠르게 넣고/)
    ).toBeInTheDocument();
    expect(screen.getByText("AI 레이스 티켓")).toBeInTheDocument();

    const inputCard = screen
      .getByRole("heading", { name: "서비스 화면에 보이는 숫자를 그대로 입력하세요" })
      .closest("section");
    const weeklyCard = screen
      .getByRole("heading", { name: "도구별 주간 기준값을 분리 관리합니다" })
      .closest("section");
    expect(inputCard).not.toBeNull();
    expect(weeklyCard).not.toBeNull();
    expect(
      (inputCard as HTMLElement).compareDocumentPosition(weeklyCard as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("keeps input open for first use and collapses it after records exist", async () => {
    const { unmount } = render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    expect(getDisclosureByTestId("pacer-input-panel")).toHaveAttribute("open");
    unmount();

    seedSnapshots([
      {
        id: "saved-snapshot",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-07-01T10:00:00+09:00",
        sessionRemainingPct: 80,
        weeklyRemainingPct: 70,
        weeklyResetAt: "2026-07-06T07:00",
        dailySessionTarget: 2,
        taskRiskType: "normal"
      }
    ]);

    render(<AiPacerApp />);

    await screen.findByText("새 잔여율 입력");

    expect(getDisclosureByTestId("pacer-input-panel")).not.toHaveAttribute("open");
  });

  it("keeps tracking, history, and notification tools in collapsed utility panels", async () => {
    seedSnapshots([
      {
        id: "saved-snapshot",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-07-01T10:00:00+09:00",
        sessionRemainingPct: 80,
        weeklyRemainingPct: 70,
        weeklyResetAt: "2026-07-06T07:00",
        dailySessionTarget: 2,
        taskRiskType: "normal"
      }
    ]);

    render(<AiPacerApp />);

    await screen.findByText("도구 패널");

    expect(getDisclosureByTestId("tracking-utility-panel")).not.toHaveAttribute("open");
    expect(getDisclosureByTestId("history-utility-panel")).not.toHaveAttribute("open");
    expect(getDisclosureByTestId("notification-utility-panel")).not.toHaveAttribute("open");
    expect(
      within(getDisclosureByTestId("tracking-utility-panel")).getAllByText(
        "추적 대시보드"
      )[0]
    ).toBeInTheDocument();
    expect(
      within(getDisclosureByTestId("history-utility-panel")).getByText("기록 관리")
    ).toBeInTheDocument();
    expect(
      within(getDisclosureByTestId("notification-utility-panel")).getByText("알림 설정")
    ).toBeInTheDocument();
  });

  it("shows validation errors without saving a snapshot", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "120" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect(
      await screen.findByText("5시간 세션 표시값은 0부터 100 사이 숫자여야 합니다.")
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.snapshots)).toBeNull();
  });

  it("restores the last result after a refresh-like remount", async () => {
    const { unmount } = render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "90" }
    });
    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "70" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect((await screen.findAllByText(/지금은/)).length).toBeGreaterThan(0);

    unmount();
    render(<AiPacerApp />);

    expect(await screen.findByText("마지막 계산 결과")).toBeInTheDocument();
    expect(screen.getAllByText(/지금은/).length).toBeGreaterThan(0);
  });

  it("edits a saved snapshot without creating a duplicate", async () => {
    seedSnapshots([
      {
        id: "saved-snapshot",
        weekId: "codex-week",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-06-29T09:00:00+09:00",
        sessionRemainingPct: 42,
        weeklyRemainingPct: 33,
        weeklyResetAt: "2026-07-03T08:30",
        taskRiskType: "codeSmall",
        memo: "불러올 기록"
      }
    ]);

    render(<AiPacerApp />);

    await screen.findByText("불러올 기록");
    fireEvent.click(
      screen.getByRole("button", { name: /불러올 기록.*기록 수정하기/ })
    );

    expect(screen.getByLabelText("도구 선택")).toHaveValue("codex");
    expect(screen.getByLabelText(/5시간 세션 표시값/)).toHaveValue(42);
    expect(screen.getByLabelText(/주간 표시값/)).toHaveValue(33);
    expect(screen.getByText(/저장된 기록을 수정 중입니다/)).toBeInTheDocument();
    const entrySection = screen
      .getByRole("heading", {
        name: "서비스 화면에 보이는 숫자를 그대로 입력하세요"
      })
      .closest("section");
    expect(entrySection).not.toBeNull();
    expect(
      within(entrySection as HTMLElement).queryByLabelText(/주간 리셋 일시/)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("메모")).toHaveValue("불러올 기록");

    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "44" }
    });
    fireEvent.change(screen.getByLabelText("메모"), {
      target: { value: "수정된 기록" }
    });
    fireEvent.click(screen.getByRole("button", { name: "수정 저장하기" }));

    await waitFor(() => {
      const snapshots = JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.snapshots) ?? "[]"
      ) as UsageSnapshot[];

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]).toMatchObject({
        id: "saved-snapshot",
        weekId: "codex-week",
        createdAt: "2026-06-29T09:00:00+09:00",
        weeklyRemainingPct: 44,
        weeklyDisplayPct: 44,
        memo: "수정된 기록"
      });
    });
    expect(screen.queryByText("불러올 기록")).not.toBeInTheDocument();
    const updatedHistorySection = screen
      .getByRole("heading", { name: "localStorage에 최근 10개까지 보관" })
      .closest("section");
    expect(updatedHistorySection).not.toBeNull();
    expect(
      within(updatedHistorySection as HTMLElement).getByText("수정된 기록")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "지금 페이스 계산하기" })
    ).toBeInTheDocument();
  });

  it("gives repeated history actions unique accessible names", async () => {
    seedSnapshots([
      {
        id: "snapshot-newer",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-06-29T10:00:00+09:00",
        sessionRemainingPct: 70,
        weeklyRemainingPct: 50,
        weeklyResetAt: "2026-07-03T08:30",
        taskRiskType: "normal",
        memo: "삭제할 기록"
      },
      {
        id: "snapshot-older",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-06-29T09:00:00+09:00",
        sessionRemainingPct: 80,
        weeklyRemainingPct: 60,
        weeklyResetAt: "2026-07-03T08:30",
        taskRiskType: "light",
        memo: "남길 기록"
      }
    ]);

    render(<AiPacerApp />);

    const historySection = (await screen.findByRole("heading", {
      name: "localStorage에 최근 10개까지 보관"
    })).closest("section");
    expect(historySection).not.toBeNull();
    const historyQueries = within(historySection as HTMLElement);

    expect(
      historyQueries.getByRole("button", { name: /삭제할 기록.*기록 수정하기/ })
    ).toBeInTheDocument();
    expect(
      historyQueries.getByRole("button", { name: /남길 기록.*기록 삭제하기/ })
    ).toBeInTheDocument();
  });

  it("exports saved snapshots as a browser-only JSON download", async () => {
    seedSnapshots([
      {
        id: "snapshot-export",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-06-29T10:00:00+09:00",
        sessionRemainingPct: 70,
        weeklyRemainingPct: 50,
        weeklyResetAt: "2026-07-03T08:30",
        taskRiskType: "normal",
        memo: "다운로드할 기록"
      }
    ]);
    const createObjectURL = vi.fn<(blob: Blob) => string>(
      () => "blob:ai-pacer-export"
    );
    const revokeObjectURL = vi.fn<(objectUrl: string) => void>();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL
    });

    render(<AiPacerApp />);

    const historySection = (await screen.findByRole("heading", {
      name: "localStorage에 최근 10개까지 보관"
    })).closest("section");
    expect(historySection).not.toBeNull();
    fireEvent.click(
      within(historySection as HTMLElement).getByRole("button", {
        name: "JSON 내보내기"
      })
    );

    expect(click).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:ai-pacer-export");
    const blob = createObjectURL.mock.calls[0][0];
    const blobText = await readBlobText(blob);
    expect(blobText).toContain("\"serviceName\": \"AI Pacer\"");
    expect(blobText).toContain("\"memo\": \"다운로드할 기록\"");
    expect(
      within(historySection as HTMLElement).getByText(/JSON 내보내기 준비 완료/)
    ).toBeInTheDocument();
    expect(within(historySection as HTMLElement).getByRole("status")).toHaveTextContent(
      "1개 기록"
    );
  });

  it("shows a clear notice when browser JSON export cannot start", async () => {
    seedSnapshots([
      {
        id: "snapshot-export-fail",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-06-29T10:00:00+09:00",
        sessionRemainingPct: 70,
        weeklyRemainingPct: 50,
        weeklyResetAt: "2026-07-03T08:30",
        taskRiskType: "normal",
        memo: "실패 안내 기록"
      }
    ]);
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => {
      throw new Error("download blocked");
    });
    const revokeObjectURL = vi.fn<(objectUrl: string) => void>();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL
    });

    render(<AiPacerApp />);

    const historySection = (await screen.findByRole("heading", {
      name: "localStorage에 최근 10개까지 보관"
    })).closest("section");
    expect(historySection).not.toBeNull();
    fireEvent.click(
      within(historySection as HTMLElement).getByRole("button", {
        name: "JSON 내보내기"
      })
    );

    expect(
      within(historySection as HTMLElement).getByText(/JSON 내보내기를 시작하지 못했습니다/)
    ).toBeInTheDocument();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("deletes one saved snapshot and can clear all remaining snapshots", async () => {
    seedSnapshots([
      {
        id: "snapshot-newer",
        providerType: "claude",
        providerName: "Claude",
        createdAt: "2026-06-29T10:00:00+09:00",
        sessionRemainingPct: 70,
        weeklyRemainingPct: 50,
        weeklyResetAt: "2026-07-03T08:30",
        taskRiskType: "normal",
        memo: "삭제할 기록"
      },
      {
        id: "snapshot-older",
        providerType: "chatgpt",
        providerName: "ChatGPT",
        createdAt: "2026-06-29T09:00:00+09:00",
        sessionRemainingPct: 80,
        weeklyRemainingPct: 60,
        weeklyResetAt: "2026-07-03T08:30",
        taskRiskType: "light",
        memo: "남길 기록"
      }
    ]);

    render(<AiPacerApp />);

    await screen.findByText("삭제할 기록");
    expect(screen.getByRole("heading", { name: "추적 대시보드" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /기록 삭제하기/ })[0]);

    expect(screen.queryByText("삭제할 기록")).not.toBeInTheDocument();
    expect(screen.getByText("남길 기록")).toBeInTheDocument();

    let snapshots = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.snapshots) ?? "[]"
    );
    expect(snapshots.map((snapshot: UsageSnapshot) => snapshot.id)).toEqual([
      "snapshot-older"
    ]);

    fireEvent.click(screen.getByRole("button", { name: "전체 삭제" }));

    expect(await screen.findByText("아직 저장된 기록이 없습니다.")).toBeInTheDocument();
    snapshots = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.snapshots) ?? "[]");
    expect(snapshots).toEqual([]);
  });

  it("marks invalid fields and links them to the error summary", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "120" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    const sessionInput = await screen.findByLabelText(/5시간 세션 표시값/);
    expect(sessionInput).toHaveAttribute("aria-invalid", "true");
    expect(sessionInput).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("sessionRemainingPct-error")
    );
    const errorSummary = screen.getByRole("alert");
    expect(errorSummary).toHaveAttribute("aria-live", "assertive");
    expect(errorSummary).toHaveFocus();
  });

  it("uses clearer result labels without duplicate budget metrics", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "99" }
    });
    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "62" }
    });
    fireEvent.click(screen.getByRole("button", { name: "주간 설정 열기" }));
    fireEvent.change(screen.getByLabelText(/하루 5시간 세션 소진 목표/), {
      target: { value: "3" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect(await screen.findByText("오늘 더 써도 되는 양")).toBeInTheDocument();
    expect(screen.getByText("안 쓰면 남길 수 있는 양")).toBeInTheDocument();
    expect(screen.getByText("하루 목표 세션")).toBeInTheDocument();
    expect(screen.getByText("목표별 배분 페이스")).toBeInTheDocument();
    expect(
      screen.getAllByText(/실제 5시간 세션 1회 소모량이 아니라/).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText("1회 세션당 페이스")).not.toBeInTheDocument();
    expect(screen.queryByText(/계산에 쓰는/)).not.toBeInTheDocument();
    expect(screen.queryByText("오늘 안전 예산")).not.toBeInTheDocument();
    expect(screen.queryByText("오늘 추가 권장량")).not.toBeInTheDocument();
  });

  it("shows a shutter state instead of action metrics when today's recommended pace is gone", async () => {
    const firstRecordToday = new Date();
    firstRecordToday.setHours(9, 0, 0, 0);

    seedSnapshots([
      {
        id: "codex-morning-high-week",
        providerType: "codex",
        providerName: "Codex",
        createdAt: firstRecordToday.toISOString(),
        sessionRemainingPct: 95,
        weeklyRemainingPct: 92,
        weeklyResetAt: "2026-07-06T07:00",
        dailySessionTarget: 2,
        taskRiskType: "normal"
      }
    ]);

    render(<AiPacerApp />);

    fireEvent.click(await screen.findByText("새 잔여율 입력"));
    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "89" }
    });
    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "35" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    const resultSection = (await screen.findByText("오늘 셔터 내림")).closest("section");
    expect(resultSection).not.toBeNull();
    const resultQueries = within(resultSection as HTMLElement);

    expect(resultQueries.getByText("5시간 세션 잔여율")).toBeInTheDocument();
    expect(resultQueries.getByText("주간 리셋까지")).toBeInTheDocument();
    expect(resultQueries.queryByText("지금 권장 흐름")).not.toBeInTheDocument();
    expect(resultQueries.queryByText("하루 목표 세션")).not.toBeInTheDocument();
    expect(resultQueries.queryByText("목표별 배분 페이스")).not.toBeInTheDocument();
    expect(resultQueries.queryByText("작업별 권장 진행 시간")).not.toBeInTheDocument();
  });

  it("shows a shutter state when the current 5-hour session is too low for new work", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "13" }
    });
    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "52" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    const resultSection = (await screen.findByText("오늘 셔터 내림")).closest("section");
    expect(resultSection).not.toBeNull();
    const resultQueries = within(resultSection as HTMLElement);

    expect(resultQueries.getByText(/현재 5시간 세션이 낮습니다/)).toBeInTheDocument();
    expect(resultQueries.queryByText("작업별 권장 진행 시간")).not.toBeInTheDocument();
    expect(resultQueries.queryByText("지금 권장 흐름")).not.toBeInTheDocument();
  });

  it("links official reference material from the result guidance box", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    const guidanceBox = (await screen.findByText("계산 근거와 공식 참고")).closest("div");
    expect(guidanceBox).not.toBeNull();
    const guidanceQueries = within(guidanceBox as HTMLElement);

    expect(
      guidanceQueries.getByText(/AI Pacer는 공식 사용량 추적기가 아니라/)
    ).toBeInTheDocument();
    expect(
      guidanceQueries.getByRole("link", { name: "OpenAI Codex 사용 한도" })
    ).toHaveAttribute(
      "href",
      "https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan"
    );
    expect(
      guidanceQueries.getByRole("link", { name: "OpenAI Codex 가격/한도표" })
    ).toHaveAttribute("href", "https://developers.openai.com/codex/pricing");
    expect(
      guidanceQueries.getByRole("link", { name: "Claude Code 사용량 문서" })
    ).toHaveAttribute("href", "https://docs.anthropic.com/en/docs/claude-code/costs");
    expect(
      guidanceQueries.getByRole("link", { name: "Claude Pro 사용량 도움말" })
    ).toHaveAttribute(
      "href",
      "https://support.claude.com/en/articles/8324991-about-claude-s-pro-plan-usage"
    );
    expect(guidanceQueries.getAllByRole("link")[0]).toHaveAttribute(
      "rel",
      expect.stringContaining("noreferrer")
    );
  });

  it("shows a scenario comparison chart instead of only one fixed session judgment", async () => {
    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");

    fireEvent.change(screen.getByLabelText(/5시간 세션 표시값/), {
      target: { value: "85" }
    });
    fireEvent.change(screen.getByLabelText(/주간 표시값/), {
      target: { value: "60" }
    });
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect(await screen.findByText("작업별 권장 진행 시간")).toBeInTheDocument();
    expect(screen.getByText(/완료 보장이 아니라/)).toBeInTheDocument();
    expect(screen.getByText("간단 질문")).toBeInTheDocument();
    expect(screen.getByText("간단 함수 수정")).toBeInTheDocument();
    expect(screen.getByText("큰 단위 소스 분석/수정")).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar", { name: /권장 진행 시간/ })).toHaveLength(3);
  });

  it("keeps the tracking dashboard scoped to the latest tool and today's records", async () => {
    seedSnapshots([
      {
        id: "codex-latest",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-06-30T10:00:00+09:00",
        sessionRemainingPct: 84,
        weeklyRemainingPct: 60,
        weeklyResetAt: "2026-07-06T07:00",
        dailySessionTarget: 3,
        taskRiskType: "normal"
      },
      {
        id: "claude-today",
        providerType: "claude-code",
        providerName: "Claude Code",
        createdAt: "2026-06-30T09:30:00+09:00",
        sessionRemainingPct: 40,
        weeklyRemainingPct: 95,
        weeklyResetAt: "2026-07-04T09:30",
        dailySessionTarget: 1,
        taskRiskType: "normal"
      },
      {
        id: "codex-today-first",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-06-30T08:00:00+09:00",
        sessionRemainingPct: 92,
        weeklyRemainingPct: 75,
        weeklyResetAt: "2026-07-06T07:00",
        dailySessionTarget: 3,
        taskRiskType: "normal"
      },
      {
        id: "codex-yesterday",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-06-29T22:00:00+09:00",
        sessionRemainingPct: 96,
        weeklyRemainingPct: 90,
        weeklyResetAt: "2026-07-06T07:00",
        dailySessionTarget: 3,
        taskRiskType: "normal"
      }
    ]);

    render(<AiPacerApp />);

    const trackingSection = (await screen.findByRole("heading", {
      name: "추적 대시보드"
    })).closest("section");
    expect(trackingSection).not.toBeNull();
    const trackingQueries = within(trackingSection as HTMLElement);

    expect(trackingQueries.getByText("오늘 같은 도구 기록")).toBeInTheDocument();
    expect(trackingQueries.getByText("2개")).toBeInTheDocument();
    expect(trackingQueries.getByText("15.0%")).toBeInTheDocument();
    expect(trackingQueries.getByText("이번 주 사용 효율")).toBeInTheDocument();
    expect(
      trackingQueries.getByRole("img", { name: "Codex 주간 잔여율 추세" })
    ).toBeInTheDocument();
  });

  it("lets the tracking dashboard switch between saved provider records", async () => {
    seedSnapshots([
      {
        id: "codex-latest",
        weekId: "codex-week",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-06-30T10:00:00+09:00",
        sessionRemainingPct: 80,
        weeklyRemainingPct: 60,
        weeklyResetAt: "2026-07-06T07:00",
        dailySessionTarget: 2,
        taskRiskType: "normal"
      },
      {
        id: "claude-latest",
        weekId: "claude-week",
        providerType: "claude-code",
        providerName: "Claude Code",
        createdAt: "2026-06-30T09:30:00+09:00",
        sessionRemainingPct: 50,
        weeklyRemainingPct: 70,
        weeklyResetAt: "2026-07-04T08:00",
        dailySessionTarget: 1,
        taskRiskType: "normal"
      },
      {
        id: "claude-first",
        weekId: "claude-week",
        providerType: "claude-code",
        providerName: "Claude Code",
        createdAt: "2026-06-30T08:30:00+09:00",
        sessionRemainingPct: 60,
        weeklyRemainingPct: 90,
        weeklyResetAt: "2026-07-04T08:00",
        dailySessionTarget: 1,
        taskRiskType: "normal"
      }
    ]);

    render(<AiPacerApp />);

    const dashboard = (await screen.findByRole("heading", {
      name: "추적 대시보드"
    })).closest("section");
    expect(dashboard).not.toBeNull();
    const dashboardQueries = within(dashboard as HTMLElement);

    expect(dashboardQueries.getByLabelText("추적 도구 선택")).toHaveValue("codex");
    expect(dashboardQueries.getByText("선택 도구")).toBeInTheDocument();
    expect(dashboardQueries.getByText("Codex")).toBeInTheDocument();
    expect(dashboardQueries.getByRole("img", { name: "Codex 주간 잔여율 추세" })).toBeInTheDocument();

    fireEvent.change(dashboardQueries.getByLabelText("추적 도구 선택"), {
      target: { value: "claude-code" }
    });

    expect(dashboardQueries.getByText("Claude Code")).toBeInTheDocument();
    expect(dashboardQueries.getAllByText("20.0%").length).toBeGreaterThan(0);
    expect(dashboardQueries.getByRole("img", { name: "Claude Code 주간 잔여율 추세" })).toBeInTheDocument();
  });

  it("shows a storage warning when snapshot persistence fails", async () => {
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      if (key === STORAGE_KEYS.snapshots) {
        throw new Error("quota");
      }

      originalSetItem(key, value);
    });

    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect(await screen.findByText("저장소 안내")).toBeInTheDocument();
    expect(screen.getByText(/기록 저장에 실패했습니다/)).toBeInTheDocument();
  });

  it("shows a storage warning when form settings cannot be saved", async () => {
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    let shouldFailSettings = false;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      if (key === STORAGE_KEYS.settings && shouldFailSettings) {
        throw new Error("quota");
      }

      originalSetItem(key, value);
    });

    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");
    shouldFailSettings = true;
    fireEvent.change(screen.getByLabelText("메모"), {
      target: { value: "설정 저장 실패 확인" }
    });

    expect(await screen.findByText("저장소 안내")).toBeInTheDocument();
    expect(screen.getByText(/설정 저장에 실패했습니다/)).toBeInTheDocument();
  });

  it("shows a storage warning when provider profiles cannot be saved", async () => {
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    let shouldFailProfiles = false;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      if (key === STORAGE_KEYS.providerProfiles && shouldFailProfiles) {
        throw new Error("quota");
      }

      originalSetItem(key, value);
    });

    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");
    fireEvent.click(screen.getByRole("button", { name: "주간 설정 열기" }));
    shouldFailProfiles = true;
    fireEvent.change(screen.getByLabelText(/하루 5시간 세션 소진 목표/), {
      target: { value: "3" }
    });

    expect(await screen.findByText("저장소 안내")).toBeInTheDocument();
    expect(screen.getByText(/도구별 프로필 저장에 실패했습니다/)).toBeInTheDocument();
  });

  it("warns when the latest recommendation cannot be restored later", async () => {
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      if (key === STORAGE_KEYS.lastRecommendation) {
        throw new Error("quota");
      }

      originalSetItem(key, value);
    });

    render(<AiPacerApp />);

    await screen.findByText("서비스 화면에 보이는 숫자를 그대로 입력하세요");
    fireEvent.click(screen.getByRole("button", { name: "지금 페이스 계산하기" }));

    expect(await screen.findByText("저장소 안내")).toBeInTheDocument();
    expect(
      screen.getByText(/마지막 계산 결과 저장에 실패했습니다/)
    ).toBeInTheDocument();
  });

  it("explains why the test notification button is unavailable without permission", async () => {
    installNotificationMock("denied");

    render(<AiPacerApp />);

    expect((await screen.findAllByText("denied")).length).toBeGreaterThan(0);

    const testButton = screen.getByRole("button", { name: "테스트 알림 보내기" });
    expect(testButton).toBeDisabled();
    expect(testButton).toHaveAttribute("aria-describedby", "testNotificationHint");
    expect(
      screen.getByText("테스트 알림은 브라우저 권한이 granted일 때만 보낼 수 있습니다.")
    ).toBeInTheDocument();
  });

  it("explains unsupported Notification API without offering impossible permission actions", async () => {
    render(<AiPacerApp />);

    expect(
      await screen.findByText("이 브라우저는 Notification API를 지원하지 않습니다.")
    ).toBeInTheDocument();

    const requestButton = screen.getByRole("button", {
      name: "브라우저 알림 권한 요청"
    });
    const testButton = screen.getByRole("button", {
      name: "테스트 알림 보내기"
    });

    expect(requestButton).toBeDisabled();
    expect(requestButton).toHaveAttribute(
      "aria-describedby",
      "notificationUnsupportedHint"
    );
    expect(testButton).toBeDisabled();
    expect(testButton).toHaveAttribute(
      "aria-describedby",
      "testNotificationHint"
    );
    expect(
      screen.getByText(
        "이 브라우저는 Notification API를 지원하지 않아 권한 요청이나 테스트 알림을 사용할 수 없습니다."
      )
    ).toBeInTheDocument();
  });

  it("requests notification permission and sends a test notification when granted", async () => {
    const notificationMock = installNotificationMock("default", "granted");

    render(<AiPacerApp />);

    expect((await screen.findAllByText("default")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "브라우저 알림 권한 요청" }));

    await waitFor(() => expect(notificationMock.requestPermission).toHaveBeenCalledTimes(1));
    expect((await screen.findAllByText("granted")).length).toBeGreaterThan(0);

    const notificationConstructor = vi.fn();
    Object.assign(window.Notification, {
      permission: "granted",
      requestPermission: notificationMock.requestPermission
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      writable: true,
      value: Object.assign(notificationConstructor, {
        permission: "granted",
        requestPermission: notificationMock.requestPermission
      })
    });

    fireEvent.click(screen.getByRole("button", { name: "테스트 알림 보내기" }));

    expect(notificationConstructor).toHaveBeenCalledWith("AI Pacer 테스트 알림", {
      body: "작업 후 잔여율을 다시 입력해 페이스를 점검해보세요."
    });
    expect(await screen.findByText(/최근 테스트 알림:/)).toBeInTheDocument();
  });
});
