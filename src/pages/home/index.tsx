import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppContext } from '@/store/AppContext'
import { subjectsData } from '@/data'
import { sortTeachersByScore } from '@/utils/scoring'
import Tag from '@/components/Tag'
import TeacherCard from '@/components/TeacherCard'
import styles from './index.module.scss'

const HomePage: React.FC = () => {
  const { currentRequirement, weightConfig, teachers } = useAppContext()

  const recommendedTeachers = useMemo(() => {
    if (!currentRequirement) return []
    const sorted = sortTeachersByScore(teachers, currentRequirement, weightConfig)
    return sorted.slice(0, 3)
  }, [currentRequirement, weightConfig, teachers])

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    teachers.forEach(t => {
      t.subjects.forEach(s => {
        counts[s] = (counts[s] || 0) + 1
      })
    })
    return counts
  }, [teachers])

  const handlePublish = () => {
    Taro.navigateTo({ url: '/pages/publish-order/index' })
  }

  const handleWeightConfig = () => {
    Taro.navigateTo({ url: '/pages/weight-config/index' })
  }

  const handleGoRecommend = () => {
    Taro.switchTab({ url: '/pages/recommend/index' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.greeting}>
          <Text className={styles.greetingText}>您好，欢迎使用优师派 👋</Text>
          <Text className={styles.subGreeting}>智能匹配最合适的上门家教老师</Text>
        </View>
        <View className={styles.searchCard} onClick={handlePublish}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text className={styles.searchPlaceholder}>搜索科目、老师或发布需求</Text>
          <View className={styles.quickPublish}>
            <Text className={styles.quickPublishText}>发布需求</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <View className={styles.quickActions}>
            <View className={styles.actionItem} onClick={handlePublish}>
              <View className={`${styles.actionIcon} ${styles.action1}`}>
                <Text>📝</Text>
              </View>
              <Text className={styles.actionText}>发布需求</Text>
            </View>
            <View className={styles.actionItem} onClick={handleGoRecommend}>
              <View className={`${styles.actionIcon} ${styles.action2}`}>
                <Text>🏆</Text>
              </View>
              <Text className={styles.actionText}>智能推荐</Text>
            </View>
            <View className={styles.actionItem} onClick={handleWeightConfig}>
              <View className={`${styles.actionIcon} ${styles.action3}`}>
                <Text>⚖️</Text>
              </View>
              <Text className={styles.actionText}>权重配置</Text>
            </View>
            <View className={styles.actionItem}>
              <View className={`${styles.actionIcon} ${styles.action4}`}>
                <Text>📚</Text>
              </View>
              <Text className={styles.actionText}>科目大全</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>热门科目</Text>
          </View>
          <ScrollView scrollX className={styles.subjectScroll} enhanced showScrollbar={false}>
            {subjectsData.map(subject => (
              <View key={subject.id} className={styles.subjectCard}>
                <View
                  className={styles.subjectIcon}
                  style={{ background: subject.color }}
                >
                  <Text>{subject.icon}</Text>
                </View>
                <Text className={styles.subjectName}>{subject.name}</Text>
                <Text className={styles.subjectCount}>{subjectCounts[subject.name] || 0}位老师</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {currentRequirement && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>我的需求</Text>
              <Text className={styles.sectionMore} onClick={handlePublish}>修改</Text>
            </View>
            <View className={styles.requirementCard}>
              <View className={styles.reqHeader}>
                <Tag text='当前需求' color='primary' size='small' />
                <Text className={styles.reqChange} onClick={handlePublish}>重新填写</Text>
              </View>
              <View className={styles.reqContent}>
                <Tag text={currentRequirement.subject} color='purple' size='medium' />
                <Tag text={currentRequirement.grade} color='info' size='medium' outlined />
                {currentRequirement.preferredTime.map((t, i) => (
                  <Tag key={i} text={t} color='cyan' size='medium' outlined />
                ))}
              </View>
              <View className={styles.reqRow}>
                <View>
                  <Text className={styles.reqBudget}>预算：</Text>
                  <Text className={styles.reqBudgetNum}>¥{currentRequirement.budget}</Text>
                  <Text className={styles.reqBudget}>/小时</Text>
                </View>
                <Text className={styles.reqTeachers} onClick={handleGoRecommend}>
                  查看匹配老师 →
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>为你推荐</Text>
            <Text className={styles.sectionMore} onClick={handleGoRecommend}>查看更多</Text>
          </View>
          {recommendedTeachers.map((item, index) => (
            <TeacherCard
              key={item.teacher.id}
              teacher={item.teacher}
              score={item.score}
              rank={index + 1}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

export default HomePage
