import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  Alert,
  Chip,
  Stack,
  IconButton,
  Typography,
  InputAdornment,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { Close, AttachMoney, Description, Category } from "@mui/icons-material"
import dayjs, { Dayjs } from "dayjs"
import { useDispatch, useSelector } from "react-redux"
import { createExpense, fetchExpenses } from "../../store/expenseSlice"
import { type ExpenseCategory } from "../../services/types"
import { type RootState, type AppDispatch } from "../../store"

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
}

const expenseCategories = [
  { name: "FOOD", label: "Food", color: "#FF6B6B", icon: "🍽️" },
  { name: "TRANSPORT", label: "Transport", color: "#4ECDC4", icon: "🚗" },
  { name: "ACCOMMODATION", label: "Accommodation", color: "#45B7D1", icon: "🏨" },
  { name: "OFFICE_SUPPLIES", label: "Office Supplies", color: "#96CEB4", icon: "📎" },
  { name: "SOFTWARE", label: "Software", color: "#FFEAA7", icon: "💻" },
  { name: "TRAINING", label: "Training", color: "#DDA0DD", icon: "📚" },
  { name: "MARKETING", label: "Marketing", color: "#98D8C8", icon: "📢" },
  { name: "TRAVEL", label: "Travel", color: "#F7DC6F", icon: "✈️" },
  { name: "ENTERTAINMENT", label: "Entertainment", color: "#AED6F1", icon: "🎭" },
  { name: "UTILITIES", label: "Utilities", color: "#D5DBDB", icon: "⚡" },
  { name: "OTHER", label: "Other", color: "#FFA07A", icon: "📋" },
]

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, onClose }) => {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<ExpenseCategory | "">("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const [errors, setErrors] = useState<string[]>([])

  const dispatch = useDispatch<AppDispatch>()
  const { loading, error } = useSelector((state: RootState) => state.expenses)

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setAmount("")
    setCategory("")
    setDescription("")
    setDate(dayjs())
    setErrors([])
  }

  const validateExpenseDate = (date: Date): string[] => {
    const errors: string[] = []
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    if (date > today) {
      errors.push("Date cannot be in the future")
    }

    if (date < oneYearAgo) {
      errors.push("Date cannot be more than 1 year in the past")
    }

    return errors
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!amount.trim()) {
      newErrors.push("Amount is required")
    } else {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount)) {
        newErrors.push("Amount must be a valid number")
      } else if (numAmount <= 0) {
        newErrors.push("Amount must be greater than 0")
      } else if (numAmount > 10000) {
        newErrors.push("Amount cannot exceed $10,000")
      } else if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
        newErrors.push("Amount can have at most 2 decimal places")
      }
    }

    if (!category) {
      newErrors.push("Category is required")
    }

    if (!description.trim()) {
      newErrors.push("Description is required")
    } else if (description.trim().length < 3) {
      newErrors.push("Description must be at least 3 characters")
    } else if (description.trim().length > 200) {
      newErrors.push("Description cannot exceed 200 characters")
    }

    if (!date) {
      newErrors.push("Date is required")
    } else {
      const dateErrors = validateExpenseDate(date.toDate())
      newErrors.push(...dateErrors)
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await dispatch(
        createExpense({
          amount: parseFloat(amount),
          category: category as ExpenseCategory,
          description: description.trim(),
          date: date!.format("YYYY-MM-DD"),
        })
      ).unwrap()

      // Refresh the expenses list
      dispatch(fetchExpenses())
      onClose()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrors([err.message || "Failed to create expense"])
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const isFormDisabled = loading

  const selectedCategoryData = expenseCategories.find(
    (cat) => cat.name === category
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" component="div">
              Add New Expense
            </Typography>
            <IconButton onClick={handleClose} disabled={isFormDisabled}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            {/* Error Display */}
            {errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Stack spacing={0.5}>
                  {errors.map((error, index) => (
                    <Typography key={index} variant="body2">
                      • {error}
                    </Typography>
                  ))}
                </Stack>
              </Alert>
            )}

            {/* Global Error */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Amount Field */}
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              margin="normal"
              required
              disabled={isFormDisabled}
              inputProps={{
                min: "0",
                step: "0.01",
                max: "10000",
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney />
                  </InputAdornment>
                ),
              }}
              helperText="Enter amount up to $10,000"
            />

            {/* Category Field with Visual Enhancement */}
            <TextField
              fullWidth
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              margin="normal"
              required
              disabled={isFormDisabled}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Category />
                  </InputAdornment>
                ),
              }}
            >
              {expenseCategories.map((cat) => (
                <MenuItem key={cat.name} value={cat.name}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <Chip
                      size="small"
                      sx={{
                        ml: "auto",
                        backgroundColor: cat.color,
                        color: "white",
                        minWidth: "8px",
                        height: "16px",
                      }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            {/* Category Preview */}
            {selectedCategoryData && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Chip
                  icon={<span>{selectedCategoryData.icon}</span>}
                  label={selectedCategoryData.label}
                  sx={{
                    backgroundColor: selectedCategoryData.color,
                    color: "white",
                  }}
                />
              </Box>
            )}

            {/* Description Field */}
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              required
              disabled={isFormDisabled}
              inputProps={{ maxLength: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment
                    position="start"
                    sx={{ alignSelf: "flex-start", mt: 2 }}
                  >
                    <Description />
                  </InputAdornment>
                ),
              }}
              helperText={`${description.length}/200 characters`}
            />

            {/* Date Field */}
            <DatePicker
              label="Expense Date"
              value={date}
              onChange={(newValue) => setDate(newValue)}
              disabled={isFormDisabled}
              maxDate={dayjs()}
              minDate={dayjs().subtract(1, "year")}
              sx={{ width: "100%", mt: 2 }}
              slotProps={{
                textField: {
                  helperText:
                    "Date cannot be in the future or older than 1 year",
                },
              }}
            />

            {/* Form Summary */}
            {amount && category && description && date && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.300",
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Expense Summary:
                </Typography>
                <Typography variant="body2">
                  <strong>${parseFloat(amount || "0").toFixed(2)}</strong> for{" "}
                  <strong>{selectedCategoryData?.label || category}</strong> on{" "}
                  <strong>{date.format("MMM DD, YYYY")}</strong>
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mt: 0.5 }}
                >
                  {description}
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={handleClose}
              disabled={isFormDisabled}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                isFormDisabled || !amount || !category || !description || !date
              }
              size="large"
            >
              {loading ? "Submitting..." : "Submit Expense"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </LocalizationProvider>
  )
}

