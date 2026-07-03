import { useState } from "react";

import { formatDateTime } from "../lib/date";
import type {
  ActiveProviderType,
  ProviderProfile,
  ProviderProfiles
} from "../lib/types";

type Props = {
  activeProviderType: ActiveProviderType;
  profiles: ProviderProfiles;
  weekNotice: string;
  onChangeProfile: (
    providerType: ActiveProviderType,
    profile: ProviderProfile
  ) => void;
  onStartNewWeek: (providerType: ActiveProviderType) => void;
};

function formatWeekStartedAt(value: string): string {
  return value ? formatDateTime(value) : "아직 명시적으로 시작하지 않음";
}

export default function WeeklySettingsPanel({
  activeProviderType,
  profiles,
  weekNotice,
  onChangeProfile,
  onStartNewWeek
}: Props) {
  const profile = profiles[activeProviderType];
  const [isOpen, setIsOpen] = useState(false);

  const updateProfile = <Key extends keyof ProviderProfile>(
    key: Key,
    value: ProviderProfile[Key]
  ) => {
    onChangeProfile(activeProviderType, {
      ...profile,
      [key]: value
    });
  };

  return (
    <section className="card weekly-settings-card">
      <div className="content-stack">
        <div className="weekly-settings-head">
          <div>
            <p className="eyebrow">주간 설정</p>
            <h2>도구별 주간 기준값을 분리 관리합니다</h2>
            <p className="muted">
              매번 입력하는 잔여율과 달리, 주간 리셋과 하루 소진 목표는 현재 선택한 도구의 기준값으로 따로 저장됩니다.
            </p>
          </div>
          <button
            className="button button-secondary"
            type="button"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? "주간 설정 닫기" : "주간 설정 열기"}
          </button>
        </div>

        <div className="data-grid weekly-summary-grid">
          <div className="metric">
            <span>관리 중인 도구</span>
            <strong>{profile.providerName}</strong>
          </div>
          <div className="metric">
            <span>설정 목표 세션</span>
            <strong>{profile.dailySessionTarget}회</strong>
          </div>
          <div className="metric">
            <span>주사용시간</span>
            <strong>
              {profile.workdayStart}~{profile.workdayEnd}
            </strong>
          </div>
          <div className="metric">
            <span>현재 주간</span>
            <strong>{profile.weekId}</strong>
          </div>
        </div>

        {isOpen ? (
          <div className="weekly-settings-panel">
            <div className="inline-note">
              <strong>{profile.providerName} 기준값을 관리 중입니다.</strong>
              <p>
                주간 시작: {formatWeekStartedAt(profile.weekStartedAt)}
              </p>
            </div>

            <div className="field-row">
              <label htmlFor="weeklySettingsResetAt">
                주간 리셋 일시
                <input
                  id="weeklySettingsResetAt"
                  type="datetime-local"
                  value={profile.weeklyResetAt}
                  onChange={(event) =>
                    updateProfile("weeklyResetAt", event.target.value)
                  }
                />
                <span className="field-hint">
                  이 값은 현재 도구의 주간 계산 기준으로만 저장됩니다.
                </span>
              </label>

              <label htmlFor="weeklySettingsDailyTarget">
                하루 5시간 세션 소진 목표
                <input
                  id="weeklySettingsDailyTarget"
                  type="number"
                  min="1"
                  max="6"
                  step="1"
                  value={profile.dailySessionTarget}
                  onChange={(event) =>
                    updateProfile("dailySessionTarget", Number(event.target.value))
                  }
                />
                <span className="field-hint">
                  하루에 5시간 세션을 몇 번 정도 끝까지 쓸 계획인지 적습니다.
                </span>
              </label>
            </div>

            <div className="field-row">
              <label htmlFor="weeklySettingsWorkdayStart">
                주 사용 시작
                <input
                  id="weeklySettingsWorkdayStart"
                  type="time"
                  value={profile.workdayStart}
                  onChange={(event) =>
                    updateProfile("workdayStart", event.target.value)
                  }
                />
              </label>

              <label htmlFor="weeklySettingsWorkdayEnd">
                주 사용 종료
                <input
                  id="weeklySettingsWorkdayEnd"
                  type="time"
                  value={profile.workdayEnd}
                  onChange={(event) =>
                    updateProfile("workdayEnd", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="button-row">
              <button
                className="button button-secondary"
                type="button"
                onClick={() => onStartNewWeek(activeProviderType)}
              >
                새 주간 시작
              </button>
            </div>
          </div>
        ) : null}

        {weekNotice ? (
          <div className="inline-note" role="status">
            <strong>{weekNotice}</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}
