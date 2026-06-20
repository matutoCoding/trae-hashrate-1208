import React, { useMemo, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppContext } from '@/store/AppContext'
import OrderCard from '@/components/OrderCard'
import Tag from '@/components/Tag'
import WeekCalendar from '@/components/WeekCalendar'
import { mergeSlots } from '@/utils/schedule'
import styles from './index.module.scss'

type TabType = 'upcoming' | 'completed' | 'cancelled'

const OrdersPage: React.FC = () => {
  const { orders, cancelOrder, convertTrialToConfirmed, getTeacherById } = useAppContext()
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')
  const [selectedDate, setSelectedDate] = useState<string>('')

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return orders.filter(o => ['pending', 'confirmed', 'trial'].includes(o.status))
      case 'completed':
        return orders.filter(o => o.status === 'completed')
      case 'cancelled':
        return orders.filter(o => o.status === 'cancelled')
      default:
        return []
    }
  }, [orders, activeTab])

  const upcomingSchedule = useMemo(() => {
    const upcoming = orders.filter(o => ['pending', 'confirmed', 'trial'].includes(o.status))
    const merged = mergeSlots(
      upcoming.map(o => ({
        orderId: o.id,
        teacherId: o.teacherId,
        date: o.date,
        startTime: o.startTime,
        endTime: o.endTime
      }))
    )
    return merged
  }, [orders])

  const handleCancel = (orderId: string, cancelHourIndex?: number) => {
    cancelOrder(orderId, cancelHourIndex)
    console.log('[Orders] 取消订单，时段已自动拆分释放:', orderId, cancelHourIndex)
  }

  const handleConvertTrial = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    const teacher = getTeacherById(order.teacherId)
    const startH = parseInt(order.startTime.split(':')[0])
    const endH = parseInt(order.endTime.split(':')[0])
    const hours = endH - startH
    const pricePerHour = teacher?.pricePerHour || 150
    const price = pricePerHour * hours
    convertTrialToConfirmed(orderId, price, pricePerHour)
    console.log('[Orders] 试听课转正式课:', orderId, '单价:', pricePerHour, '总价:', price)
  }

  const handleFindTeacher = () => {
    Taro.switchTab({ url: '/pages/recommend/index' })
  }

  const tabs: Array<{ key: TabType; label: string }> = [
    { key: 'upcoming', label: '待上课' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' }
  ]

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.content}>
        {activeTab === 'upcoming' && (
          <WeekCalendar
            orders={orders}
            selectedDate={selectedDate || undefined}
            onDateSelect={setSelectedDate}
          />
        )}

        {activeTab === 'upcoming' && upcomingSchedule.some(s => s.orderIds.length > 1) && (
          <View className={styles.mergeTip}>
            <Text className={styles.mergeTipIcon}>💡</Text>
            <Text className={styles.mergeTipText}>
              同一老师的相邻时段已自动合并为整段占用。点击「取消课程」可选择取消某一节，剩余时段自动拆分显示。
            </Text>
          </View>
        )}

        {activeTab === 'upcoming' && upcomingSchedule.length > 0 && (
          <View className={styles.scheduleCard}>
            <Text className={styles.scheduleTitle}>今日及未来课表</Text>
            {upcomingSchedule.map((slot, i) => {
              const relatedOrders = orders.filter(o => slot.orderIds.includes(o.id))
              const order = relatedOrders[0]
              const allTeachers = new Set(relatedOrders.map(o => o.teacherName))
              const teacherName = allTeachers.size === 1 ? Array.from(allTeachers)[0] : `${relatedOrders.length}位老师`
              return (
                <View key={i} className={styles.scheduleRow}>
                  <View className={styles.scheduleTime}>
                    <Text className={styles.scheduleTimeText}>
                      {slot.startTime}-{slot.endTime}
                    </Text>
                    <Text className={styles.scheduleDate}>{slot.date}</Text>
                  </View>
                  <View className={styles.scheduleInfo}>
                    <Text className={styles.scheduleSubject}>
                      {relatedOrders.map(o => o.subject).filter((v, idx, arr) => arr.indexOf(v) === idx).join('、')}
                    </Text>
                    <Text className={styles.scheduleTeacher}>
                      {teacherName}
                      {slot.orderIds.length > 1 && ` · ${slot.orderIds.length}节连订`}
                    </Text>
                  </View>
                  <View className={styles.scheduleStatus}>
                    {order?.status === 'trial' ? (
                      <Tag text='试听' color='info' size='small' />
                    ) : slot.orderIds.length > 1 ? (
                      <Tag text='合并' color='success' size='small' />
                    ) : (
                      <Tag text='已约' color='primary' size='small' />
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            {activeTab === 'upcoming' ? '待上课程' : activeTab === 'completed' ? '已完成课程' : '已取消课程'}
          </Text>
          <Text className={styles.sectionCount}>{filteredOrders.length} 节</Text>
        </View>

        {filteredOrders.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无{activeTab === 'upcoming' ? '待上' : activeTab === 'completed' ? '已完成' : '已取消'}的课程</Text>
            {activeTab === 'upcoming' && (
              <Button className={styles.emptyBtn} onClick={handleFindTeacher}>
                <Text className={styles.emptyBtnText}>去找老师</Text>
              </Button>
            )}
          </View>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onCancel={handleCancel}
              onConvertTrial={handleConvertTrial}
            />
          ))
        )}
      </View>
    </View>
  )
}

export default OrdersPage
