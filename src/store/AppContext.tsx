import React, { createContext, useContext, useState, ReactNode } from 'react'
import { WeightConfig, Requirement, Order, Teacher } from '@/types'
import { defaultWeightConfig } from '@/utils/scoring'
import { ordersData, teachersData } from '@/data'

interface AppContextType {
  weightConfig: WeightConfig
  setWeightConfig: (config: WeightConfig) => void
  currentRequirement: Requirement | null
  setCurrentRequirement: (req: Requirement | null) => void
  orders: Order[]
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  cancelOrder: (orderId: string) => void
  teachers: Teacher[]
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

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev])
  }

  const cancelOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId ? { ...o, status: 'cancelled' as const } : o
      )
    )
  }

  return (
    <AppContext.Provider
      value={{
        weightConfig,
        setWeightConfig,
        currentRequirement,
        setCurrentRequirement,
        orders,
        setOrders,
        addOrder,
        cancelOrder,
        teachers
      }}
    >
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
