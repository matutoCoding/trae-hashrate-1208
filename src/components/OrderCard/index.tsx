import React from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import Tag from '../Tag'
import { Order } from '@/types'
import styles from './index.module.scss'

interface OrderCardProps {
  order: Order
  onCancel?: (orderId: string) => void
  onClick?: () => void
}

const statusMap: Record<Order['status'], { label: string; color: 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: '待确认', color: 'warning' },
  confirmed: { label: '已确认', color: 'primary' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
  trial: { label: '试听课', color: 'info' }
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel, onClick }) => {
  const status = statusMap[order.status]

  const handleCancel = (e: any) => {
    e.stopPropagation()
    if (onCancel) {
      Taro.showModal({
        title: '确认取消',
        content: '确定要取消这节课程吗？取消后时段将自动拆分释放。',
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
              {order.isMerged && (
                <Tag text='连时段' color='cyan' size='small' />
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
            onClick={handleCancel}
          >
            <Text className={styles.cancelText}>取消课程</Text>
          </Button>
          {order.status === 'trial' && (
            <Button className={classnames(styles.btn, styles.primaryBtn)}>
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
    </View>
  )
}

export default OrderCard
