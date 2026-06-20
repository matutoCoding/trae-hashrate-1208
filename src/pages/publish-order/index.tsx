import React, { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { subjectsData, gradesData } from '@/data'
import { useAppContext } from '@/store/AppContext'
import classnames from 'classnames'
import styles from './index.module.scss'

const timeSlots = ['工作日晚上', '周六上午', '周六下午', '周六晚上', '周日上午', '周日下午', '周日晚上']

const PublishOrderPage: React.FC = () => {
  const { setCurrentRequirement } = useAppContext()
  const [subject, setSubject] = useState('数学')
  const [grade, setGrade] = useState('高一')
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['周六上午', '周日上午'])
  const [budget, setBudget] = useState(180)

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time))
    } else {
      setSelectedTimes([...selectedTimes, time])
    }
  }

  const handleSubmit = () => {
    if (!subject || !grade || selectedTimes.length === 0) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    setCurrentRequirement({
      subject,
      grade,
      preferredTime: selectedTimes,
      location: { lat: 39.9042, lng: 116.4074, address: '北京市朝阳区望京' },
      budget,
      description: ''
    })
    console.log('[PublishOrder] 发布需求:', { subject, grade, selectedTimes, budget })
    Taro.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/recommend/index' })
    }, 1000)
  }

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.tipBox}>
          <Text className={styles.tipText}>📝 填写详细的需求信息，系统将为您智能匹配最合适的老师，支持免费试听！</Text>
        </View>

        <View className={styles.formCard}>
          <Text className={styles.formTitle}>基本信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>辅导科目</Text>
            <View style={{ flex: 1 }}>
              <View className={styles.tagsWrap}>
                {subjectsData.map(s => (
                  <View
                    key={s.id}
                    className={classnames(styles.tagItem, subject === s.name && styles.selected)}
                    onClick={() => setSubject(s.name)}
                  >
                    <Text className={styles.tagText}>{s.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>年级</Text>
            <View style={{ flex: 1 }}>
              <View className={styles.tagsWrap}>
                {gradesData.map(g => (
                  <View
                    key={g}
                    className={classnames(styles.tagItem, grade === g && styles.selected)}
                    onClick={() => setGrade(g)}
                  >
                    <Text className={styles.tagText}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View className={styles.formCard}>
          <Text className={styles.formTitle}>时间与预算</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>上课时间</Text>
            <View style={{ flex: 1 }}>
              <View className={styles.tagsWrap}>
                {timeSlots.map(t => (
                  <View
                    key={t}
                    className={classnames(styles.tagItem, selectedTimes.includes(t) && styles.selected)}
                    onClick={() => toggleTime(t)}
                  >
                    <Text className={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>预算</Text>
            <View style={{ flex: 1 }}>
              <View className={styles.tagsWrap}>
                {[100, 150, 180, 200, 250, 300].map(p => (
                  <View
                    key={p}
                    className={classnames(styles.tagItem, budget === p && styles.selected)}
                    onClick={() => setBudget(p)}
                  >
                    <Text className={styles.tagText}>¥{p}/小时</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>上课地点</Text>
            <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text className={styles.formValue}>北京市朝阳区望京</Text>
              <Text className={styles.formArrow}>›</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>
          <Text className={styles.cancelText}>取消</Text>
        </Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          <Text className={styles.submitText}>发布并匹配老师</Text>
        </Button>
      </View>
    </View>
  )
}

export default PublishOrderPage
