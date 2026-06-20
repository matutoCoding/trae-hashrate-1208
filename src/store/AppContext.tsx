import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import { WeightConfig, Requirement, Order, Teacher } from '@/types'
import { defaultWeightConfig } from '@/utils/scoring'
import { ordersData, teachersData } from '@/data'
import { splitMergedGroup } from '@/utils/schedule'

interface AppContextType {
  weightConfig: WeightConfig
  setWeightConfig: (config: WeightConfig) => void
  currentRequirement: Requirement | null
  setCurrentRequirement: (req: Requirement | null) => void
  orders: Order[]
  teachers: Teacher[]
  getTeacherById: (id: string) => Teacher | undefined
  addOrder: (order: Order) => void
  addOrders: (newOrders: Order[]) => void
  cancelOrder: (orderId: string) => void
  convertTrialToConfirmed: (orderId: string, price: number) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [weightConfig, setWeightConfig] = useState<WeightConfig>(defaultWeightConfig)
  const [currentRequirement, setCurrentRequirement] = useState<Requirement | null>({
    subject: '数学',
    grade: '高一',
    preferredTime: ['周六上午', '周日上午'],
    location: { lat: 39.9042, lng: 116.4074, address: '北京市朝阳区望京' },
    budget: 180,
    description: '孩子数学基础一般，希望提升解题能力'
  })
  const [orders, setOrders] = useState<Order[]>(ordersData)
  const [teachers] = useState<Teacher[]>(teachersData)

  const getTeacherById = (id: string): Teacher | undefined => {
    return teachers.find(t => t.id === id)
  }

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev])
    console.log('[AppContext] 新增订单:', order)
  }

  const addOrders = (newOrders: Order[]) => {
    setOrders(prev => [...newOrders, ...prev])
    console.log('[AppContext] 批量新增订单:', newOrders)
  }

  const findMergedGroupOrderIds = (allOrders: Order[], targetOrder: Order): string[] => {
    if (!targetOrder.isMerged || !targetOrder.mergedOrderIds) {
      return [targetOrder.id]
    }
    return targetOrder.mergedOrderIds
  }

  const cancelOrder = (orderId: string) => {
    console.log('[AppContext] 请求取消订单:', orderId)

    setOrders(prev => {
      const targetOrder = prev.find(o => o.id === orderId)
      if (!targetOrder) {
        console.error('[AppContext] 未找到订单:', orderId)
        return prev
      }

      if (!targetOrder.isMerged || !targetOrder.mergedOrderIds || targetOrder.mergedOrderIds.length <= 1) {
        console.log('[AppContext] 单条订单，直接取消')
        return prev.map(o =>
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        )
      }

      console.log('[AppContext] 取消合并组中的订单，合并组IDs:', targetOrder.mergedOrderIds)

      const groupIds = targetOrder.mergedOrderIds
      const groupOrders = prev.filter(o => groupIds.includes(o.id) && o.status !== 'cancelled')
      console.log('[AppContext] 合并组内有效订单数:', groupOrders.length)

      if (groupOrders.length <= 1) {
        return prev.map(o =>
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        )
      }

      const teacher = getTeacherById(targetOrder.teacherId)
      const pricePerHour = teacher?.pricePerHour || Math.round(targetOrder.price / 2)

      const splitResult = splitMergedGroup(
        groupOrders.map(o => ({
          orderId: o.id,
          teacherId: o.teacherId,
          date: o.date,
          startTime: o.startTime,
          endTime: o.endTime,
          pricePerHour
        })),
        orderId
      )

      console.log('[AppContext] 拆分结果:', splitResult)

      let newOrdersList = [...prev]

      newOrdersList = newOrdersList.map(o =>
        groupIds.includes(o.id) ? { ...o, status: 'cancelled' as const, isMerged: false, mergedOrderIds: undefined } : o
      )

      const now = Date.now()
      const newOrderObjs: Order[] = splitResult.newOrders.map((segment, idx) => {
        const newId = `o${now}_${idx}`
        return {
          id: newId,
          teacherId: segment.teacherId,
          teacherName: targetOrder.teacherName,
          teacherAvatar: targetOrder.teacherAvatar,
          subject: targetOrder.subject,
          grade: targetOrder.grade,
          date: segment.date,
          startTime: segment.startTime,
          endTime: segment.endTime,
          status: 'confirmed' as const,
          price: pricePerHour * segment.hourCount,
          address: targetOrder.address,
          isMerged: segment.hourCount > 1
        }
      })

      console.log('[AppContext] 拆分后新增订单:', newOrderObjs)
      return [...newOrderObjs, ...newOrdersList]
    })
  }

  const convertTrialToConfirmed = (orderId: string, price: number) => {
    console.log('[AppContext] 试听课转正式课:', orderId, '价格:', price)
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId ? { ...o, status: 'confirmed' as const, price } : o
      )
    )
  }

  const value = useMemo(() => ({
    weightConfig,
    setWeightConfig,
    currentRequirement,
    setCurrentRequirement,
    orders,
    teachers,
    getTeacherById,
    addOrder,
    addOrders,
    cancelOrder,
    convertTrialToConfirmed
  }), [weightConfig, currentRequirement, orders, teachers])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
