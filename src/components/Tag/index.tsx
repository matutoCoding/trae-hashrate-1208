import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface TagProps {
  text: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'orange' | 'cyan'
  size?: 'small' | 'medium'
  outlined?: boolean
}

const Tag: React.FC<TagProps> = ({ text, color = 'primary', size = 'small', outlined = false }) => {
  return (
    <View
      className={classnames(
        styles.tag,
        styles[`tag${color.charAt(0).toUpperCase()}${color.slice(1)}`],
        styles[size],
        outlined && styles.outlined
      )}
    >
      <Text className={styles.text}>{text}</Text>
    </View>
  )
}

export default Tag
