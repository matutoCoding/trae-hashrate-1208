import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import Tag from '../Tag'
import { Teacher, TeacherScore } from '@/types'
import { formatDistance } from '@/utils/distance'
import styles from './index.module.scss'

interface TeacherCardProps {
  teacher: Teacher
  score?: TeacherScore
  rank?: number
  showScore?: boolean
  onClick?: () => void
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, score, rank, showScore = true, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${teacher.id}` })
    }
  }

  return (
    <View className={styles.card} onClick={handleClick}>
      {rank && rank <= 3 && (
        <View className={classnames(styles.rankBadge, styles[`rank${rank}`])}>
          <Text className={styles.rankText}>TOP{rank}</Text>
        </View>
      )}
      <View className={styles.header}>
        <View className={styles.avatarWrap}>
          <Image
            className={styles.avatar}
            src={teacher.avatar}
            mode='aspectFill'
          />
          {showScore && score && (
            <View className={styles.totalScore}>
              <Text className={styles.totalScoreNum}>{score.totalScore}</Text>
              <Text className={styles.totalScoreLabel}>匹配分</Text>
            </View>
          )}
        </View>
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{teacher.name}</Text>
            <View className={styles.rating}>
              <Text className={styles.star}>★</Text>
              <Text className={styles.ratingNum}>{teacher.rating}</Text>
              <Text className={styles.reviewCount}>({teacher.reviewCount})</Text>
            </View>
          </View>
          <View className={styles.metaRow}>
            <Text className={styles.meta}>{teacher.gender === 'male' ? '男' : '女'} · {teacher.age}岁</Text>
            <Text className={styles.meta}>教龄{teacher.experience}年</Text>
            <Text className={styles.meta}>
              <Text className={styles.distanceIcon}>📍</Text>
              {formatDistance(teacher.distance)}
            </Text>
          </View>
          <View className={styles.subjectsRow}>
            {teacher.subjects.map((s, i) => (
              <Tag key={i} text={s} color='purple' size='small' />
            ))}
            {teacher.grades.map((g, i) => (
              <Tag key={`g${i}`} text={g} color='info' size='small' outlined />
            ))}
          </View>
        </View>
      </View>
      <View className={styles.intro}>
        <Text className={styles.introText}>{teacher.introduction}</Text>
      </View>
      <View className={styles.footer}>
        <View className={styles.tagsRow}>
          {teacher.tags.slice(0, 3).map((t, i) => (
            <Tag key={i} text={t} color='warning' size='small' outlined />
          ))}
        </View>
        <View className={styles.priceRow}>
          <Text className={styles.priceSymbol}>¥</Text>
          <Text className={styles.price}>{teacher.pricePerHour}</Text>
          <Text className={styles.priceUnit}>/小时</Text>
        </View>
      </View>
    </View>
  )
}

export default TeacherCard
