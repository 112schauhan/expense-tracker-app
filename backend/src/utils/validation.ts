export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateExpenseDate = (date: any): string[] => {
  const errors: string[] = []

  if (!date) {
    errors.push("Date is required")
    return errors
  }

  const dateObj = typeof date === "string" ? new Date(date) : date

  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    errors.push("Invalid date format")
    return errors
  }

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (dateObj > today) {
    errors.push("Date cannot be in the future")
  }

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  if (dateObj < oneYearAgo) {
    errors.push("Date cannot be more than 1 year in the past")
  }

  return errors
}

export const validateExpense = (data: any): string[] => {
  const errors: string[] = []

  if (!data.amount || data.amount <= 0) {
    errors.push("Amount must be greater than 0")
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.push("Category is required")
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Description is required")
  }

  errors.push(...validateExpenseDate(data.date))

  return errors
}
