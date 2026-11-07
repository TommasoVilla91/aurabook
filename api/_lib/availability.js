const dailyAvailabilityRules = {
  1: { start: '15:30', end: '20:30' },
  2: { start: '13:00', end: '20:00' },
  3: { start: '08:00', end: '11:00' },
  4: { start: '13:00', end: '20:00' },
  5: [{ start: '08:00', end: '09:00' }, { start: '13:00', end: '20:00' }],
  6: { start: '09:00', end: '12:00' },
  0: null,
};

export const getItalianUTCOffsetHours = (dateString) => {
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

const eventStart = (event) =>
  event.start?.dateTime ? new Date(event.start.dateTime) : new Date(`${event.start?.date}T00:00:00Z`);

const eventEnd = (event) =>
  event.end?.dateTime ? new Date(event.end.dateTime) : new Date(`${event.end?.date}T00:00:00Z`);

// `events` sono gli eventi Google Calendar che toccano il giorno richiesto.
export function computeSlotsForDate(dateString, events) {
  // transparency = transparent: promemoria personali marcati "Libero", non bloccano slot.
  const busyEvents = events.filter((e) => e.transparency !== 'transparent');

  const isVacationDay = busyEvents.some(
    (e) => !e.start?.dateTime && e.extendedProperties?.private?.aurabookType === 'vacation'
  );
  if (isVacationDay) return [];

  const italianOffset = getItalianUTCOffsetHours(dateString);

  // Gli slot dell'override sono già in orario italiano, filterPastSlots lavora in UTC.
  const overrideEvent = busyEvents.find(
    (e) => !e.start?.dateTime && e.extendedProperties?.private?.aurabookType === 'slot-override'
  );
  if (overrideEvent) {
    const overrideSlots = JSON.parse(overrideEvent.extendedProperties.private.slots || '[]');
    const overrideSlotsUTC = overrideSlots.map((s) => {
      const [h, m] = s.split(':').map(Number);
      return `${String(h - italianOffset).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    });
    return filterPastSlots(overrideSlotsUTC, dateString).map((s) => {
      const [h, m] = s.split(':').map(Number);
      return `${String(h + italianOffset).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    });
  }

  const freeSlots = filterPastSlots(generateBaseTimeSlots(dateString), dateString).filter((slotTime) => {
    const slotStart = new Date(`${dateString}T${slotTime}:00Z`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
    return !busyEvents.some(
      (event) => eventStart(event).getTime() < slotEnd.getTime() && eventEnd(event).getTime() > slotStart.getTime()
    );
  });

  return freeSlots.map((utcSlot) => {
    const [h, m] = utcSlot.split(':').map(Number);
    return `${(h + italianOffset).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });
}

// Eventi che toccano il giorno [00:00Z, 24:00Z), come la query per singolo giorno fatta a Google.
// Un evento all-day copre solo le date comprese tra start.date (incluso) e end.date (escluso).
export function eventsForDate(events, dateString) {
  const dayStart = new Date(`${dateString}T00:00:00Z`).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return events.filter((e) => eventStart(e).getTime() < dayEnd && eventEnd(e).getTime() > dayStart);
}
