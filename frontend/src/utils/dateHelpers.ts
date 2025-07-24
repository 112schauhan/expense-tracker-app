import dayjs from "dayjs"
import quarterOfYear from "dayjs/plugin/quarterOfYear"
dayjs.extend(quarterOfYear)

export const formatDate = (date: Date | string): string => {
  return dayjs(date).format("MMM DD, YYYY")
}

export const formatDateForInput = (date: Date | string): string => {
  return dayjs(date).format("YYYY-MM-DD")
}

export const formatDateTime = (date: Date | string): string => {
  return dayjs(date).format("MMM DD, YYYY HH:mm")
}

export const formatRelativeTime = (date: Date | string): string => {
  return dayjs(date).fromNow()
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
  oneYearAgo.setHours(0, 0, 0, 0)
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

export const getDateRange = (period: "week" | "month" | "quarter" | "year") => {
  const now = dayjs()

  switch (period) {
    case "week":
      return {
        start: now.startOf("week").toDate(),
        end: now.endOf("week").toDate(),
      }
    case "month":
      return {
        start: now.startOf("month").toDate(),
        end: now.endOf("month").toDate(),
      }
    case "quarter":
      return {
        start: now.startOf("quarter").toDate(),
        end: now.endOf("quarter").toDate(),
      }
    case "year":
      return {
        start: now.startOf("year").toDate(),
        end: now.endOf("year").toDate(),
      }
    default:
      return {
        start: now.startOf("month").toDate(),
        end: now.endOf("month").toDate(),
      }
  }
}

export const isToday = (date: Date | string): boolean => {
  return dayjs(date).isSame(dayjs(), "day")
}

export const isThisWeek = (date: Date | string): boolean => {
  return dayjs(date).isSame(dayjs(), "week")
}

export const isThisMonth = (date: Date | string): boolean => {
  return dayjs(date).isSame(dayjs(), "month")
}

export const isThisYear = (date: Date | string): boolean => {
  return dayjs(date).isSame(dayjs(), "year")
}

// import dayjs from "dayjs"

// export const formatDate = (date: Date | string): string => {
//   return dayjs(date).format("MMM DD, YYYY")
// }

// export const formatDateForInput = (date: Date | string): string => {
//   return dayjs(date).format("YYYY-MM-DD")
// }

// export const isValidDate = (date: Date): boolean => {
//   return date instanceof Date && !isNaN(date.getTime())
// }

// export const isDateInFuture = (date: Date): boolean => {
//   const today = new Date()
//   today.setHours(23, 59, 59, 999)
//   return date > today
// }

// export const isDateTooOld = (date: Date): boolean => {
//   const oneYearAgo = new Date()
//   oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
//   return date < oneYearAgo
// }

// export const validateExpenseDate = (date: Date): string[] => {
//   const errors: string[] = []

//   if (!isValidDate(date)) {
//     errors.push("Invalid date")
//     return errors
//   }

//   if (isDateInFuture(date)) {
//     errors.push("Date cannot be in the future")
//   }

//   if (isDateTooOld(date)) {
//     errors.push("Date cannot be more than 1 year in the past")
//   }

//   return errors
// }
