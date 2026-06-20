import React, { useMemo, useState } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useAppContext } from '@/store/AppContext'
import { calculateTeacherScore } from '@/utils/scoring'
import { formatDistance } from '@/utils/distance'
import ScoreBar from '@/components/ScoreBar'
import Tag from '@/components/Tag'
import { TimeSlot as TimeSlotType, Order } from '@/types'
import TimeSlotPicker from '@/components/TimeSlot'
import { groupSelectedSlotsByContinuous, generateAvailableSlots, OccupiedSlot } from '@/utils/schedule'
import styles from './index.module.scss'

const TeacherDetailPage: React.FC = () => {
  const router = useRouter()
  const teacherId = router.params?.id || 't001'

  const { getTeacherById, teachers, orders, currentRequirement, weightConfig, addOrders } = useAppContext()

  const [showTrialPicker, setShowTrialPicker] = useState(false)
  const [trialSelectedSlots, setTrialSelectedSlots] = useState<string[]>([])
  const [bookSelectedSlots, setBookSelectedSlots] = useState<string[]>([])

  const teacher = useMemo(() => {
    const t = getTeacherById(teacherId)
    return t || teachers[0]
  }, [teacherId, getTeacherById, teachers])

  const score = useMemo(() => {
    if (!currentRequirement || !teacher) return null
    return calculateTeacherScore(teacher, currentRequirement, weightConfig)
  }, [teacher, currentRequirement, weightConfig])

  const slots: TimeSlotType[] = useMemo(() => {
    const dates = ['2026-06-22', '2026-06-23', '2026-06-24']
    const result: TimeSlotType[] = []

    const teacherOrders = orders.filter(
      o => o.teacherId === teacher.id && o.status !== 'cancelled'
    )
    const occupied: OccupiedSlot[] = teacherOrders.map(o => ({
      orderId: o.id,
      teacherId: o.teacherId,
      date: o.date,
      startTime: o.startTime,
      endTime: o.endTime
    }))

    dates.forEach(date => {
      const daySlots = generateAvailableSlots(date, occupied)
      result.push(...daySlots)
    })
    return result
  }, [orders, teacher.id])

  const handleBook = () => {
    if (bookSelectedSlots.length === 0) {
      Taro.showToast({ title: '请选择时段', icon: 'none' })
      return
    }

    const selectedSlotObjs = slots.filter(s => bookSelectedSlots.includes(s.id))
    const groups = groupSelectedSlotsByContinuous(selectedSlotObjs)
    console.log('[TeacherDetail] 分组时段:', groups)

    const now = Date.now()
    const newOrders: Order[] = groups.map((group, idx) => {
      const allSlotIds = group.slotIds
      const orderId = `o${now}_${idx}`
      const hourCount = group.hourCount
      return {
        id: orderId,
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherAvatar: teacher.avatar,
        subject: teacher.subjects[0],
        grade: currentRequirement?.grade || '高一',
        date: group.date,
        startTime: group.startTime,
        endTime: group.endTime,
        status: 'confirmed' as const,
        price: teacher.pricePerHour * hourCount,
        address: currentRequirement?.location?.address || '北京市朝阳区望京',
        isMerged: hourCount > 1,
        mergedOrderIds: hourCount > 1 ? [`${orderId}_base`] : undefined
      }
    })

    if (newOrders.length === 1 && newOrders[0].isMerged) {
      const o = newOrders[0]
      const hourCount = groups[0].hourCount
      const segOrders: Order[] = []
      for (let i = 0; i < hourCount; i++) {
        const segId = `seg${now}_0_${i}`
        const startH = parseInt(o.startTime.split(':')[0]) + i
        const endH = startH + 1
        segOrders.push({
          id: segId,
          teacherId: o.teacherId,
          teacherName: o.teacherName,
          teacherAvatar: o.teacherAvatar,
          subject: o.subject,
          grade: o.grade,
          date: o.date,
          startTime: `${startH.toString().padStart(2, '0')}:00`,
          endTime: `${endH.toString().padStart(2, '0')}:00`,
          status: 'confirmed' as const,
          price: teacher.pricePerHour,
          address: o.address,
          isMerged: true,
          mergedOrderIds: Array.from({ length: hourCount }, (_, j) => `seg${now}_0_${j}`)
        })
      }
      addOrders(segOrders)
    } else if (newOrders.length > 1) {
      const allSegOrders: Order[] = []
      groups.forEach((group, gIdx) => {
        const hourCount = group.hourCount
        const groupSegIds: string[] = []
        for (let i = 0; i < hourCount; i++) {
          const segId = `seg${now}_${gIdx}_${i}`
          groupSegIds.push(segId)
        }
        for (let i = 0; i < hourCount; i++) {
          const startH = parseInt(group.startTime.split(':')[0]) + i
          const endH = startH + 1
          allSegOrders.push({
            id: groupSegIds[i],
            teacherId: teacher.id,
            teacherName: teacher.name,
            teacherAvatar: teacher.avatar,
            subject: teacher.subjects[0],
            grade: currentRequirement?.grade || '高一',
            date: group.date,
            startTime: `${startH.toString().padStart(2, '0')}:00`,
            endTime: `${endH.toString().padStart(2, '0')}:00`,
            status: 'confirmed' as const,
            price: teacher.pricePerHour,
            address: currentRequirement?.location?.address || '北京市朝阳区望京',
            isMerged: true,
            mergedOrderIds: groupSegIds
          })
        }
      })
      addOrders(allSegOrders)
    } else {
      addOrders(newOrders)
    }

    console.log('[TeacherDetail] 预约成功，时段:', bookSelectedSlots)
    Taro.showToast({ title: '预约成功', icon: 'success' })
    setBookSelectedSlots([])
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/orders/index' })
    }, 1000)
  }

  const handleTrialClick = () => {
    setShowTrialPicker(true)
    setTrialSelectedSlots([])
  }

  const handleConfirmTrial = () => {
    if (trialSelectedSlots.length === 0) {
      Taro.showToast({ title: '请选择试听时段', icon: 'none' })
      return
    }

    const selectedSlotObjs = slots.filter(s => trialSelectedSlots.includes(s.id))
    const firstSlot = selectedSlotObjs[0]
    const hourCount = selectedSlotObjs.length
    const lastSlot = selectedSlotObjs[hourCount - 1]

    const trialOrder: Order = {
      id: `trial${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherAvatar: teacher.avatar,
      subject: teacher.subjects[0],
      grade: currentRequirement?.grade || '高一',
      date: firstSlot.date,
      startTime: firstSlot.startTime,
      endTime: lastSlot.endTime,
      status: 'trial',
      price: 0,
      address: currentRequirement?.location?.address || '北京市朝阳区望京',
      isMerged: hourCount > 1
    }

    addOrders([trialOrder])
    console.log('[TeacherDetail] 试听申请已提交:', trialOrder)
    Taro.showToast({ title: '试听申请已提交', icon: 'success' })
    setShowTrialPicker(false)
    setTrialSelectedSlots([])
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/orders/index' })
    }, 1000)
  }

  if (!teacher) {
    return (
      <View className={styles.page}>
        <Text>未找到老师信息</Text>
      </View>
    )
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
          <Text className={styles.sectionTitle}>选择时段（连续时段合并成一节课，不连续分别生成订单）</Text>
          <TimeSlotPicker
            slots={slots}
            selectedIds={bookSelectedSlots}
            onChange={setBookSelectedSlots}
          />
          {bookSelectedSlots.length > 0 && (
            <View className={styles.slotSummary}>
              <Text className={styles.summaryText}>
                已选 {bookSelectedSlots.length} 个时段 · 连续将合并 · 预计 ¥{teacher.pricePerHour * bookSelectedSlots.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.trialBtn} onClick={handleTrialClick}>
          <Text className={styles.trialText}>免费试听</Text>
        </Button>
        <Button className={styles.bookBtn} onClick={handleBook}>
          <Text className={styles.bookText}>立即预约</Text>
        </Button>
      </View>

      {showTrialPicker && (
        <View className={styles.modalOverlay}>
          <View className={styles.modalContent}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择试听时段（1小时）</Text>
              <Text className={styles.modalClose} onClick={() => setShowTrialPicker(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <TimeSlotPicker
                slots={slots}
                selectedIds={trialSelectedSlots}
                onChange={setTrialSelectedSlots}
              />
            </View>
            <View className={styles.modalFooter}>
              <Button className={styles.modalCancelBtn} onClick={() => setShowTrialPicker(false)}>
                <Text>取消</Text>
              </Button>
              <Button className={styles.modalConfirmBtn} onClick={handleConfirmTrial}>
                <Text>提交试听申请</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default TeacherDetailPage
