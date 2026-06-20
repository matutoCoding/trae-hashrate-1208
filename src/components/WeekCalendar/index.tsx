import React, { useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Order } from '@/types'
import styles from './index.module.scss'

interface WeekCalendarProps {
  orders: Order[]
  onDateSelect?: (date: string) => void
  selectedDate?: string
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function getWeekDates(baseDateStr?: string): Date[] {
  const base = baseDateStr ? new Date(baseDateStr + 'T00:00:00') : new Date()
  const day = base.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(base)
  monday.setDate(base.getDate() + mondayOffset)
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSameDay(a: Date, b: string): boolean {
  return formatDate(a) === b
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({ orders, onDateSelect, selectedDate }) => {
  const [weekOffset, setWeekOffset] = useState(0)
  const [innerSelected, setInnerSelected] = useState<string>(formatDate(new Date()))

  const baseDate = useMemo(() => {
    const now = new Date()
    const adjusted = new Date(now)
    adjusted.setDate(now.getDate() + weekOffset * 7)
    return adjusted
  }, [weekOffset])

  const weekDates = useMemo(() => getWeekDates(formatDate(baseDate)), [baseDate])

  const selected = selectedDate || innerSelected

  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {}
    orders.forEach(o => {
      if (!map[o.date]) map[o.date] = []
      map[o.date].push(o)
    })
    return map
  }, [orders])

  const getDayStats = (date: Date) => {
    const dateStr = formatDate(date)
    const dayOrders = ordersByDate[dateStr] || []
    const confirmed = dayOrders.filter(o => o.status === 'confirmed' || o.status === 'pending').length
    const trial = dayOrders.filter(o => o.status === 'trial').length
    const cancelled = dayOrders.filter(o => o.status === 'cancelled').length
    return { confirmed, trial, cancelled, total: dayOrders.length }
  }

  const goPrevWeek = () => setWeekOffset(w => w - 1)
  const goNextWeek = () => setWeekOffset(w => w + 1)
  const goToday = () => {
    setWeekOffset(0)
    setInnerSelected(formatDate(new Date()))
  }

  const handleDateClick = (dateStr: string) => {
    if (onDateSelect) {
      onDateSelect(dateStr)
    } else {
      setInnerSelected(dateStr)
    }
  }

  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]
  const weekLabel = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`

  const selectedOrders = (ordersByDate[selected] || []).sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <View className={styles.wrapper}>
      <View className={styles.header}>
        <View className={styles.weekNav}>
          <View className={styles.navBtn} onClick={goPrevWeek}>
            <Text className={styles.navBtnText}>‹</Text>
          </View>
          <Text className={styles.weekLabel}>{weekLabel}</Text>
          <View className={styles.navBtn} onClick={goNextWeek}>
            <Text className={styles.navBtnText}>›</Text>
          </View>
        </View>
        <View className={styles.todayBtn} onClick={goToday}>
          <Text className={styles.todayBtnText}>今天</Text>
        </View>
      </View>

      <View className={styles.weekdays}>
        {WEEKDAYS.map((wd, i) => (
          <View key={i} className={styles.weekdayItem}>
            <Text className={styles.weekdayText}>{wd}</Text>
          </View>
        ))}
      </View>

      <View className={styles.dates}>
        {weekDates.map((date, i) => {
          const dateStr = formatDate(date)
          const stats = getDayStats(date)
          const isSelected = selected === dateStr
          const isToday = isSameDay(new Date(), dateStr)
          const hasClass = stats.total > 0
          return (
            <View
              key={i}
              className={`${styles.dateCell} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
              onClick={() => handleDateClick(dateStr)}
            >
              <Text
                className={`${styles.dateNum} ${isSelected ? styles.selectedText : ''} ${isToday ? styles.todayText : ''}`}
              >
                {date.getDate()}
              </Text>
              {hasClass && (
                <View className={styles.dots}>
                  {stats.confirmed > 0 && <View className={`${styles.dot} ${styles.dotConfirmed}`} />}
                  {stats.trial > 0 && <View className={`${styles.dot} ${styles.dotTrial}`} />}
                  {stats.cancelled > 0 && <View className={`${styles.dot} ${styles.dotCancelled}`} />}
                </View>
              )}
            </View>
          )
        })}
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotConfirmed}`} />
          <Text className={styles.legendText}>正式课</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotTrial}`} />
          <Text className={styles.legendText}>试听课</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotCancelled}`} />
          <Text className={styles.legendText}>已取消</Text>
        </View>
      </View>

      {selectedOrders.length > 0 && (
        <View className={styles.dayDetail}>
          <Text className={styles.dayDetailTitle}>
            {selected} 共 {selectedOrders.length} 节课程
          </Text>
          {selectedOrders.map(order => (
            <View key={order.id} className={styles.dayOrderItem}>
              <View className={styles.dayOrderTime}>
                <Text className={styles.dayOrderTimeText}>{order.startTime}-{order.endTime}</Text>
              </View>
              <View className={styles.dayOrderInfo}>
                <Text className={styles.dayOrderName}>{order.teacherName} · {order.subject}</Text>
                <Text className={styles.dayOrderStatus}>
                  {order.status === 'trial' ? '试听' : order.status === 'cancelled' ? '已取消' : order.status === 'confirmed' ? '已确认' : '待确认'}
                  {order.price > 0 && ` · ¥${order.price}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default WeekCalendar
