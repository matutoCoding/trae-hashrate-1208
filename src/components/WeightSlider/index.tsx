import React from 'react'
import { View, Text, Slider } from '@tarojs/components'
import styles from './index.module.scss'

interface WeightSliderProps {
  label: string
  value: number
  min?: number
  max?: number
  color?: string
  onChange: (value: number) => void
}

const WeightSlider: React.FC<WeightSliderProps> = ({
  label,
  value,
  min = 0,
  max = 50,
  color = '#5B8FF9',
  onChange
}) => {
  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.label}>{label}</Text>
        <View className={styles.valueBadge} style={{ background: color }}>
          <Text className={styles.valueText}>{value}%</Text>
        </View>
      </View>
      <View className={styles.sliderWrap}>
        <Slider
          className={styles.slider}
          min={min}
          max={max}
          value={value}
          activeColor={color}
          backgroundColor='#F2F3F5'
          blockSize={28}
          blockColor={color}
          showValue={false}
          onChange={(e) => onChange(e.detail.value)}
        />
      </View>
    </View>
  )
}

export default WeightSlider
