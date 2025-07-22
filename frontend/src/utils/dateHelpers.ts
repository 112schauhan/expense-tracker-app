import dayjs from "dayjs"

export const formatDate = (date: Date | string): string => {
  return dayjs(date).format("MMM DD, YYYY")
}

export const formatDateForInput = (date: Date | string): string => {
  return dayjs(date).format("YYYY-MM-DD")
}

export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime())
}

export const isDateInFuture = (date: Date): boolean => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date > today
}

export const isDateTooOld = (date: Date): boolean => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  return date < oneYearAgo
}

export const validateExpenseDate = (date: Date): string[] => {
  const errors: string[] = []

  if (!isValidDate(date)) {
    errors.push("Invalid date")
    return errors
  }

  if (isDateInFuture(date)) {
    errors.push("Date cannot be in the future")
  }

  if (isDateTooOld(date)) {
    errors.push("Date cannot be more than 1 year in the past")
  }

  return errors
}
