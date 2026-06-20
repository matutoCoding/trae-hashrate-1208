import React, { useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppContext } from '@/store/AppContext'
import { sortTeachersByScore } from '@/utils/scoring'
import TeacherCard from '@/components/TeacherCard'
import ScoreBar from '@/components/ScoreBar'
import { subjectsData } from '@/data'
import styles from './index.module.scss'

const RecommendPage: React.FC = () => {
  const { currentRequirement, weightConfig, teachers } = useAppContext()
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>('')

  const sortedTeachers = useMemo(() => {
    if (!currentRequirement) return []
    let result = sortTeachersByScore(teachers, currentRequirement, weightConfig)
    if (selectedSubject) {
      result = result.filter(item => item.teacher.subjects.includes(selectedSubject))
    }
    return result
  }, [currentRequirement, weightConfig, teachers, selectedSubject])

  const handleWeightConfig = () => {
    Taro.navigateTo({ url: '/pages/weight-config/index' })
  }

  const handleToggleScoreDetail = (e: any, teacherId: string) => {
    e.stopPropagation()
    setShowScoreDetail(showScoreDetail === teacherId ? null : teacherId)
  }

  const handleGoDetail = (e: any, teacherId: string) => {
    e.stopPropagation()
    Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${teacherId}` })
  }

  const handleCardClick = (teacherId: string) => {
    Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${teacherId}` })
  }

  return (
    <View className={styles.page}>
      <View className={styles.filterBar}>
        <View
          className={`${styles.filterItem} ${selectedSubject === '' ? styles.active : ''}`}
          onClick={() => setSelectedSubject('')}
        >
          <Text className={styles.filterText}>全部</Text>
        </View>
        {subjectsData.slice(0, 4).map(s => (
          <View
            key={s.id}
            className={`${styles.filterItem} ${selectedSubject === s.name ? styles.active : ''}`}
            onClick={() => setSelectedSubject(s.name)}
          >
            <Text className={styles.filterText}>{s.name}</Text>
          </View>
        ))}
        <View className={styles.weightBtn} onClick={handleWeightConfig}>
          <Text>⚖️</Text>
          <Text className={styles.weightBtnText}>权重</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.resultInfo}>
          <Text className={styles.resultCount}>
            共找到 <Text className={styles.resultCountNum}>{sortedTeachers.length}</Text> 位匹配老师
          </Text>
          <Text className={styles.sortBy}>综合排序</Text>
        </View>

        {sortedTeachers.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🔍</Text>
            <Text className={styles.emptyText}>暂无匹配的老师</Text>
          </View>
        ) : (
          <View className={styles.teacherList}>
            {sortedTeachers.map((item, index) => (
              <View key={item.teacher.id}>
                <View onClick={() => handleCardClick(item.teacher.id)}>
                  <TeacherCard
                    teacher={item.teacher}
                    score={item.score}
                    rank={index + 1}
                    onClick={() => {}}
                  />
                </View>
                <View className={styles.cardActions}>
                  <View
                    className={styles.actionBtn}
                    onClick={(e) => handleToggleScoreDetail(e, item.teacher.id)}
                  >
                    <Text className={styles.actionBtnText}>
                      {showScoreDetail === item.teacher.id ? '收起评分' : '查看评分明细'}
                    </Text>
                  </View>
                  <View
                    className={styles.actionBtnPrimary}
                    onClick={(e) => handleGoDetail(e, item.teacher.id)}
                  >
                    <Text className={styles.actionBtnPrimaryText}>进入详情</Text>
                  </View>
                </View>
                {showScoreDetail === item.teacher.id && (
                  <View className={styles.scorePanel}>
                    <View className={styles.legendCard}>
                      <View className={styles.legendHeader}>
                        <Text className={styles.legendTitle}>评分明细</Text>
                        <Text
                          className={styles.legendGoDetail}
                          onClick={(e) => handleGoDetail(e, item.teacher.id)}
                        >
                          进入详情 →
                        </Text>
                      </View>
                      <ScoreBar
                        label='科目匹配'
                        score={item.score.subjectMatch}
                        color='#722ED1'
                      />
                      <ScoreBar
                        label='老师评分'
                        score={item.score.ratingScore}
                        color='#FFC53D'
                      />
                      <ScoreBar
                        label='距离远近'
                        score={item.score.distanceScore}
                        color='#14C9C9'
                      />
                      <ScoreBar
                        label='价格合适'
                        score={item.score.priceScore}
                        color='#F77234'
                      />
                      <ScoreBar
                        label='教学经验'
                        score={item.score.experienceScore}
                        color='#52C41A'
                      />
                      <View className={styles.legendItem}>
                        <View className={styles.legendDot} style={{ background: '#5B8FF9' }} />
                        <Text className={styles.legendText}>综合分: {item.score.totalScore}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default RecommendPage
