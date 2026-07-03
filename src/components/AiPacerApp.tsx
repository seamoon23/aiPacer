import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import HeroPaceDashboard from "./HeroPaceDashboard";
import NotificationSettings from "./NotificationSettings";
import ProviderRaceDashboard from "./ProviderRaceDashboard";
import RecommendationCard from "./RecommendationCard";
import SnapshotHistory from "./SnapshotHistory";
import TrackingDashboard from "./TrackingDashboard";
import UsageInputForm from "./UsageInputForm";
import WeeklySettingsPanel from "./WeeklySettingsPanel";
import { buildDefaultWeeklyResetAt, formatPercent } from "../lib/date";
import {
  DEFAULT_PROVIDER_PROFILES,
  clearSnapshots,
  loadLastRecommendation,
  loadNotificationSettings,
  loadProviderProfiles,
  loadSettings,
  loadSnapshots,
  saveLastRecommendation,
  saveNotificationSettings,
  saveProviderProfiles,
  saveSettings,
  saveSnapshot,
  removeSnapshot,
  updateSnapshot
} from "../lib/storage";
import {
  getProviderUsageDirection,
  normalizeDisplayedUsageValue
} from "../lib/providerDisplay";
import { calculateUsageRecommendation } from "../lib/usageCalculator";
import type {
  ActiveProviderType,
  NotificationSettings as NotificationSettingsType,
  ProviderProfile,
  ProviderProfiles,
  ProviderType,
  UsageFormSettings,
  UsageRecommendation,
  UsageSnapshot
} from "../lib/types";

const DEFAULT_FORM: UsageFormSettings = {
  providerType: "codex",
  providerName: "Codex",
  sessionRemainingPct: 80,
  weeklyRemainingPct: 70,
  weeklyResetAt: "",
  dailySessionTarget: 2,
  taskRiskType: "normal",
  memo: "",
  inputModeVersion: 2
};

type HeroCoachCopy = {
  eyebrow: string;
  title: string;
  body: string;
};

type UtilityDisclosureProps = {
  badge: string;
  title: string;
  summary: string;
  testId: string;
  children: ReactNode;
};

function UtilityDisclosure({
  badge,
  title,
  summary,
  testId,
  children
}: UtilityDisclosureProps) {
  return (
    <details className="utility-disclosure" data-testid={testId}>
      <summary className="utility-summary">
        <span className="utility-badge" aria-hidden="true">
          {badge}
        </span>
        <span>
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
      </summary>
      <div className="utility-disclosure-body">{children}</div>
    </details>
  );
}

function getProviderName(form: UsageFormSettings): string {
  return form.providerName;
}

function getDefaultProviderName(providerType: ActiveProviderType): string {
  return DEFAULT_PROVIDER_PROFILES[providerType].providerName;
}

function toActiveProviderType(providerType: ProviderType): ActiveProviderType {
  if (providerType === "claude" || providerType === "claude-code") {
    return "claude-code";
  }

  return "codex";
}

