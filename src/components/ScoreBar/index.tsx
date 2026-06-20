import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

interface ScoreBarProps {
  label: string
  score: number
  color?: string
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, score, color }) => {
  const bgColor = color || '#5B8FF9'
  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.label}>{label}</Text>
        <Text className={styles.score}>{score}分</Text>
      </View>
      <View className={styles.track}>
        <View
          className={styles.fill}
          style={{ width: `${score}%`, background: bgColor }}
        />
      </View>
    </View>
  )
}

export default ScoreBar
