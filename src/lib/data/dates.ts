import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { ISODate } from "./types";

export const toISODate = (d: Date): ISODate => format(d, "yyyy-MM-dd");
export const todayISO = (): ISODate => toISODate(new Date());
export const parseDate = (d: ISODate) => parseISO(d);
export const shiftDate = (d: ISODate, days: number): ISODate => toISODate(addDays(parseISO(d), days));
export const daysBetween = (from: ISODate, to: ISODate) =>
  differenceInCalendarDays(parseISO(to), parseISO(from));
export const daysUntil = (d: ISODate, today: ISODate = todayISO()) => daysBetween(today, d);

export function formatShort(d: ISODate | null | undefined) {
  if (!d) return "—";
  return format(parseISO(d), "MMM d");
}
export function formatLong(d: ISODate | null | undefined) {
  if (!d) return "—";
  return format(parseISO(d), "yyyy.MM.dd");
}

export function relativeLabel(d: ISODate, today: ISODate = todayISO()) {
  const n = daysBetween(today, d);
  if (n === 0) return "今天";
  if (n === 1) return "明天";
  if (n === -1) return "昨天";
  if (n < 0) return `逾期 ${-n} 天`;
  return `${n} 天后`;
}
