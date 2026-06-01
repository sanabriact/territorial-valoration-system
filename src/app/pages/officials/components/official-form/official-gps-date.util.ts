export function toBackendDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

  const year = safeDate.getFullYear();
  const month = padDatePart(safeDate.getMonth() + 1);
  const day = padDatePart(safeDate.getDate());
  const hours = padDatePart(safeDate.getHours());
  const minutes = padDatePart(safeDate.getMinutes());
  const seconds = padDatePart(safeDate.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function toDateTimeLocalValue(value: string | Date): string {
  const date = value instanceof Date ? value : parseBackendDate(value);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const offsetMs = safeDate.getTimezoneOffset() * 60000;

  return new Date(safeDate.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseBackendDate(value: string): Date {
  return new Date(value.replace(' ', 'T'));
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}
