import { formatDateTime } from "../lib/date";
import type { NotificationSettings as NotificationSettingsType } from "../lib/types";

type Props = {
  settings: NotificationSettingsType;
  onRequestPermission: () => void;
  onSendTestNotification: () => void;
  onChangePlaceholderEnabled: (value: boolean) => void;
  onChangePlaceholderTime: (value: string) => void;
};

export default function NotificationSettings({
  settings,
  onRequestPermission,
  onSendTestNotification,
  onChangePlaceholderEnabled,
  onChangePlaceholderTime
}: Props) {
  const isUnsupported = settings.permission === "unsupported";
  const canSendTestNotification = settings.permission === "granted";
  const notificationHint = isUnsupported
    ? "이 브라우저는 Notification API를 지원하지 않아 권한 요청이나 테스트 알림을 사용할 수 없습니다."
    : "테스트 알림은 브라우저 권한이 granted일 때만 보낼 수 있습니다.";

  return (
    <section className="card">
      <div className="content-stack">
        <div>
          <p className="eyebrow">알림</p>
          <h2>권한 요청과 테스트 알림만 제공합니다</h2>
          <p className="muted">
            1차 MVP에서는 브라우저 알림 권한 요청과 테스트 발송만 지원합니다. 백그라운드 예약 알림은 이번 범위에 포함하지 않았습니다.
          </p>
        </div>

        <div className="inline-note">
          <strong>현재 권한 상태</strong>
          <p>
            {settings.permission === "unsupported"
              ? "이 브라우저는 Notification API를 지원하지 않습니다."
              : settings.permission}
          </p>
          {settings.lastTestAt ? (
            <p className="muted">최근 테스트 알림: {formatDateTime(settings.lastTestAt)}</p>
          ) : null}
        </div>

        <div className="button-row">
          <button
            className="button button-primary"
            type="button"
            onClick={onRequestPermission}
            disabled={isUnsupported}
            aria-describedby={isUnsupported ? "notificationUnsupportedHint" : undefined}
          >
            브라우저 알림 권한 요청
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={onSendTestNotification}
            disabled={!canSendTestNotification}
            aria-describedby={!canSendTestNotification ? "testNotificationHint" : undefined}
          >
            테스트 알림 보내기
          </button>
        </div>
        {!canSendTestNotification ? (
          <p className="field-hint" id="testNotificationHint">
            {isUnsupported ? (
              <span id="notificationUnsupportedHint">{notificationHint}</span>
            ) : (
              notificationHint
            )}
          </p>
        ) : null}

        <div className="field-row">
          <label htmlFor="placeholderEnabled">
            알림 설정 UI placeholder
            <select
              id="placeholderEnabled"
              value={settings.placeholderEnabled ? "enabled" : "disabled"}
              onChange={(event) =>
                onChangePlaceholderEnabled(event.target.value === "enabled")
              }
            >
              <option value="disabled">꺼짐</option>
              <option value="enabled">켜짐</option>
            </select>
          </label>

          <label htmlFor="placeholderTime">
            placeholder 시간
            <input
              id="placeholderTime"
              type="time"
              value={settings.placeholderTime}
              onChange={(event) => onChangePlaceholderTime(event.target.value)}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
