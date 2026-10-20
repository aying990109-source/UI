export const datePresetNames = ['今天', '昨天', '近7天', '近30天', '本月', '上月', '今年', '全部时间'] as const;

function civilDate(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
  const part = (type: string) => Number(parts.find(item => item.type === type)?.value);
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
}

const format = (date: Date) => date.toISOString().slice(0, 10);
const shift = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);

export function datePresetRanges(now = new Date()): string[][] {
  const today = civilDate(now);
  const year = today.getUTCFullYear(), month = today.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1));
  return [
    [format(today), format(today)],
    [format(shift(today, -1)), format(shift(today, -1))],
    [format(shift(today, -6)), format(today)],
    [format(shift(today, -29)), format(today)],
    [format(monthStart), format(new Date(Date.UTC(year, month + 1, 0)))],
    [format(new Date(Date.UTC(year, month - 1, 1))), format(shift(monthStart, -1))],
    [`${year}-01-01`, `${year}-12-31`],
    [],
  ];
}

export function matchingDatePreset(value: unknown, ranges = datePresetRanges()): number {
  if (!Array.isArray(value) || value.length !== 0 && (value.length !== 2 || value.some(item => typeof item !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item)))) return -1;
  return ranges.findIndex(range => range.length === value.length && range.every((day, index) => day === value[index]));
}
