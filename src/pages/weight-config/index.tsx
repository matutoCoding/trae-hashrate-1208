import React, { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppContext } from '@/store/AppContext'
import { WeightConfig } from '@/types'
import { defaultWeightConfig } from '@/utils/scoring'
import WeightSlider from '@/components/WeightSlider'
import classnames from 'classnames'
import styles from './index.module.scss'

interface Preset {
  name: string
  config: WeightConfig
}

const presets: Preset[] = [
  {
    name: '均衡推荐',
    config: { subjectMatch: 30, rating: 25, distance: 20, price: 15, experience: 10 }
  },
  {
    name: '看重口碑',
    config: { subjectMatch: 25, rating: 40, distance: 15, price: 10, experience: 10 }
  },
  {
    name: '就近优先',
    config: { subjectMatch: 25, rating: 20, distance: 40, price: 10, experience: 5 }
  },
  {
    name: '性价比',
    config: { subjectMatch: 25, rating: 15, distance: 15, price: 35, experience: 10 }
  },
  {
    name: '经验优先',
    config: { subjectMatch: 25, rating: 20, distance: 10, price: 10, experience: 35 }
  }
]

const WeightConfigPage: React.FC = () => {
  const { weightConfig, setWeightConfig } = useAppContext()
  const [localConfig, setLocalConfig] = useState<WeightConfig>(weightConfig)
  const [activePreset, setActivePreset] = useState<string>('')

  const totalWeight =
    localConfig.subjectMatch +
    localConfig.rating +
    localConfig.distance +
    localConfig.price +
    localConfig.experience

  const handleChange = (key: keyof WeightConfig, value: number) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }))
    setActivePreset('')
  }

  const handlePreset = (preset: Preset) => {
    setLocalConfig(preset.config)
    setActivePreset(preset.name)
  }

  const handleReset = () => {
    setLocalConfig(defaultWeightConfig)
    setActivePreset('均衡推荐')
    Taro.showToast({ title: '已恢复默认', icon: 'success' })
  }

  const handleSave = () => {
    if (totalWeight !== 100) {
      Taro.showToast({
        title: `权重总和需为100%（当前${totalWeight}%）`,
        icon: 'none',
        duration: 2000
      })
      return
    }
    setWeightConfig(localConfig)
    console.log('[WeightConfig] 保存权重配置:', localConfig)
    Taro.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 800)
  }

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.tipCard}>
          <Text className={styles.tipTitle}>💡 关于推荐权重</Text>
          <Text className={styles.tipText}>
            调整各维度的权重占比，系统将根据您的偏好计算老师综合匹配分。权重总和应为100%，您也可以选择下方的快捷预设方案。
          </Text>
        </View>

        <View className={styles.configCard}>
          <Text className={styles.cardTitle}>快捷预设</Text>
          <View className={styles.presetBar}>
            {presets.map(preset => (
              <Button
                key={preset.name}
                className={classnames(styles.presetBtn, activePreset === preset.name && styles.active)}
                onClick={() => handlePreset(preset)}
              >
                <Text className={styles.presetText}>{preset.name}</Text>
              </Button>
            ))}
          </View>

          <View
            className={classnames(
              styles.totalWeight,
              totalWeight !== 100 && styles.totalWarn
            )}
          >
            <Text className={styles.totalLabel}>权重总和</Text>
            <Text className={classnames(styles.totalValue, totalWeight !== 100 && styles.totalWarn)}>
              {totalWeight}%
              {totalWeight !== 100 && '（需为100%）'}
            </Text>
          </View>
        </View>

        <View className={styles.configCard}>
          <Text className={styles.cardTitle}>自定义权重</Text>
          <WeightSlider
            label='科目匹配度'
            value={localConfig.subjectMatch}
            color='#722ED1'
            onChange={(v) => handleChange('subjectMatch', v)}
          />
          <WeightSlider
            label='老师评分'
            value={localConfig.rating}
            color='#FFC53D'
            onChange={(v) => handleChange('rating', v)}
          />
          <WeightSlider
            label='距离远近'
            value={localConfig.distance}
            color='#14C9C9'
            onChange={(v) => handleChange('distance', v)}
          />
          <WeightSlider
            label='价格合适'
            value={localConfig.price}
            color='#F77234'
            onChange={(v) => handleChange('price', v)}
          />
          <WeightSlider
            label='教学经验'
            value={localConfig.experience}
            color='#52C41A'
            onChange={(v) => handleChange('experience', v)}
          />
        </View>
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.resetBtn} onClick={handleReset}>
          <Text className={styles.resetText}>恢复默认</Text>
        </Button>
        <Button className={styles.saveBtn} onClick={handleSave}>
          <Text className={styles.saveText}>保存配置</Text>
        </Button>
      </View>
    </View>
  )
}

export default WeightConfigPage
