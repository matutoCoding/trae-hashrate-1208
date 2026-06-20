import React, { useState } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import Tag from '../Tag'
import { Order } from '@/types'
import styles from './index.module.scss'

interface OrderCardProps {
  order: Order
  onCancel?: (orderId: string, cancelHourIndex?: number) => void
  onConvertTrial?: (orderId: string) => void
  onClick?: () => void
}

const statusMap: Record<Order['status'], { label: string; color: 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: '待确认', color: 'warning' },
  confirmed: { label: '已确认', color: 'primary' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
  trial: { label: '试听课', color: 'info' }
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

const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel, onConvertTrial, onClick }) => {
  const status = statusMap[order.status]
  const [showHourPicker, setShowHourPicker] = useState(false)
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(null)

  const startMin = timeToMinutes(order.startTime)
  const endMin = timeToMinutes(order.endTime)
  const totalHours = (endMin - startMin) / 60
  const hourOptions: Array<{ index: number; label: string }> = []
  for (let i = 0; i < totalHours; i++) {
    const s = minutesToTime(startMin + i * 60)
    const e = minutesToTime(startMin + (i + 1) * 60)
    hourOptions.push({ index: i, label: `${s} - ${e}` })
  }

  const handleCancelClick = (e: any) => {
    e.stopPropagation()
    if (!onCancel) return

    if (order.isMerged && totalHours > 1) {
      setShowHourPicker(true)
      setSelectedHourIndex(null)
    } else {
      Taro.showModal({
        title: '确认取消',
        content: '确定要取消这节课程吗？取消后时段将自动释放。',
        confirmColor: '#F53F3F',
        success: (res) => {
          if (res.confirm) {
            onCancel(order.id)
            Taro.showToast({ title: '已取消', icon: 'success' })
          }
        }
      })
    }
  }

  const handleConfirmCancelHour = () => {
    if (selectedHourIndex === null) {
      Taro.showToast({ title: '请选择要取消的时段', icon: 'none' })
      return
    }
    Taro.showModal({
      title: '确认取消',
      content: `确定要取消 ${hourOptions[selectedHourIndex].label} 这节课吗？剩余时段将自动拆分显示。`,
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          onCancel!(order.id, selectedHourIndex)
          setShowHourPicker(false)
          Taro.showToast({ title: '已取消', icon: 'success' })
        }
      }
    })
  }

  const handleConvertTrial = (e: any) => {
    e.stopPropagation()
    if (onConvertTrial) {
      Taro.showModal({
        title: '转正式课',
        content: '试听满意，将此试听课转为正式课程并开始计费？',
        confirmText: '确认转化',
        success: (res) => {
          if (res.confirm) {
            onConvertTrial(order.id)
            Taro.showToast({ title: '已转为正式课', icon: 'success' })
          }
        }
      })
    }
  }

  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.header}>
        <View className={styles.teacherInfo}>
          <Image className={styles.avatar} src={order.teacherAvatar} mode='aspectFill' />
          <View className={styles.info}>
            <View className={styles.nameRow}>
              <Text className={styles.teacherName}>{order.teacherName}</Text>
              <Tag text={status.label} color={status.color} size='small' />
            </View>
            <View className={styles.subjectRow}>
              <Tag text={order.subject} color='purple' size='small' />
              <Tag text={order.grade} color='info' size='small' outlined />
              {order.isMerged && totalHours > 1 && (
                <Tag text={`连订${totalHours}节`} color='cyan' size='small' />
              )}
            </View>
          </View>
        </View>
        <View className={styles.price}>
          {order.price === 0 ? (
            <Text className={styles.free}>免费试听</Text>
          ) : (
            <>
              <Text className={styles.priceSymbol}>¥</Text>
              <Text className={styles.priceNum}>{order.price}</Text>
            </>
          )}
        </View>
      </View>

      <View className={styles.divider} />

      <View className={styles.detail}>
        <View className={styles.detailItem}>
          <Text className={styles.detailIcon}>📅</Text>
          <Text className={styles.detailText}>{order.date}</Text>
        </View>
        <View className={styles.detailItem}>
          <Text className={styles.detailIcon}>⏰</Text>
          <Text className={styles.detailText}>{order.startTime} - {order.endTime}</Text>
        </View>
        <View className={styles.detailItem}>
          <Text className={styles.detailIcon}>📍</Text>
          <Text className={styles.detailText}>{order.address}</Text>
        </View>
      </View>

      {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'trial') && (
        <View className={styles.footer}>
          <Button
            className={classnames(styles.btn, styles.cancelBtn)}
            onClick={handleCancelClick}
          >
            <Text className={styles.cancelText}>取消课程</Text>
          </Button>
          {order.status === 'trial' && (
            <Button className={classnames(styles.btn, styles.primaryBtn)} onClick={handleConvertTrial}>
              <Text className={styles.primaryText}>转正式课</Text>
            </Button>
          )}
          {order.status !== 'trial' && (
            <Button className={classnames(styles.btn, styles.primaryBtn)}>
              <Text className={styles.primaryText}>联系老师</Text>
            </Button>
          )}
        </View>
      )}

      {showHourPicker && (
        <View className={styles.modalOverlay}>
          <View className={styles.modalContent}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择要取消的时段</Text>
              <Text className={styles.modalClose} onClick={() => setShowHourPicker(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <Text className={styles.modalDesc}>
                这是{totalHours}节连订的长课（{order.startTime}-{order.endTime}），请选择要取消的单小时时段，剩余时段将自动拆分。
              </Text>
              <View className={styles.hourOptions}>
                {hourOptions.map(opt => (
                  <View
                    key={opt.index}
                    className={classnames(
                      styles.hourOption,
                      selectedHourIndex === opt.index && styles.hourOptionActive
                    )}
                    onClick={() => setSelectedHourIndex(opt.index)}
                  >
                    <Text className={styles.hourOptionText}>{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.modalFooter}>
              <Button className={styles.modalCancelBtn} onClick={() => setShowHourPicker(false)}>
                <Text>返回</Text>
              </Button>
              <Button className={styles.modalConfirmBtn} onClick={handleConfirmCancelHour}>
                <Text>确认取消该时段</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default OrderCard
