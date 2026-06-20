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

  const handleToggleScoreDetail = (teacherId: string) => {
    setShowScoreDetail(showScoreDetail === teacherId ? null : teacherId)
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
                <TeacherCard
                  teacher={item.teacher}
                  score={item.score}
                  rank={index + 1}
                  onClick={() => handleToggleScoreDetail(item.teacher.id)}
                />
                {showScoreDetail === item.teacher.id && (
                  <View className={styles.scorePanel} style={{ display: 'block' }}>
                    <View className={styles.legendCard}>
                      <Text className={styles.legendTitle}>评分明细</Text>
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