export default ExpenseForm

// import React, { useState, useEffect } from "react"
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Button,
//   MenuItem,
//   Box,
//   Alert,
//   Chip,
//   Stack,
//   IconButton,
//   Typography,
//   InputAdornment,
// } from "@mui/material"
// import { DatePicker } from "@mui/x-date-pickers/DatePicker"
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
// import { Close, AttachMoney, Description, Category } from "@mui/icons-material"
// import dayjs, { Dayjs } from "dayjs"
// import { useAppDispatch, useAppSelector } from "../../store"
// import { createExpense } from "../../store/expenseSlice"
// import { validateExpenseDate } from "../../utils/dateHelpers"

// interface ExpenseFormProps {
//   open: boolean
//   onClose: () => void
// }

// const expenseCategories = [
//   { name: "Travel", color: "#FF6B6B", icon: "✈️" },
//   { name: "Meals", color: "#4ECDC4", icon: "🍽️" },
//   { name: "Office Supplies", color: "#45B7D1", icon: "📎" },
//   { name: "Software", color: "#96CEB4", icon: "💻" },
//   { name: "Training", color: "#FFEAA7", icon: "📚" },
//   { name: "Marketing", color: "#DDA0DD", icon: "📢" },
//   { name: "Equipment", color: "#98D8C8", icon: "🔧" },
//   { name: "Transportation", color: "#F7DC6F", icon: "🚗" },
//   { name: "Communication", color: "#AED6F1", icon: "📞" },
//   { name: "Other", color: "#D5DBDB", icon: "📋" },
// ]

