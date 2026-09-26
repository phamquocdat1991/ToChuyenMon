/**
 * Tiện ích xuất file lịch chuẩn iCalendar (.ics) RFC 5545
 * Giúp giáo viên đồng bộ 1-chạm lịch họp tổ, lịch dự giờ, lịch kiểm tra hồ sơ
 * vào Google Calendar, Apple Calendar (iPhone), Outlook hoặc smartphone.
 */

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  durationMinutes?: number;
  location?: string;
  organizer?: string;
  url?: string;
}

function formatDateToICS(dateStr: string, timeStr?: string): string {
  // e.g. 2026-09-15 and 14:00 -> 20260915T070000Z (UTC or local)
  // Clean dateStr: 2026-09-15
  const cleanDate = dateStr.replace(/[^0-9]/g, '');
  if (!cleanDate || cleanDate.length < 8) {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  const d = cleanDate.slice(0, 8); // YYYYMMDD
  if (!timeStr) {
    // All day event: VALUE=DATE:YYYYMMDD
    return d;
  }

  const cleanTime = timeStr.replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);
  return `${d}T${cleanTime}00`;
}

function escapeICS(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateICSContent(events: CalendarEventItem[], calendarName = 'Lịch Tổ Chuyên Môn 360'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//To Chuyen Mon 360//Lich Chuyen Mon//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ];

  events.forEach(e => {
    if (!e.startDate) return;
    const isAllDay = !e.startTime;
    const dtStart = formatDateToICS(e.startDate, e.startTime);
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${e.id || 'evt-' + Math.random().toString(36).slice(2)}@tochuyenmon.edu.vn`);
    lines.push(`DTSTAMP:${formatDateToICS(new Date().toISOString().slice(0, 10), '00:00')}Z`);
    
    if (isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    } else {
      lines.push(`DTSTART:${dtStart}`);
      // Default duration 60 mins
      const duration = e.durationMinutes || 90;
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      lines.push(`DURATION:PT${hours ? hours + 'H' : ''}${mins ? mins + 'M' : ''}`);
    }

    lines.push(`SUMMARY:${escapeICS(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeICS(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeICS(e.location)}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICSFile(filename: string, events: CalendarEventItem[], calName?: string) {
  const content = generateICSContent(events, calName);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : filename + '.ics';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}
