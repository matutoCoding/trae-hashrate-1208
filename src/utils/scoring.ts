import { Teacher, Requirement, WeightConfig, TeacherScore } from '@/types'

export const defaultWeightConfig: WeightConfig = {
  subjectMatch: 30,
  rating: 25,
  distance: 20,
  price: 15,
  experience: 10
}

export function calculateSubjectMatch(teacher: Teacher, requirement: Requirement): number {
  if (teacher.subjects.includes(requirement.subject)) {
    return 100
  }
  const matchCount = teacher.subjects.filter(s =>
    requirement.subject.includes(s) || s.includes(requirement.subject)
  ).length
  return Math.min(matchCount * 30, 60)
}

export function calculateRatingScore(rating: number): number {
  return Math.min(Math.round(rating * 20), 100)
}

export function calculateDistanceScore(distance: number): number {
  if (distance <= 1) return 100
  if (distance <= 3) return 90
  if (distance <= 5) return 75
  if (distance <= 10) return 50
  return Math.max(0, 50 - (distance - 10) * 3)
}

export function calculatePriceScore(teacherPrice: number, budget: number): number {
  const ratio = teacherPrice / budget
  if (ratio <= 0.8) return 100
  if (ratio <= 1) return 90
  if (ratio <= 1.2) return 70
  if (ratio <= 1.5) return 50
  return Math.max(0, 50 - (ratio - 1.5) * 50)
}

export function calculateExperienceScore(years: number): number {
  if (years >= 10) return 100
  if (years >= 5) return 85
  if (years >= 3) return 70
  if (years >= 1) return 50
  return 30
}

export function calculateTeacherScore(
  teacher: Teacher,
  requirement: Requirement,
  weights: WeightConfig = defaultWeightConfig
): TeacherScore {
  const subjectMatch = calculateSubjectMatch(teacher, requirement)
  const ratingScore = calculateRatingScore(teacher.rating)
  const distanceScore = calculateDistanceScore(teacher.distance)
  const priceScore = calculatePriceScore(teacher.pricePerHour, requirement.budget)
  const experienceScore = calculateExperienceScore(teacher.experience)

  const totalWeight =
    weights.subjectMatch +
    weights.rating +
    weights.distance +
    weights.price +
    weights.experience

  const totalScore = Math.round(
    (subjectMatch * weights.subjectMatch +
      ratingScore * weights.rating +
      distanceScore * weights.distance +
      priceScore * weights.price +
      experienceScore * weights.experience) /
      totalWeight
  )

  return {
    teacherId: teacher.id,
    totalScore,
    subjectMatch,
    ratingScore,
    distanceScore,
    priceScore,
    experienceScore
  }
}

export function sortTeachersByScore(
  teachers: Teacher[],
  requirement: Requirement,
  weights: WeightConfig = defaultWeightConfig
): Array<{ teacher: Teacher; score: TeacherScore }> {
  const result = teachers.map(teacher => ({
    teacher,
    score: calculateTeacherScore(teacher, requirement, weights)
  }))
  result.sort((a, b) => b.score.totalScore - a.score.totalScore)
  return result
}
