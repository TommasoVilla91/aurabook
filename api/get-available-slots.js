import { getAuthorizedCalendar } from './lib/googleAuth.js';

const dailyAvailabilityRules = {
  1: { start: '15:30', end: '20:30' },
  2: { start: '13:00', end: '20:00' },
  3: { start: '08:00', end: '11:00' },
  4: { start: '13:00', end: '20:00' },
  5: [{ start: '08:00', end: '09:00' }, { start: '13:00', end: '20:00' }],
  6: { start: '09:00', end: '12:00' },
  0: null,
};

const getItalianUTCOffsetHours = (dateString) => {
  const testDate = new Date(`${dateString}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(testDate);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName');
  if (offsetPart) {
    const match = offsetPart.value.match(/GMT([+-]\d+)/);
    if (match && match[1]) return parseInt(match[1], 10);
  }
  return 0;
};

const generateSlotsForRange = (range, date, italianOffsetHours) => {
  const [startHour, startMinute] = range.start.split(':').map(Number);
  const [endHour, endMinute] = range.end.split(':').map(Number);
  const [year, month, day] = date.split('-').map(Number);

  let currentTime = new Date(Date.UTC(year, month - 1, day, startHour - italianOffsetHours, startMinute, 0));
  const endTime = new Date(Date.UTC(year, month - 1, day, endHour - italianOffsetHours, endMinute, 0));

  const slots = [];
  while (currentTime.getTime() < endTime.getTime()) {
    const h = currentTime.getUTCHours().toString().padStart(2, '0');
    const m = currentTime.getUTCMinutes().toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    currentTime.setUTCMinutes(currentTime.getUTCMinutes() + 60);
  }
  return slots;
};

const generateBaseTimeSlots = (date) => {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  const availability = dailyAvailabilityRules[dayOfWeek];
  if (!availability) return [];

  const italianOffsetHours = getItalianUTCOffsetHours(date);
  const ranges = Array.isArray(availability) ? availability : [availability];
  return ranges.flatMap((range) => generateSlotsForRange(range, date, italianOffsetHours));
};

const filterPastSlots = (slots, dateString) => {
  const now = new Date();
  const todayString = now.toISOString().split('T')[0];
  if (dateString > todayString) return slots;
  return slots.filter((slotTime) => {
    const slotDateTime = new Date(`${dateString}T${slotTime}:00Z`);
    return slotDateTime.getTime() > now.getTime();
  });
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { date: dateString } = req.body;
  if (!dateString) return res.status(400).json({ error: 'Missing date parameter' });

  let availableSlots = generateBaseTimeSlots(dateString);
  availableSlots = filterPastSlots(availableSlots, dateString);

  try {
    const calendar = await getAuthorizedCalendar(['https://www.googleapis.com/auth/calendar.events.readonly']);

    const calendarResponse = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(`${dateString}T00:00:00Z`).toISOString(),
      timeMax: new Date(`${dateString}T23:59:59.999Z`).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
    });

    const events = calendarResponse.data.items || [];

    // Ignora eventi marcati come "Libero" in Google Calendar (transparency = transparent).
    // Francesco può usare questa impostazione per promemoria personali che non bloccano slot.
    const busyEvents = events.filter((e) => e.transparency !== 'transparent');

    // Se esiste un evento all-day di tipo ferie → nessuno slot disponibile per questo giorno.
    const isVacationDay = busyEvents.some(
      (e) => !e.start?.dateTime && e.extendedProperties?.private?.aurabookType === 'vacation'
    );
    if (isVacationDay) return res.status(200).json({ slots: [] });

    // Se esiste un override slot per questo giorno → usa quegli slot al posto di quelli
    // generati da dailyAvailabilityRules. Gli slot dell'override sono in formato italiano
    // (es. "09:00") quindi li restituiamo direttamente, applicando solo filterPastSlots.
    const overrideEvent = busyEvents.find(
      (e) => !e.start?.dateTime && e.extendedProperties?.private?.aurabookType === 'slot-override'
    );
    if (overrideEvent) {
      let overrideSlots = JSON.parse(overrideEvent.extendedProperties.private.slots || '[]');
      // filterPastSlots si aspetta slot in UTC, ma gli override sono in italiano.
      // Convertiamo sottraendo l'offset per il confronto con now (che è UTC).
      const italianOff = getItalianUTCOffsetHours(dateString);
      const overrideSlotsUTC = overrideSlots.map((s) => {
        const [h, m] = s.split(':').map(Number);
        return `${String(h - italianOff).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      });
      const filteredUTC = filterPastSlots(overrideSlotsUTC, dateString);
      // Riconverte in italiano
      const filteredIT = filteredUTC.map((s) => {
        const [h, m] = s.split(':').map(Number);
        return `${String(h + italianOff).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      });
      return res.status(200).json({ slots: filteredIT });
    }

    const finalSlots = availableSlots.filter((slotTime) => {
      const slotStart = new Date(`${dateString}T${slotTime}:00Z`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      return !busyEvents.some((event) => {
        const eStart = event.start?.dateTime
          ? new Date(event.start.dateTime)
          : new Date(`${event.start?.date}T00:00:00Z`);
        const eEnd = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : new Date(`${event.end?.date}T00:00:00Z`);
        return eStart.getTime() < slotEnd.getTime() && eEnd.getTime() > slotStart.getTime();
      });
    });

    const italianOffset = getItalianUTCOffsetHours(dateString);
    const finalSlotsItalian = finalSlots.map((utcSlot) => {
      const [h, m] = utcSlot.split(':').map(Number);
      return `${(h + italianOffset).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    });

    return res.status(200).json({ slots: finalSlotsItalian });
  } catch (error) {
    console.error('get-available-slots error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve available slots', details: error.message });
  }
}