// const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, onClose }) => {
//   const [amount, setAmount] = useState("")
//   const [category, setCategory] = useState("")
//   const [description, setDescription] = useState("")
//   const [date, setDate] = useState<Dayjs | null>(dayjs())
//   const [errors, setErrors] = useState<string[]>([])
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const dispatch = useAppDispatch()
//   const { isLoading } = useAppSelector((state) => state.expenses)

//   useEffect(() => {
//     if (!open) {
//       resetForm()
//     }
//   }, [open])

//   const resetForm = () => {
//     setAmount("")
//     setCategory("")
//     setDescription("")
//     setDate(dayjs())
//     setErrors([])
//     setIsSubmitting(false)
//   }

//   const validateForm = (): boolean => {
//     const newErrors: string[] = []

//     if (!amount.trim()) {
//       newErrors.push("Amount is required")
//     } else {
//       const numAmount = parseFloat(amount)
//       if (isNaN(numAmount)) {
//         newErrors.push("Amount must be a valid number")
//       } else if (numAmount <= 0) {
//         newErrors.push("Amount must be greater than 0")
//       } else if (numAmount > 10000) {
//         newErrors.push("Amount cannot exceed $10,000")
//       } else if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
//         newErrors.push("Amount can have at most 2 decimal places")
//       }
//     }

//     if (!category.trim()) {
//       newErrors.push("Category is required")
//     }

//     if (!description.trim()) {
//       newErrors.push("Description is required")
//     } else if (description.trim().length < 3) {
//       newErrors.push("Description must be at least 3 characters")
//     } else if (description.trim().length > 200) {
//       newErrors.push("Description cannot exceed 200 characters")
//     }

//     if (!date) {
//       newErrors.push("Date is required")
//     } else {
//       const dateErrors = validateExpenseDate(date.toDate())
//       newErrors.push(...dateErrors)
//     }

//     setErrors(newErrors)
//     return newErrors.length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!validateForm()) {
//       return
//     }

//     setIsSubmitting(true)

//     try {
//       await dispatch(
//         createExpense({
//           amount: parseFloat(amount),
//           category: category.trim(),
//           description: description.trim(),
//           date: date!.toDate(),
//         })
//       ).unwrap()

