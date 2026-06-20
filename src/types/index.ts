export interface Teacher {
  id: string
  name: string
  avatar: string
  gender: 'male' | 'female'
  age: number
  subjects: string[]
  grades: string[]
  rating: number
  reviewCount: number
  experience: number
  pricePerHour: number
  distance: number
  introduction: string
  tags: string[]
  availableSlots: TimeSlot[]
  location: {
    lat: number
    lng: number
    address: string
  }
}

export interface TimeSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  available: boolean
}

export interface TrialOriginInfo {
  originalTrialDate: string
  originalTrialStartTime: string
  originalTrialEndTime: string
  convertedAt: number
  convertedPricePerHour: number
}

export interface Order {
  id: string
  teacherId: string
  teacherName: string
  teacherAvatar: string
  subject: string
  grade: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'trial'
  price: number
  address: string
  isMerged?: boolean
  mergedOrderIds?: string[]
  trialOriginInfo?: TrialOriginInfo
  createdAt?: number
}

export interface Subject {
  id: string
  name: string
  icon: string
  color: string
}

export interface WeightConfig {
  subjectMatch: number
  rating: number
  distance: number
  price: number
  experience: number
}

export interface Requirement {
  id?: string
  subject: string
  grade: string
  preferredTime: string[]
  location: {
    lat: number
    lng: number
    address: string
  }
  budget: number
  description: string
}

export interface TeacherScore {
  teacherId: string
  totalScore: number
  subjectMatch: number
  ratingScore: number
  distanceScore: number
  priceScore: number
  experienceScore: number
}
