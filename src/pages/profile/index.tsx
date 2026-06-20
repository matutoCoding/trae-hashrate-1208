import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppContext } from '@/store/AppContext'
import styles from './index.module.scss'

const ProfilePage: React.FC = () => {
  const { orders, weightConfig } = useAppContext()

  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    savedTeachers: 3,
    coupons: 2
  }

  const handleMenuClick = (menu: string) => {
    switch (menu) {
      case 'weight':
        Taro.navigateTo({ url: '/pages/weight-config/index' })
        break
      case 'publish':
        Taro.navigateTo({ url: '/pages/publish-order/index' })
        break
      default:
        Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>家</Text>
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>家长用户</Text>
            <View className={styles.userRole}>
              <Text className={styles.userRoleText}>家长端</Text>
            </View>
            <Text className={styles.userPhone}>138****8888</Text>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.totalOrders}</Text>
            <Text className={styles.statLabel}>总订单</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.completedOrders}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.savedTeachers}</Text>
            <Text className={styles.statLabel}>收藏老师</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.coupons}</Text>
            <Text className={styles.statLabel}>优惠券</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.menuCard}>
          <Text className={styles.menuTitle}>我的服务</Text>
          <View className={styles.menuItem} onClick={() => handleMenuClick('publish')}>
            <View className={styles.menuIcon}><Text>📝</Text></View>
            <Text className={styles.menuText}>发布授课需求</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('weight')}>
            <View className={styles.menuIcon}><Text>⚖️</Text></View>
            <Text className={styles.menuText}>推荐权重配置</Text>
            <View className={styles.menuBadge}>
              <Text>{weightConfig.subjectMatch + weightConfig.rating + weightConfig.distance + weightConfig.price + weightConfig.experience}%</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.menuIcon}><Text>🎯</Text></View>
            <Text className={styles.menuText}>试讲安排</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.menuIcon}><Text>❤️</Text></View>
            <Text className={styles.menuText}>收藏的老师</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        <View className={styles.menuCard}>
          <Text className={styles.menuTitle}>账户设置</Text>
          <View className={styles.menuItem}>
            <View className={styles.menuIcon}><Text>👤</Text></View>
            <Text className={styles.menuText}>个人信息</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.menuIcon}><Text>📍</Text></View>
            <Text className={styles.menuText}>地址管理</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.menuIcon}><Text>🔔</Text></View>
            <Text className={styles.menuText}>消息通知</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.menuIcon}><Text>❓</Text></View>
            <Text className={styles.menuText}>帮助与反馈</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default ProfilePage