function buildWeekId(providerType: ActiveProviderType, now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${providerType}-${year}${month}${day}-${hours}${minutes}`;
}

function withProviderDefaults(
  providerType: ActiveProviderType,
  profile: ProviderProfile
): ProviderProfile {
  return {
    ...DEFAULT_PROVIDER_PROFILES[providerType],
    ...profile,
    providerType,
    providerName: profile.providerName || getDefaultProviderName(providerType),
    weekId: profile.weekId || buildWeekId(providerType),
    weeklyResetAt: profile.weeklyResetAt || buildDefaultWeeklyResetAt()
  };
}

function withProfileDefaults(profiles: ProviderProfiles): ProviderProfiles {
  return {
    codex: withProviderDefaults("codex", profiles.codex),
    "claude-code": withProviderDefaults("claude-code", profiles["claude-code"])
  };
}

function buildFormForProvider(
  form: UsageFormSettings,
  providerType: ActiveProviderType,
  profiles: ProviderProfiles
): UsageFormSettings {
  const profile = withProviderDefaults(providerType, profiles[providerType]);

  return {
    ...form,
    providerType,
    providerName: profile.providerName || getDefaultProviderName(providerType),
    weeklyResetAt: profile.weeklyResetAt || buildDefaultWeeklyResetAt(),
    dailySessionTarget: profile.dailySessionTarget,
    inputModeVersion: 2
  };
}

function getCalculationSnapshots(
  snapshots: UsageSnapshot[],
  providerType: ActiveProviderType,
  weekId: string
): UsageSnapshot[] {
  return snapshots.filter((snapshot) => {
    const sameProvider = toActiveProviderType(snapshot.providerType) === providerType;

    if (!sameProvider) {
      return false;
    }

    if (!snapshot.weekId) {
      return true;
    }

    return snapshot.weekId === weekId;
  });
}

function getLatestSnapshot(snapshots: UsageSnapshot[]): UsageSnapshot | null {
  return snapshots[0] ?? null;
}

function buildHeroCopy(
  snapshots: UsageSnapshot[],
  recommendation: UsageRecommendation | null
): HeroCoachCopy {
  const latest = getLatestSnapshot(snapshots);
  const providerLabel = latest?.providerName
    ? `${latest.providerName} 기준`
    : "현재 선택 AI 기준";

  if (snapshots.length === 0) {
    return {
      eyebrow: "AI 사용량 페이스 계산기",
      title: "오늘 어느 AI를 달릴까요?",
      body: "숫자 2개 입력하면 오늘 더 쓸 AI가 보입니다."
    };
  }

  if (recommendation) {
    const statusCopy: Record<
      UsageRecommendation["status"],
      Pick<HeroCoachCopy, "title" | "body">
    > = {
      safe: {
        title: "갈 길이 멉니다. 필요한 작업은 더 달려도 됩니다",
        body: `${providerLabel} 오늘 남은 페이스는 ${formatPercent(
          recommendation.recommendedAdditionalPct
        )}입니다. 필요한 작업은 이어가도 좋습니다.`
      },
      normal: {
        title: "흐름은 괜찮지만 중간 체크가 좋습니다",
        body: `${providerLabel} 오늘 남은 페이스는 ${formatPercent(
          recommendation.recommendedAdditionalPct
        )}입니다. 큰 흐름 전후로 한 번 더 입력하세요.`
      },
      caution: {
        title: "쉬엄쉬엄 짧게 달릴 시간입니다",
        body: `${providerLabel} 오늘 남은 페이스는 ${formatPercent(
          recommendation.recommendedAdditionalPct
        )}입니다. 짧게 끊어 진행하고 다시 입력하세요.`
      },
      danger: {
        title: "새 대형 작업은 잠시 미루세요",
        body: `${providerLabel} 오늘 남은 페이스는 ${formatPercent(
          recommendation.recommendedAdditionalPct
        )}입니다. 꼭 필요한 질문만 짧게 처리하세요.`
      }
    };

    return {
      eyebrow: "오늘의 코치",
      ...statusCopy[recommendation.status]
    };
  }

  if (!latest) {
    return {
      eyebrow: "AI 사용량 페이스 계산기",
      title: "오늘 어느 AI를 달릴까요?",
      body: "숫자 2개 입력하면 오늘 더 쓸 AI가 보입니다."
    };
  }

  const hasLowSession = latest.sessionRemainingPct < 20;
  const hasLowWeek = latest.weeklyRemainingPct < 25;
  const hasRoom = latest.sessionRemainingPct >= 65 && latest.weeklyRemainingPct >= 55;
  const body = `${latest.providerName} 기준 5시간 여유 ${formatPercent(
    latest.sessionRemainingPct
  )}, 주간 여유 ${formatPercent(latest.weeklyRemainingPct)}입니다.`;

  if (hasLowSession || hasLowWeek) {
    return {
      eyebrow: "오늘의 코치",
      title: "새 대형 작업은 잠시 미루세요",
      body: `${body} 꼭 필요한 질문만 짧게 처리하세요.`
    };
  }

  if (hasRoom) {
    return {
      eyebrow: "오늘의 코치",
      title: "갈 길이 멉니다. 필요한 작업은 더 달려도 됩니다",
      body: `${body} 지금은 아끼기보다 중요한 흐름을 밀어도 좋습니다.`
    };
  }

  return {
    eyebrow: "오늘의 코치",
    title: "흐름은 괜찮지만 중간 체크가 좋습니다",
    body: `${body} 큰 덩어리 작업 뒤에는 한 번 더 입력하세요.`
  };
}

function validateForm(form: UsageFormSettings): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(form.sessionRemainingPct) || form.sessionRemainingPct < 0 || form.sessionRemainingPct > 100) {
    errors.push("5시간 세션 표시값은 0부터 100 사이 숫자여야 합니다.");
  }

  if (!Number.isFinite(form.weeklyRemainingPct) || form.weeklyRemainingPct < 0 || form.weeklyRemainingPct > 100) {
    errors.push("주간 표시값은 0부터 100 사이 숫자여야 합니다.");
  }

  if (!form.weeklyResetAt) {
    errors.push("주간 리셋 일시를 입력해주세요.");
  }

  if (
    !Number.isFinite(form.dailySessionTarget) ||
    form.dailySessionTarget < 1 ||
    form.dailySessionTarget > 6
  ) {
    errors.push("하루 5시간 세션 소진 목표는 1부터 6 사이 숫자여야 합니다.");
  }

  return errors;
}

export default function AiPacerApp() {
  const [form, setForm] = useState<UsageFormSettings>({
    ...DEFAULT_FORM,
    weeklyResetAt: buildDefaultWeeklyResetAt()
  });
  const [snapshots, setSnapshots] = useState<UsageSnapshot[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<UsageRecommendation | null>(null);
  const [isRecommendationRestored, setIsRecommendationRestored] = useState(false);
  const [providerProfiles, setProviderProfiles] = useState<ProviderProfiles>(
    DEFAULT_PROVIDER_PROFILES
  );
  const [storageNotice, setStorageNotice] = useState<string>("");
  const [weekNotice, setWeekNotice] = useState<string>("");
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettingsType>({
      permission: "default",
      placeholderEnabled: false,
      placeholderTime: "09:00"
    });

  useEffect(() => {
    const savedSettings = loadSettings();
    const savedProfiles = withProfileDefaults(loadProviderProfiles());
    const profile = savedProfiles[savedSettings.providerType];
    const nextForm = {
      ...savedSettings,
      providerName: profile.providerName,
      weeklyResetAt:
        profile.weeklyResetAt ||
        savedSettings.weeklyResetAt ||
        buildDefaultWeeklyResetAt(),
      dailySessionTarget: profile.dailySessionTarget
    };
    const savedNotificationSettings = loadNotificationSettings();
    const savedLastRecommendation = loadLastRecommendation();
    const permission =
      typeof window !== "undefined" && "Notification" in window
        ? window.Notification.permission
        : "unsupported";

    setProviderProfiles(savedProfiles);
    setForm(nextForm);
    setSnapshots(loadSnapshots());
    if (savedLastRecommendation) {
      setRecommendation(savedLastRecommendation.recommendation);
      setIsRecommendationRestored(true);
    }
    setNotificationSettings({
      ...savedNotificationSettings,
      permission
    });
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const didSave = saveSettings(form);
    if (!didSave) {
      setStorageNotice("설정 저장에 실패했습니다. 브라우저 localStorage 사용 가능 여부를 확인해주세요.");
    }
  }, [form, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const didSave = saveProviderProfiles(providerProfiles);
    if (!didSave) {
      setStorageNotice("도구별 프로필 저장에 실패했습니다. 브라우저 localStorage 사용 가능 여부를 확인해주세요.");
    }
  }, [providerProfiles, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const didSave = saveNotificationSettings(notificationSettings);
    if (!didSave) {
      setStorageNotice("알림 설정 저장에 실패했습니다. 브라우저 localStorage 접근을 확인해주세요.");
    }
  }, [notificationSettings, isHydrated]);

  const handleFormChange = (nextForm: UsageFormSettings) => {
    if (nextForm.providerType !== form.providerType) {
      const nextProviderForm = buildFormForProvider(
        nextForm,
        nextForm.providerType,
        providerProfiles
      );
      setForm(nextProviderForm);
      return;
    }

    setForm(nextForm);
  };

  const handleProfileChange = (
    providerType: ActiveProviderType,
    profile: ProviderProfile
  ) => {
    const nextProfile = withProviderDefaults(providerType, profile);
    const nextProfiles = {
      ...providerProfiles,
      [providerType]: nextProfile
    };

    setProviderProfiles(nextProfiles);
    setWeekNotice("");

    if (form.providerType === providerType) {
      setForm((current) => buildFormForProvider(current, providerType, nextProfiles));
    }
  };

  const handleStartNewWeek = (providerType: ActiveProviderType) => {
    const now = new Date();
    const currentProfile = withProviderDefaults(
      providerType,
      providerProfiles[providerType]
    );
    const nextProfile: ProviderProfile = {
      ...currentProfile,
      weekId: buildWeekId(providerType, now),
      weekStartedAt: now.toISOString(),
      weeklyResetAt: buildDefaultWeeklyResetAt(now)
    };

    handleProfileChange(providerType, nextProfile);
    setWeekNotice(`${nextProfile.providerName} 새 주간이 생성되었습니다.`);
  };

  const handleSubmit = () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (nextErrors.length > 0) {
      return;
    }

    const normalizedSessionRemainingPct = normalizeDisplayedUsageValue(
      form.providerType,
      form.sessionRemainingPct
    );
    const normalizedWeeklyRemainingPct = normalizeDisplayedUsageValue(
      form.providerType,
      form.weeklyRemainingPct
    );
    const activeProfile = withProviderDefaults(
      form.providerType,
      providerProfiles[form.providerType]
    );
    const editingSnapshot = editingSnapshotId
      ? snapshots.find((snapshot) => snapshot.id === editingSnapshotId) ?? null
      : null;

    if (editingSnapshotId && !editingSnapshot) {
      setEditingSnapshotId(null);
      setStorageNotice(
        "수정할 기록을 찾지 못했습니다. 최근 기록에서 다시 수정하기를 눌러주세요."
      );
      return;
    }

    const didChangeProviderWhileEditing =
      editingSnapshot &&
      toActiveProviderType(editingSnapshot.providerType) !== form.providerType;
    const snapshotWeekId =
      editingSnapshot && !didChangeProviderWhileEditing
        ? editingSnapshot.weekId ?? activeProfile.weekId
        : activeProfile.weekId;
    const snapshotWeeklyResetAt =
      editingSnapshot && !didChangeProviderWhileEditing
        ? editingSnapshot.weeklyResetAt || activeProfile.weeklyResetAt
        : activeProfile.weeklyResetAt;
    const snapshotDailySessionTarget =
      editingSnapshot && !didChangeProviderWhileEditing
        ? editingSnapshot.dailySessionTarget ?? activeProfile.dailySessionTarget
        : activeProfile.dailySessionTarget;
    const snapshotWorkdayStart =
      editingSnapshot && !didChangeProviderWhileEditing
        ? editingSnapshot.workdayStart ?? activeProfile.workdayStart
        : activeProfile.workdayStart;
    const snapshotWorkdayEnd =
      editingSnapshot && !didChangeProviderWhileEditing
        ? editingSnapshot.workdayEnd ?? activeProfile.workdayEnd
        : activeProfile.workdayEnd;

    const snapshot: UsageSnapshot = {
      id: editingSnapshot?.id ?? crypto.randomUUID(),
      weekId: snapshotWeekId,
      providerType: form.providerType,
      providerName: getProviderName(form),
      createdAt: editingSnapshot?.createdAt ?? new Date().toISOString(),
      sessionRemainingPct: normalizedSessionRemainingPct,
      weeklyRemainingPct: normalizedWeeklyRemainingPct,
      sessionDisplayPct: form.sessionRemainingPct,
      weeklyDisplayPct: form.weeklyRemainingPct,
      inputDirection: getProviderUsageDirection(form.providerType),
      weeklyResetAt: snapshotWeeklyResetAt,
      dailySessionTarget: snapshotDailySessionTarget,
      workdayStart: snapshotWorkdayStart,
      workdayEnd: snapshotWorkdayEnd,
      taskRiskType: form.taskRiskType,
      memo: form.memo.trim() || undefined
    };

    const calculationSourceSnapshots = editingSnapshot
      ? snapshots.map((currentSnapshot) =>
          currentSnapshot.id === editingSnapshot.id ? snapshot : currentSnapshot
        )
      : snapshots;
    const calculationSnapshots = getCalculationSnapshots(
      calculationSourceSnapshots,
      form.providerType,
      snapshotWeekId
    );
    const recommendationResult = calculateUsageRecommendation(
      {
        sessionRemainingPct: normalizedSessionRemainingPct,
        weeklyRemainingPct: normalizedWeeklyRemainingPct,
        weeklyResetAt: snapshotWeeklyResetAt,
        dailySessionTarget: snapshotDailySessionTarget,
        workdayStart: snapshotWorkdayStart,
        workdayEnd: snapshotWorkdayEnd
      },
      calculationSnapshots
    );
    const { persisted, snapshots: nextSnapshots } = editingSnapshot
      ? updateSnapshot(snapshot)
      : saveSnapshot(snapshot);
    setSnapshots(nextSnapshots);
    setRecommendation(recommendationResult);
    setIsRecommendationRestored(false);
    setEditingSnapshotId(null);
    const didSaveLastRecommendation = saveLastRecommendation({
      savedAt: new Date().toISOString(),
      providerType: form.providerType,
      recommendation: recommendationResult
    });

    if (!persisted) {
      setStorageNotice("기록 저장에 실패했습니다. 브라우저에서 localStorage가 차단됐을 수 있습니다.");
    } else if (!didSaveLastRecommendation) {
      setStorageNotice(
        "마지막 계산 결과 저장에 실패했습니다. 지금 결과는 보이지만 새로고침 후 복원되지 않을 수 있습니다."
      );
    } else {
      setStorageNotice("");
    }
  };

  const handleEditSnapshot = (
    snapshot: UsageSnapshot,
    snapshotForm: UsageFormSettings
  ) => {
    setForm(
      buildFormForProvider(
        {
          ...snapshotForm,
          inputModeVersion: 2
        },
        snapshotForm.providerType,
        providerProfiles
      )
    );
    setEditingSnapshotId(snapshot.id);
    setErrors([]);
    setStorageNotice("");
  };

  const handleCancelEdit = () => {
    setEditingSnapshotId(null);
    setErrors([]);
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    const { persisted, snapshots: nextSnapshots } = removeSnapshot(snapshotId);
    setSnapshots(nextSnapshots);
    if (editingSnapshotId === snapshotId) {
      setEditingSnapshotId(null);
    }

    if (!persisted) {
      setStorageNotice("기록 삭제 저장에 실패했습니다. 브라우저 localStorage 접근 상태를 확인해주세요.");
    } else {
      setStorageNotice("");
    }
  };

  const handleClearSnapshots = () => {
    const { persisted, snapshots: nextSnapshots } = clearSnapshots();
    setSnapshots(nextSnapshots);
    setEditingSnapshotId(null);

    if (!persisted) {
      setStorageNotice("전체 삭제 저장에 실패했습니다. 브라우저 localStorage 접근 상태를 확인해주세요.");
    } else {
      setStorageNotice("");
    }
  };

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationSettings((current) => ({
        ...current,
        permission: "unsupported"
      }));
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationSettings((current) => ({ ...current, permission }));
  };

  const handleSendTestNotification = () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (window.Notification.permission !== "granted") {
      return;
    }

    const message =
      recommendation?.status === "danger"
        ? "지금은 짧은 작업 위주가 더 안전합니다."
        : "작업 후 잔여율을 다시 입력해 페이스를 점검해보세요.";

    new window.Notification("AI Pacer 테스트 알림", {
      body: message
    });

    setNotificationSettings((current) => ({
      ...current,
      lastTestAt: new Date().toISOString(),
      permission: window.Notification.permission
    }));
  };

  const heroCopy = buildHeroCopy(snapshots, recommendation);
  const isInputPanelOpen = snapshots.length === 0 || Boolean(editingSnapshotId);
  const inputPanelSummary = editingSnapshotId
    ? "수정 중인 기록 저장"
    : snapshots.length === 0
      ? "첫 잔여율 입력"
      : "새 잔여율 입력";
  const inputPanelDescription = editingSnapshotId
    ? "불러온 기록을 덮어써서 바로잡습니다."
    : snapshots.length === 0
      ? "서비스 화면 숫자 2개만 넣으면 첫 페이스가 열립니다."
      : "필요할 때만 열어 최신 잔여율을 다시 입력합니다.";

  return (
    <div className="content-stack">
      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">{heroCopy.eyebrow}</p>
            <h1>{heroCopy.title}</h1>
            <p className="lead hero-decision-copy">{heroCopy.body}</p>
          </div>

          <HeroPaceDashboard
            recommendation={recommendation}
            snapshotCount={snapshots.length}
          />
        </div>

        <ProviderRaceDashboard snapshots={snapshots} />
      </section>

      {storageNotice ? (
        <div className="warning-box" role="alert">
          <strong>저장소 안내</strong>
          <p>{storageNotice}</p>
        </div>
      ) : null}

      <div className="pacer-workbench">
        <RecommendationCard
          recommendation={recommendation}
          eyebrow={isRecommendationRestored ? "마지막 계산 결과" : "계산 결과"}
        />

        <details
          className="input-disclosure"
          data-testid="pacer-input-panel"
          open={isInputPanelOpen}
        >
          <summary className="input-summary">
            <span className="input-summary-badge" aria-hidden="true">
              IN
            </span>
            <span>
              <strong>{inputPanelSummary}</strong>
              <small>{inputPanelDescription}</small>
            </span>
          </summary>
          <div className="input-disclosure-body">
            <UsageInputForm
              form={form}
              errors={errors}
              editNotice={
                editingSnapshotId
                  ? "저장된 기록을 수정 중입니다. 저장하면 기존 기록이 새로 추가되지 않고 덮어써집니다."
                  : undefined
              }
              submitLabel={editingSnapshotId ? "수정 저장하기" : "지금 페이스 계산하기"}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              onCancelEdit={editingSnapshotId ? handleCancelEdit : undefined}
            />
            <WeeklySettingsPanel
              activeProviderType={form.providerType}
              profiles={providerProfiles}
              weekNotice={weekNotice}
              onChangeProfile={handleProfileChange}
              onStartNewWeek={handleStartNewWeek}
            />
          </div>
        </details>
      </div>

      <section className="utility-panel">
        <div>
          <p className="eyebrow">도구 패널</p>
          <h2>필요할 때만 열어보세요</h2>
          <p className="muted">
            추적, 기록 관리, 알림 설정은 매일 볼 필요가 없도록 접어두었습니다.
          </p>
        </div>

        <div className="utility-disclosure-grid">
          <UtilityDisclosure
            badge="TR"
            title="추적 대시보드"
            summary={
              snapshots.length > 0
                ? "저장된 기록의 소모 흐름과 주간 효율을 봅니다."
                : "첫 기록 이후 오늘 흐름을 보여줍니다."
            }
            testId="tracking-utility-panel"
          >
            <TrackingDashboard snapshots={snapshots} />
          </UtilityDisclosure>

          <UtilityDisclosure
            badge="LOG"
            title="기록 관리"
            summary={`${snapshots.length}개 기록 저장 중 · 수정/삭제/JSON 내보내기`}
            testId="history-utility-panel"
          >
            <SnapshotHistory
              snapshots={snapshots}
              onEditSnapshot={handleEditSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              onClearSnapshots={handleClearSnapshots}
            />
          </UtilityDisclosure>

          <UtilityDisclosure
            badge="NT"
            title="알림 설정"
            summary="권한 요청과 테스트 알림만 필요할 때 확인합니다."
            testId="notification-utility-panel"
          >
            <NotificationSettings
              settings={notificationSettings}
              onRequestPermission={handleRequestPermission}
              onSendTestNotification={handleSendTestNotification}
              onChangePlaceholderEnabled={(value) =>
                setNotificationSettings((current) => ({
                  ...current,
                  placeholderEnabled: value
                }))
              }
              onChangePlaceholderTime={(value) =>
                setNotificationSettings((current) => ({
                  ...current,
                  placeholderTime: value
                }))
              }
            />
          </UtilityDisclosure>
        </div>
      </section>
    </div>
  );
}
