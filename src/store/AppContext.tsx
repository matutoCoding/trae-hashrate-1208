import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import { WeightConfig, Requirement, Order, Teacher } from '@/types'
import { defaultWeightConfig } from '@/utils/scoring'
import { ordersData, teachersData } from '@/data'

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
  cancelOrder: (orderId: string, cancelHourIndex?: number) => void
  convertTrialToConfirmed: (orderId: string, price: number) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

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

  const cancelOrder = (orderId: string, cancelHourIndex?: number) => {
    console.log('[AppContext] 请求取消订单:', orderId, '取消时段索引:', cancelHourIndex)

    setOrders(prev => {
      const targetOrder = prev.find(o => o.id === orderId)
      if (!targetOrder) {
        console.error('[AppContext] 未找到订单:', orderId)
        return prev
      }

      const startMin = timeToMinutes(targetOrder.startTime)
      const endMin = timeToMinutes(targetOrder.endTime)
      const totalHours = (endMin - startMin) / 60

      if (!targetOrder.isMerged || totalHours <= 1) {
        console.log('[AppContext] 单小时订单，直接取消')
        return prev.map(o =>
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        )
      }

      const hourToCancel = cancelHourIndex ?? Math.floor(totalHours / 2)
      console.log('[AppContext] 取消合并订单中第', hourToCancel + 1, '个小时')

      const teacher = getTeacherById(targetOrder.teacherId)
      const pricePerHour = teacher?.pricePerHour || Math.round(targetOrder.price / totalHours)

      const beforeHours = hourToCancel
      const afterHours = totalHours - hourToCancel - 1

      let newOrdersList = prev.map(o =>
        o.id === orderId ? { ...o, status: 'cancelled' as const } : o
      )

      const now = Date.now()
      const newOrderObjs: Order[] = []

      if (beforeHours > 0) {
        const segStart = startMin
        const segEnd = startMin + beforeHours * 60
        newOrderObjs.push({
          id: `o${now}_before`,
          teacherId: targetOrder.teacherId,
          teacherName: targetOrder.teacherName,
          teacherAvatar: targetOrder.teacherAvatar,
          subject: targetOrder.subject,
          grade: targetOrder.grade,
          date: targetOrder.date,
          startTime: minutesToTime(segStart),
          endTime: minutesToTime(segEnd),
          status: 'confirmed' as const,
          price: pricePerHour * beforeHours,
          address: targetOrder.address,
          isMerged: beforeHours > 1
        })
      }

      if (afterHours > 0) {
        const segStart = startMin + (hourToCancel + 1) * 60
        const segEnd = endMin
        newOrderObjs.push({
          id: `o${now}_after`,
          teacherId: targetOrder.teacherId,
          teacherName: targetOrder.teacherName,
          teacherAvatar: targetOrder.teacherAvatar,
          subject: targetOrder.subject,
          grade: targetOrder.grade,
          date: targetOrder.date,
          startTime: minutesToTime(segStart),
          endTime: minutesToTime(segEnd),
          status: 'confirmed' as const,
          price: pricePerHour * afterHours,
          address: targetOrder.address,
          isMerged: afterHours > 1
        })
      }

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
