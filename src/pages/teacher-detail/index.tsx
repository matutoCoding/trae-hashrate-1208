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

  const { getTeacherById, teachers, orders, currentRequirement, weightConfig, addOrders, addOrder } = useAppContext()

  const [showTrialPicker, setShowTrialPicker] = useState(false)
  const [trialSelectedSlot, setTrialSelectedSlot] = useState<string>('')
  const [bookSelectedSlots, setBookSelectedSlots] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

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

  const previewGroups = useMemo(() => {
    if (bookSelectedSlots.length === 0) return []
    const selectedSlotObjs = slots.filter(s => bookSelectedSlots.includes(s.id))
    return groupSelectedSlotsByContinuous(selectedSlotObjs)
  }, [bookSelectedSlots, slots])

  const totalPrice = useMemo(() => {
    return previewGroups.reduce((sum, g) => sum + teacher.pricePerHour * g.hourCount, 0)
  }, [previewGroups, teacher.pricePerHour])

  const totalHours = useMemo(() => {
    return previewGroups.reduce((sum, g) => sum + g.hourCount, 0)
  }, [previewGroups])

  const handleBook = () => {
    if (bookSelectedSlots.length === 0) {
      Taro.showToast({ title: '请选择时段', icon: 'none' })
      return
    }
    setShowPreview(true)
  }

  const handleConfirmBook = () => {
    const now = Date.now()
    const newOrders: Order[] = previewGroups.map((group, gIdx) => {
      const hourCount = group.hourCount
      const orderId = `o${now}_${gIdx}`

      const segmentIds: string[] = []
      for (let i = 0; i < hourCount; i++) {
        segmentIds.push(`${orderId}_seg_${i}`)
      }

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
        mergedOrderIds: hourCount > 1 ? segmentIds : undefined,
        createdAt: Date.now()
      }
    })

    if (newOrders.length === 1) {
      addOrder(newOrders[0])
    } else {
      addOrders(newOrders)
    }

    console.log('[TeacherDetail] 预约成功，订单:', newOrders)
    Taro.showToast({ title: '预约成功', icon: 'success' })
    setBookSelectedSlots([])
    setShowPreview(false)
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/orders/index' })
    }, 1000)
  }

  const handleTrialClick = () => {
    setShowTrialPicker(true)
    setTrialSelectedSlot('')
  }

  const handleTrialSlotChange = (ids: string[]) => {
    if (ids.length > 1) {
      const latest = ids[ids.length - 1]
      setTrialSelectedSlot(latest)
    } else if (ids.length === 1) {
      setTrialSelectedSlot(ids[0])
    } else {
      setTrialSelectedSlot('')
    }
  }

  const handleConfirmTrial = () => {
    if (!trialSelectedSlot) {
      Taro.showToast({ title: '请选择一个试听时段', icon: 'none' })
      return
    }

    const slot = slots.find(s => s.id === trialSelectedSlot)
    if (!slot) return

    const trialOrder: Order = {
      id: `trial${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherAvatar: teacher.avatar,
      subject: teacher.subjects[0],
      grade: currentRequirement?.grade || '高一',
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'trial',
      price: 0,
      address: currentRequirement?.location?.address || '北京市朝阳区望京',
      isMerged: false,
      createdAt: Date.now()
    }

    addOrder(trialOrder)
    console.log('[TeacherDetail] 试听申请已提交:', trialOrder)
    Taro.showToast({ title: '试听申请已提交', icon: 'success' })
    setShowTrialPicker(false)
    setTrialSelectedSlot('')
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
          <Text className={styles.sectionTitle}>选择时段（连续时段合并为一节长课，不连续/跨日期分别生成课程）</Text>
          <TimeSlotPicker
            slots={slots}
            selectedIds={bookSelectedSlots}
            onChange={setBookSelectedSlots}
          />
          {bookSelectedSlots.length > 0 && (
            <View className={styles.slotSummary}>
              <Text className={styles.summaryText}>
                已选 {bookSelectedSlots.length} 个时段 · 共 {previewGroups.length} 条课程 · {totalHours} 小时 · 预计 ¥{totalPrice}
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
          <Text className={styles.bookText}>
            {bookSelectedSlots.length > 0 ? `确认预约 ¥${totalPrice}` : '立即预约'}
          </Text>
        </Button>
      </View>

      {showPreview && previewGroups.length > 0 && (
        <View className={styles.modalOverlay}>
          <View className={styles.modalContent}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>确认预约信息</Text>
              <Text className={styles.modalClose} onClick={() => setShowPreview(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.previewTeacher}>
                <Image className={styles.previewAvatar} src={teacher.avatar} mode='aspectFill' />
                <View className={styles.previewTeacherInfo}>
                  <Text className={styles.previewTeacherName}>{teacher.name}</Text>
                  <Text className={styles.previewTeacherSubject}>
                    {teacher.subjects.join('、')} · {currentRequirement?.grade || '高一'}
                  </Text>
                </View>
              </View>

              <Text className={styles.previewSectionTitle}>将生成以下 {previewGroups.length} 条课程</Text>

              <View className={styles.previewList}>
                {previewGroups.map((g, i) => (
                  <View key={i} className={styles.previewItem}>
                    <View className={styles.previewItemIndex}>
                      <Text className={styles.previewItemIndexText}>{i + 1}</Text>
                    </View>
                    <View className={styles.previewItemContent}>
                      <Text className={styles.previewItemTime}>
                        {g.date}  {g.startTime} - {g.endTime}
                      </Text>
                      <View style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {g.hourCount > 1 && (
                          <Tag text={`长课${g.hourCount}节`} color='cyan' size='small' />
                        )}
                        <Tag text={`¥${teacher.pricePerHour * g.hourCount}`} color='warning' size='small' />
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View className={styles.previewTotal}>
                <Text className={styles.previewTotalLabel}>合计</Text>
                <View>
                  <Text className={styles.previewTotalPrice}>¥{totalPrice}</Text>
                  <Text className={styles.previewTotalMeta}>  ·  {totalHours}小时 · {previewGroups.length}节课</Text>
                </View>
              </View>
            </View>
            <View className={styles.modalFooter}>
              <Button className={styles.modalCancelBtn} onClick={() => setShowPreview(false)}>
                <Text>返回修改</Text>
              </Button>
              <Button className={styles.modalConfirmBtn} onClick={handleConfirmBook}>
                <Text>确认预约</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      {showTrialPicker && (
        <View className={styles.modalOverlay}>
          <View className={styles.modalContent}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择试听时段（限1小时）</Text>
              <Text className={styles.modalClose} onClick={() => setShowTrialPicker(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <TimeSlotPicker
                slots={slots}
                selectedIds={trialSelectedSlot ? [trialSelectedSlot] : []}
                onChange={handleTrialSlotChange}
              />
              {trialSelectedSlot && (
                <View className={styles.trialSummary}>
                  <Text className={styles.trialSummaryText}>
                    已选择：{slots.find(s => s.id === trialSelectedSlot)?.date} {slots.find(s => s.id === trialSelectedSlot)?.startTime} - {slots.find(s => s.id === trialSelectedSlot)?.endTime}
                  </Text>
                </View>
              )}
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
