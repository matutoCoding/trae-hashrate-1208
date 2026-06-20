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
  const [showDetail, setShowDetail] = useState(false)

  const startMin = timeToMinutes(order.startTime)
  const endMin = timeToMinutes(order.endTime)
  const totalHours = (endMin - startMin) / 60
  const hourOptions: Array<{ index: number; label: string }> = []
  for (let i = 0; i < totalHours; i++) {
    const s = minutesToTime(startMin + i * 60)
    const e = minutesToTime(startMin + (i + 1) * 60)
    hourOptions.push({ index: i, label: `${s} - ${e}` })
  }

  const handleCardClick = () => {
    setShowDetail(d => !d)
    if (onClick) onClick()
  }

  const handleCancelClick = (e: any) => {
    e.stopPropagation()
    if (!onCancel) return

    if (order.isMerged && totalHours > 1) {
      setShowHourPicker(true)
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

  const handlePickHourCancel = (index: number, e: any) => {
    e.stopPropagation()
    const selectedHour = hourOptions[index]
    Taro.showModal({
      title: '确认取消',
      content: `确定要取消 ${selectedHour.label} 这节课吗？剩余时段将自动拆分显示。`,
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          onCancel!(order.id, index)
          setShowHourPicker(false)
          Taro.showToast({ title: '已取消该时段', icon: 'success' })
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

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '—'
    const d = new Date(ts)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return (
    <View className={styles.card}>
      <View className={styles.header} onClick={handleCardClick}>
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

      <View className={styles.detail} onClick={handleCardClick}>
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

      {showDetail && (
        <View className={styles.orderDetailPanel}>
          <Text className={styles.orderDetailTitle}>订单详情</Text>
          <View className={styles.orderDetailRow}>
            <Text className={styles.orderDetailKey}>订单号</Text>
            <Text className={styles.orderDetailValue}>{order.id}</Text>
          </View>
          <View className={styles.orderDetailRow}>
            <Text className={styles.orderDetailKey}>创建时间</Text>
            <Text className={styles.orderDetailValue}>{formatTimestamp(order.createdAt)}</Text>
          </View>
          {order.trialOriginInfo && (
            <>
              <View className={styles.convertBanner}>
                <Text className={styles.convertBannerText}>🎯 由免费试听转化而来</Text>
              </View>
              <View className={styles.orderDetailRow}>
                <Text className={styles.orderDetailKey}>原试听日期</Text>
                <Text className={styles.orderDetailValue}>{order.trialOriginInfo.originalTrialDate}</Text>
              </View>
              <View className={styles.orderDetailRow}>
                <Text className={styles.orderDetailKey}>原试听时间</Text>
                <Text className={styles.orderDetailValue}>
                  {order.trialOriginInfo.originalTrialStartTime} - {order.trialOriginInfo.originalTrialEndTime}
                </Text>
              </View>
              <View className={styles.orderDetailRow}>
                <Text className={styles.orderDetailKey}>转化时单价</Text>
                <Text className={styles.orderDetailValue}>¥{order.trialOriginInfo.convertedPricePerHour}/小时</Text>
              </View>
              <View className={styles.orderDetailRow}>
                <Text className={styles.orderDetailKey}>转化时间</Text>
                <Text className={styles.orderDetailValue}>{formatTimestamp(order.trialOriginInfo.convertedAt)}</Text>
              </View>
            </>
          )}
          {totalHours > 1 && (
            <View className={styles.orderDetailRow}>
              <Text className={styles.orderDetailKey}>课时</Text>
              <Text className={styles.orderDetailValue}>{totalHours} 小时（长课合并）</Text>
            </View>
          )}
          <View className={styles.orderDetailRow}>
            <Text className={styles.orderDetailKey}>授课老师</Text>
            <Text className={styles.orderDetailValue}>{order.teacherName}</Text>
          </View>
        </View>
      )}

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
            <Button className={classnames(styles.btn, styles.primaryBtn)} onClick={handleCardClick}>
              <Text className={styles.primaryText}>{showDetail ? '收起详情' : '查看详情'}</Text>
            </Button>
          )}
        </View>
      )}

      {showHourPicker && (
        <View className={styles.modalOverlay} onClick={() => setShowHourPicker(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择要取消的时段</Text>
              <Text className={styles.modalClose} onClick={() => setShowHourPicker(false)}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <Text className={styles.modalDesc}>
                这是{totalHours}节连订的长课（{order.startTime}-{order.endTime}），点击下方时段即可单独取消，剩余时段将自动拆分并留在待上课程中。
              </Text>
              <View className={styles.hourOptions}>
                {hourOptions.map((opt, idx) => {
                  const isFirst = idx === 0
                  const isLast = idx === hourOptions.length - 1
                  const isMiddle = !isFirst && !isLast
                  return (
                    <View
                      key={opt.index}
                      className={styles.hourOption}
                      onClick={(e) => handlePickHourCancel(idx, e)}
                    >
                      <View className={styles.hourOptionPos}>
                        {isFirst && <Tag text='第一段' color='primary' size='small' />}
                        {isLast && <Tag text='最后一段' color='success' size='small' />}
                        {isMiddle && <Tag text='中间段' color='warning' size='small' />}
                      </View>
                      <Text className={styles.hourOptionText}>{opt.label}</Text>
                      <Text className={styles.hourOptionAction}>点击取消</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default OrderCard
