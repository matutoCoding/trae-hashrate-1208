import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react'
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
  convertTrialToConfirmed: (orderId: string, price: number, pricePerHour: number) => void
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

  const getTeacherById = useCallback((id: string): Teacher | undefined => {
    return teachers.find(t => t.id === id)
  }, [teachers])

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev])
  }, [])

  const addOrders = useCallback((newOrders: Order[]) => {
    setOrders(prev => [...newOrders, ...prev])
  }, [])

  const cancelOrder = useCallback((orderId: string, cancelHourIndex?: number) => {
    console.log('[AppContext] 取消订单:', orderId, '取消时段索引:', cancelHourIndex)

    setOrders(prev => {
      const target = prev.find(o => o.id === orderId)
      if (!target) return prev

      const startMin = timeToMinutes(target.startTime)
      const endMin = timeToMinutes(target.endTime)
      const totalHours = Math.round((endMin - startMin) / 60)
      const isLongCourse = target.isMerged && totalHours > 1 && cancelHourIndex !== undefined

      if (!isLongCourse) {
        return prev.map(o =>
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        )
      }

      const h = cancelHourIndex!
      const teacher = getTeacherById(target.teacherId)
      const pph = teacher?.pricePerHour || Math.round(target.price / totalHours)

      const cancelStart = startMin + h * 60
      const cancelEnd = cancelStart + 60
      const cancelledOrder: Order = {
        id: `${target.id}_cancel_${h}`,
        teacherId: target.teacherId,
        teacherName: target.teacherName,
        teacherAvatar: target.teacherAvatar,
        subject: target.subject,
        grade: target.grade,
        date: target.date,
        startTime: minutesToTime(cancelStart),
        endTime: minutesToTime(cancelEnd),
        status: 'cancelled',
        price: pph,
        address: target.address,
        isMerged: false,
        createdAt: target.createdAt
      }

      const newOrders: Order[] = [cancelledOrder]

      const beforeHours = h
      const afterHours = totalHours - h - 1

      if (beforeHours > 0) {
        newOrders.push({
          id: `${target.id}_before`,
          teacherId: target.teacherId,
          teacherName: target.teacherName,
          teacherAvatar: target.teacherAvatar,
          subject: target.subject,
          grade: target.grade,
          date: target.date,
          startTime: minutesToTime(startMin),
          endTime: minutesToTime(startMin + beforeHours * 60),
          status: 'confirmed',
          price: pph * beforeHours,
          address: target.address,
          isMerged: beforeHours > 1,
          createdAt: target.createdAt
        })
      }

      if (afterHours > 0) {
        const afterStart = startMin + (h + 1) * 60
        newOrders.push({
          id: `${target.id}_after`,
          teacherId: target.teacherId,
          teacherName: target.teacherName,
          teacherAvatar: target.teacherAvatar,
          subject: target.subject,
          grade: target.grade,
          date: target.date,
          startTime: minutesToTime(afterStart),
          endTime: minutesToTime(endMin),
          status: 'confirmed',
          price: pph * afterHours,
          address: target.address,
          isMerged: afterHours > 1,
          createdAt: target.createdAt
        })
      }

      console.log('[AppContext] 拆分 - 取消:', minutesToTime(cancelStart), '-', minutesToTime(cancelEnd), '| 剩余:', newOrders.filter(o => o.status !== 'cancelled').map(o => `${o.startTime}-${o.endTime}`))

      const filtered = prev.filter(o => o.id !== orderId)
      return [...newOrders, ...filtered]
    })
  }, [getTeacherById])

  const convertTrialToConfirmed = useCallback((orderId: string, price: number, pricePerHour: number) => {
    console.log('[AppContext] 试听课转正式课:', orderId, '总价:', price, '单价:', pricePerHour)
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o
        return {
          ...o,
          status: 'confirmed' as const,
          price,
          trialOriginInfo: {
            originalTrialDate: o.date,
            originalTrialStartTime: o.startTime,
            originalTrialEndTime: o.endTime,
            convertedAt: Date.now(),
            convertedPricePerHour: pricePerHour
          }
        }
      })
    )
  }, [])

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
  }), [weightConfig, currentRequirement, orders, teachers, getTeacherById, addOrder, addOrders, cancelOrder, convertTrialToConfirmed])

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
