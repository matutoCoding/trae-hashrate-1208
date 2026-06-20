import React, { useMemo } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppContext } from '@/store/AppContext'
import { teachersData } from '@/data'
import { calculateTeacherScore } from '@/utils/scoring'
import { formatDistance } from '@/utils/distance'
import ScoreBar from '@/components/ScoreBar'
import Tag from '@/components/Tag'
import { TimeSlot as TimeSlotType } from '@/types'
import TimeSlotPicker from '@/components/TimeSlot'
import styles from './index.module.scss'

const TeacherDetailPage: React.FC = () => {
  const { teachers, currentRequirement, weightConfig, addOrder } = useAppContext()

  const teacher = useMemo(() => teachers[0] || teachersData[0], [teachers])

  const score = useMemo(() => {
    if (!currentRequirement) return null
    return calculateTeacherScore(teacher, currentRequirement, weightConfig)
  }, [teacher, currentRequirement, weightConfig])

  const [selectedSlots, setSelectedSlots] = React.useState<string[]>([])

  const slots: TimeSlotType[] = useMemo(() => {
    const dates = ['2026-06-22', '2026-06-23', '2026-06-24']
    const result: TimeSlotType[] = []
    dates.forEach(date => {
      for (let h = 8; h < 21; h++) {
        const startTime = `${h.toString().padStart(2, '0')}:00`
        const endTime = `${(h + 1).toString().padStart(2, '0')}:00`
        const unavailable = (h >= 10 && h < 12 && date === '2026-06-22')
        result.push({
          id: `${date}-${startTime}`,
          date,
          startTime,
          endTime,
          available: !unavailable
        })
      }
    })
    return result
  }, [])

  const handleBook = () => {
    if (selectedSlots.length === 0) {
      Taro.showToast({ title: '请选择时段', icon: 'none' })
      return
    }
    const firstSlot = slots.find(s => s.id === selectedSlots[0])
    const lastSlot = slots.find(s => s.id === selectedSlots[selectedSlots.length - 1])
    if (firstSlot && lastSlot) {
      addOrder({
        id: `o${Date.now()}`,
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherAvatar: teacher.avatar,
        subject: teacher.subjects[0],
        grade: '高一',
        date: firstSlot.date,
        startTime: firstSlot.startTime,
        endTime: lastSlot.endTime,
        status: 'confirmed',
        price: teacher.pricePerHour * selectedSlots.length,
        address: '北京市朝阳区望京',
        isMerged: selectedSlots.length > 1
      })
      console.log('[TeacherDetail] 预约成功，时段:', selectedSlots)
      Taro.showToast({ title: '预约成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/orders/index' })
      }, 1000)
    }
  }

  const handleTrial = () => {
    Taro.showToast({ title: '试听申请已提交', icon: 'success' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.teacherHeader}>
          <Image className={styles.avatar} src={teacher.avatar} mode='aspectFill' />
          <View className={styles.info}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{teacher.name}</Text>
              <Tag text={teacher.gender === 'male' ? '男' : '女'} color='info' size='small' />
              <Tag text={`教龄${teacher.experience}年`} color='cyan' size='small' />
            </View>
            <View className={styles.ratingRow}>
              <Text className={styles.star}>★★★★★</Text>
              <Text className={styles.ratingNum}>{teacher.rating}</Text>
              <Text className={styles.reviewCount}>({teacher.reviewCount}条评价)</Text>
            </View>
            <View className={styles.metaRow}>
              <Tag text={`📍 ${formatDistance(teacher.distance)}`} color='cyan' size='small' outlined />
              <Tag text={`${teacher.age}岁`} color='info' size='small' outlined />
            </View>
            <View className={styles.tagsRow}>
              {teacher.subjects.map((s, i) => (
                <Tag key={i} text={s} color='purple' size='small' />
              ))}
              {teacher.grades.map((g, i) => (
                <Tag key={`g${i}`} text={g} color='info' size='small' outlined />
              ))}
            </View>
            <View className={styles.priceRow}>
              <Text className={styles.priceSymbol}>¥</Text>
              <Text className={styles.price}>{teacher.pricePerHour}</Text>
              <Text className={styles.priceUnit}>/小时</Text>
            </View>
          </View>
        </View>

        {score && (
          <View className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>综合匹配度</Text>
            <View className={styles.scoreRow}>
              <Text className={styles.scoreLabel}>综合匹配分</Text>
              <View>
                <Text className={styles.scoreValue}>{score.totalScore}</Text>
                <Text className={styles.scoreUnit}>/100分</Text>
              </View>
            </View>
            <ScoreBar label='科目匹配' score={score.subjectMatch} color='#722ED1' />
            <ScoreBar label='老师评分' score={score.ratingScore} color='#FFC53D' />
            <ScoreBar label='距离远近' score={score.distanceScore} color='#14C9C9' />
            <ScoreBar label='价格合适' score={score.priceScore} color='#F77234' />
            <ScoreBar label='教学经验' score={score.experienceScore} color='#52C41A' />
          </View>
        )}

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>老师简介</Text>
          <Text className={styles.descText}>{teacher.introduction}</Text>
          <View style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {teacher.tags.map((t, i) => (
              <Tag key={i} text={t} color='warning' size='small' outlined />
            ))}
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>选择时段（连续时段自动合并）</Text>
          <TimeSlotPicker
            slots={slots}
            selectedIds={selectedSlots}
            onChange={setSelectedSlots}
          />
        </View>
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.trialBtn} onClick={handleTrial}>
          <Text className={styles.trialText}>免费试听</Text>
        </Button>
        <Button className={styles.bookBtn} onClick={handleBook}>
          <Text className={styles.bookText}>立即预约</Text>
        </Button>
      </View>
    </View>
  )
}

export default TeacherDetailPage
