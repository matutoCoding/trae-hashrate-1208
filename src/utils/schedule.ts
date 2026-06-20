import { TimeSlot } from '@/types'

export interface OccupiedSlot {
  orderId: string
  teacherId: string
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
  slot1: { startTime: string; endTime: string; date: string; teacherId: string },
  slot2: { startTime: string; endTime: string; date: string; teacherId: string }
): boolean {
  if (slot1.date !== slot2.date) return false
  if (slot1.teacherId !== slot2.teacherId) return false
  const end1 = timeToMinutes(slot1.endTime)
  const start2 = timeToMinutes(slot2.startTime)
  const end2 = timeToMinutes(slot2.endTime)
  const start1 = timeToMinutes(slot1.startTime)
  return end1 === start2 || end2 === start1 || (start1 <= start2 && end1 >= start2) || (start2 <= start1 && end2 >= start1)
}

export function mergeSlots(
  slots: Array<{ orderId: string; teacherId: string; date: string; startTime: string; endTime: string }>
): Array<{ orderIds: string[]; teacherId: string; date: string; startTime: string; endTime: string }> {
  if (slots.length === 0) return []

  const sorted = [...slots].sort((a, b) => {
    if (a.teacherId !== b.teacherId) return a.teacherId.localeCompare(b.teacherId)
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  })

  const merged: Array<{ orderIds: string[]; teacherId: string; date: string; startTime: string; endTime: string }> = []
  let current = {
    orderIds: [sorted[0].orderId],
    teacherId: sorted[0].teacherId,
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
        teacherId: sorted[i].teacherId,
        date: sorted[i].date,
        startTime: sorted[i].startTime,
        endTime: sorted[i].endTime
      }
    }
  }
  merged.push(current)
  return merged
}

export interface OrderGroupSplitResult {
  removedOrderId: string
  newOrders: Array<{ teacherId: string; date: string; startTime: string; endTime: string; hourCount: number }>
}

export function splitMergedGroup(
  groupOrders: Array<{ orderId: string; teacherId: string; date: string; startTime: string; endTime: string; pricePerHour: number }>,
  cancelOrderId: string
): OrderGroupSplitResult {
  const sorted = [...groupOrders].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  const cancelIndex = sorted.findIndex(o => o.orderId === cancelOrderId)
  if (cancelIndex === -1) {
    return { removedOrderId: cancelOrderId, newOrders: [] }
  }

  const before = sorted.slice(0, cancelIndex)
  const after = sorted.slice(cancelIndex + 1)

  const newOrders: OrderGroupSplitResult['newOrders'] = []

  if (before.length > 0) {
    const first = before[0]
    const last = before[before.length - 1]
    const start = timeToMinutes(first.startTime)
    const end = timeToMinutes(last.endTime)
    newOrders.push({
      teacherId: first.teacherId,
      date: first.date,
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
      hourCount: (end - start) / 60
    })
  }

  if (after.length > 0) {
    const first = after[0]
    const last = after[after.length - 1]
    const start = timeToMinutes(first.startTime)
    const end = timeToMinutes(last.endTime)
    newOrders.push({
      teacherId: first.teacherId,
      date: first.date,
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
      hourCount: (end - start) / 60
    })
  }

  return { removedOrderId: cancelOrderId, newOrders }
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

export function groupSelectedSlotsByContinuous(
  slots: TimeSlot[]
): Array<{ date: string; startTime: string; endTime: string; hourCount: number; slotIds: string[] }> {
  if (slots.length === 0) return []

  const byDate: Record<string, TimeSlot[]> = {}
  slots.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = []
    byDate[s.date].push(s)
  })

  const result: Array<{ date: string; startTime: string; endTime: string; hourCount: number; slotIds: string[] }> = []

  Object.keys(byDate).forEach(date => {
    const daySlots = byDate[date].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

    let currentGroup: TimeSlot[] = [daySlots[0]]

    for (let i = 1; i < daySlots.length; i++) {
      const prevEnd = timeToMinutes(currentGroup[currentGroup.length - 1].endTime)
      const currStart = timeToMinutes(daySlots[i].startTime)
      if (prevEnd === currStart) {
        currentGroup.push(daySlots[i])
      } else {
        result.push({
          date,
          startTime: currentGroup[0].startTime,
          endTime: currentGroup[currentGroup.length - 1].endTime,
          hourCount: currentGroup.length,
          slotIds: currentGroup.map(s => s.id)
        })
        currentGroup = [daySlots[i]]
      }
    }

    result.push({
      date,
      startTime: currentGroup[0].startTime,
      endTime: currentGroup[currentGroup.length - 1].endTime,
      hourCount: currentGroup.length,
      slotIds: currentGroup.map(s => s.id)
    })
  })

  return result
}
