const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short"
});

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "날짜 정보를 확인해주세요.";
  }

  return DATE_TIME_FORMATTER.format(date);
}

export function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function buildDefaultWeeklyResetAt(now = new Date()): string {
  const next = new Date(now);
  next.setDate(now.getDate() + 3);
  next.setHours(9, 0, 0, 0);

  return toDateTimeLocalValue(next);
}

export function isSameLocalDay(date: Date, compare: Date): boolean {
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatHoursUntilReset(value: number): string {
  if (value <= 0) {
    return "리셋 시각이 지났습니다";
  }

  const wholeHours = Math.floor(value);
  const remainingMinutes = Math.round((value - wholeHours) * 60);

  if (wholeHours >= 24) {
    const days = Math.floor(wholeHours / 24);
    const hours = wholeHours % 24;
    return `${days}일 ${hours}시간`;
  }

  return `${wholeHours}시간 ${remainingMinutes}분`;
}
