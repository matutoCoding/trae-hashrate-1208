import { Order, TimeSlot } from '@/types'

export interface OccupiedSlot {
  orderId: string
  date: string
  startTime: string
  endTime: string
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function canMergeSlots(
  slot1: { startTime: string; endTime: string; date: string },
  slot2: { startTime: string; endTime: string; date: string }
): boolean {
  if (slot1.date !== slot2.date) return false
  const end1 = timeToMinutes(slot1.endTime)
  const start2 = timeToMinutes(slot2.startTime)
  const end2 = timeToMinutes(slot2.endTime)
  const start1 = timeToMinutes(slot1.startTime)
  return end1 === start2 || end2 === start1 || (start1 <= start2 && end1 >= start2) || (start2 <= start1 && end2 >= start1)
}

export function mergeSlots(
  slots: Array<{ orderId: string; date: string; startTime: string; endTime: string }>
): Array<{ orderIds: string[]; date: string; startTime: string; endTime: string }> {
  if (slots.length === 0) return []

  const sorted = [...slots].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  })

  const merged: Array<{ orderIds: string[]; date: string; startTime: string; endTime: string }> = []
  let current = {
    orderIds: [sorted[0].orderId],
    date: sorted[0].date,
    startTime: sorted[0].startTime,
    endTime: sorted[0].endTime
  }

  for (let i = 1; i < sorted.length; i++) {
    if (canMergeSlots(current, sorted[i])) {
      current.orderIds.push(sorted[i].orderId)
      const currentStart = timeToMinutes(current.startTime)
      const currentEnd = timeToMinutes(current.endTime)
      const slotStart = timeToMinutes(sorted[i].startTime)
      const slotEnd = timeToMinutes(sorted[i].endTime)
      current.startTime = minutesToTime(Math.min(currentStart, slotStart))
      current.endTime = minutesToTime(Math.max(currentEnd, slotEnd))
    } else {
      merged.push(current)
      current = {
        orderIds: [sorted[i].orderId],
        date: sorted[i].date,
        startTime: sorted[i].startTime,
        endTime: sorted[i].endTime
      }
    }
  }
  merged.push(current)
  return merged
}

export function splitOccupiedSlot(
  occupiedSlots: OccupiedSlot[],
  cancelSlot: OccupiedSlot
): OccupiedSlot[] {
  const result: OccupiedSlot[] = []
  const cancelStart = timeToMinutes(cancelSlot.startTime)
  const cancelEnd = timeToMinutes(cancelSlot.endTime)

  for (const slot of occupiedSlots) {
    if (slot.date !== cancelSlot.date || slot.orderId === cancelSlot.orderId) {
      continue
    }
    const slotStart = timeToMinutes(slot.startTime)
    const slotEnd = timeToMinutes(slot.endTime)

    if (slotEnd <= cancelStart || slotStart >= cancelEnd) {
      result.push(slot)
    } else {
      if (slotStart < cancelStart) {
        result.push({
          ...slot,
          endTime: minutesToTime(cancelStart)
        })
      }
      if (slotEnd > cancelEnd) {
        result.push({
          ...slot,
          startTime: minutesToTime(cancelEnd)
        })
      }
    }
  }
  return result
}

export function generateAvailableSlots(
  date: string,
  occupiedSlots: OccupiedSlot[]
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const dayStart = 8 * 60
  const dayEnd = 21 * 60
  const step = 60

  const dayOccupied = occupiedSlots.filter(s => s.date === date)

  for (let t = dayStart; t < dayEnd; t += step) {
    const startTime = minutesToTime(t)
    const endTime = minutesToTime(t + step)
    const isOccupied = dayOccupied.some(s => {
      const sStart = timeToMinutes(s.startTime)
      const sEnd = timeToMinutes(s.endTime)
      return !(t + step <= sStart || t >= sEnd)
    })
    slots.push({
      id: `${date}-${startTime}`,
      date,
      startTime,
      endTime,
      available: !isOccupied
    })
  }
  return slots
}
