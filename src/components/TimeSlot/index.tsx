import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { TimeSlot as TimeSlotType } from '@/types'
import { mergeSlots } from '@/utils/schedule'
import styles from './index.module.scss'

interface TimeSlotPickerProps {
  slots: TimeSlotType[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ slots, selectedIds, onChange }) => {
  const handleToggle = (slot: TimeSlotType) => {
    if (!slot.available) return
    if (selectedIds.includes(slot.id)) {
      onChange(selectedIds.filter(id => id !== slot.id))
    } else {
      onChange([...selectedIds, slot.id])
    }
  }

  const selectedSlots = slots.filter(s => selectedIds.includes(s.id))
  const mergedSlots = mergeSlots(
    selectedSlots.map(s => ({
      orderId: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime
    }))
  )

  const groupedSlots: Record<string, TimeSlotType[]> = {}
  slots.forEach(slot => {
    if (!groupedSlots[slot.date]) {
      groupedSlots[slot.date] = []
    }
    groupedSlots[slot.date].push(slot)
  })

  return (
    <View className={styles.container}>
      {Object.keys(groupedSlots).map(date => (
        <View key={date} className={styles.dateGroup}>
          <Text className={styles.dateLabel}>{date}</Text>
          <View className={styles.slotsGrid}>
            {groupedSlots[date].map(slot => {
              const isSelected = selectedIds.includes(slot.id)
              return (
                <View
                  key={slot.id}
                  className={classnames(
                    styles.slot,
                    !slot.available && styles.disabled,
                    isSelected && styles.selected
                  )}
                  onClick={() => handleToggle(slot)}
                >
                  <Text className={styles.slotTime}>
                    {slot.startTime}-{slot.endTime}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      ))}

      {mergedSlots.length > 0 && (
        <View className={styles.mergedInfo}>
          <Text className={styles.mergedTitle}>已选时段（连续时段将自动合并）</Text>
          {mergedSlots.map((m, i) => (
            <View key={i} className={styles.mergedItem}>
              <Text className={styles.mergedDate}>{m.date}</Text>
              <Text className={styles.mergedTime}>
                {m.startTime} - {m.endTime}
              </Text>
              {m.orderIds.length > 1 && (
                <View className={styles.mergeBadge}>
                  <Text className={styles.mergeText}>{m.orderIds.length}段合并</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default TimeSlotPicker