//       onClose()
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (err: any) {
//       setErrors([err.message || "Failed to create expense"])
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleClose = () => {
//     if (!isSubmitting) {
//       onClose()
//     }
//   }

//   const isFormDisabled = isSubmitting || isLoading

//   const selectedCategoryData = expenseCategories.find(
//     (cat) => cat.name === category
//   )

//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs}>
//       <Dialog
//         open={open}
//         onClose={handleClose}
//         maxWidth="sm"
//         fullWidth
//         PaperProps={{
//           sx: { borderRadius: 2 },
//         }}
//       >
//         <DialogTitle sx={{ pb: 1 }}>
//           <Box
//             display="flex"
//             justifyContent="space-between"
//             alignItems="center"
//           >
//             <Typography variant="h5" component="div">
//               Add New Expense
//             </Typography>
//             <IconButton onClick={handleClose} disabled={isFormDisabled}>
//               <Close />
//             </IconButton>
//           </Box>
//         </DialogTitle>

//         <Box component="form" onSubmit={handleSubmit}>
//           <DialogContent sx={{ pt: 2 }}>
//             {/* Error Display */}
//             {errors.length > 0 && (
//               <Alert severity="error" sx={{ mb: 3 }}>
//                 <Stack spacing={0.5}>
//                   {errors.map((error, index) => (
//                     <Typography key={index} variant="body2">
//                       • {error}
//                     </Typography>
//                   ))}
//                 </Stack>
//               </Alert>
//             )}

//             {/* Amount Field */}
//             <TextField
//               fullWidth
//               label="Amount"
//               type="number"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               margin="normal"
//               required
//               disabled={isFormDisabled}
//               inputProps={{
//                 min: "0",
//                 step: "0.01",
//                 max: "10000",
//               }}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <AttachMoney />
//                   </InputAdornment>
//                 ),
//               }}
//               helperText="Enter amount up to $10,000"
//             />

//             {/* Category Field with Visual Enhancement */}
//             <TextField
//               fullWidth
//               select
//               label="Category"
//               value={category}
//               onChange={(e) => setCategory(e.target.value)}
//               margin="normal"
//               required
//               disabled={isFormDisabled}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Category />
//                   </InputAdornment>
//                 ),
//               }}
//             >
//               {expenseCategories.map((cat) => (
//                 <MenuItem key={cat.name} value={cat.name}>
//                   <Box display="flex" alignItems="center" gap={1}>
//                     <span>{cat.icon}</span>
//                     <span>{cat.name}</span>
//                     <Chip
//                       size="small"
//                       sx={{
//                         ml: "auto",
//                         backgroundColor: cat.color,
//                         color: "white",
//                         minWidth: "8px",
//                         height: "16px",
//                       }}
//                     />
//                   </Box>
//                 </MenuItem>
//               ))}
//             </TextField>

//             {/* Category Preview */}
//             {selectedCategoryData && (
//               <Box sx={{ mt: 1, mb: 1 }}>
//                 <Chip
//                   icon={<span>{selectedCategoryData.icon}</span>}
//                   label={selectedCategoryData.name}
//                   sx={{
//                     backgroundColor: selectedCategoryData.color,
//                     color: "white",
//                   }}
//                 />
//               </Box>
//             )}

//             {/* Description Field */}
//             <TextField
//               fullWidth
//               label="Description"
//               multiline
//               rows={3}
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               margin="normal"
//               required
//               disabled={isFormDisabled}
//               inputProps={{ maxLength: 200 }}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment
//                     position="start"
//                     sx={{ alignSelf: "flex-start", mt: 2 }}
//                   >
//                     <Description />
//                   </InputAdornment>
//                 ),
//               }}
//               helperText={`${description.length}/200 characters`}
//             />

//             {/* Date Field */}
//             <DatePicker
//               label="Expense Date"
//               value={date}
//               onChange={(newValue) => setDate(newValue)}
//               disabled={isFormDisabled}
//               maxDate={dayjs()}
//               minDate={dayjs().subtract(1, "year")}
//               sx={{ width: "100%", mt: 2 }}
//               slotProps={{
//                 textField: {
//                   helperText:
//                     "Date cannot be in the future or older than 1 year",
//                 },
//               }}
//             />

//             {/* Form Summary */}
//             {amount && category && description && date && (
//               <Box
//                 sx={{
//                   mt: 3,
//                   p: 2,
//                   backgroundColor: "grey.50",
//                   borderRadius: 1,
//                   border: "1px solid",
//                   borderColor: "grey.300",
//                 }}
//               >
//                 <Typography variant="subtitle2" gutterBottom>
//                   Expense Summary:
//                 </Typography>
//                 <Typography variant="body2">
//                   <strong>${parseFloat(amount || "0").toFixed(2)}</strong> for{" "}
//                   <strong>{category}</strong> on{" "}
//                   <strong>{date.format("MMM DD, YYYY")}</strong>
//                 </Typography>
//                 <Typography
//                   variant="body2"
//                   color="textSecondary"
//                   sx={{ mt: 0.5 }}
//                 >
//                   {description}
//                 </Typography>
//               </Box>
//             )}
//           </DialogContent>

//           <DialogActions sx={{ px: 3, pb: 3 }}>
//             <Button
//               onClick={handleClose}
//               disabled={isFormDisabled}
//               size="large"
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               variant="contained"
//               disabled={
//                 isFormDisabled || !amount || !category || !description || !date
//               }
//               size="large"
//             >
//               {isSubmitting ? "Submitting..." : "Submit Expense"}
//             </Button>
//           </DialogActions>
//         </Box>
//       </Dialog>
//     </LocalizationProvider>
//   )
// }

// export default ExpenseForm
