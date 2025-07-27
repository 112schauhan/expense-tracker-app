import React, { useState, useEffect, useMemo } from "react"
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Box,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Card,
  CardContent,
  Stack,
  Avatar,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import {
  Check,
  Close,
  FilterList,
  Search,
  ClearAll,
  GetApp,
  Visibility,
  ExpandLess,
  Delete,
} from "@mui/icons-material"
import dayjs, { Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import relativeTime from "dayjs/plugin/relativeTime"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchExpenses,
  approveRejectExpense,
  setFilters,
  deleteExpense,
} from "../store/expenseSlice"
import {
  type Expense,
  type ExpenseCategory,
  type ExpenseStatus,
} from "../services/types"
import { type RootState, type AppDispatch } from "../store"

// Enable timezone plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

const ExpenseList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { expenses, loading, error, filters, paginated } = useSelector(
    (state: RootState) => state.expenses
  )
  const { user } = useSelector((state: RootState) => state.auth)

  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const [localFilters, setLocalFilters] = useState({
    category: "",
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    status: "",
  })

  const categories: ExpenseCategory[] = [
    "FOOD",
    "TRANSPORT",
    "ACCOMMODATION",
    "OFFICE_SUPPLIES",
    "SOFTWARE",
    "TRAINING",
    "MARKETING",
    "TRAVEL",
    "ENTERTAINMENT",
    "UTILITIES",
    "OTHER",
  ]

  const statuses: ExpenseStatus[] = ["PENDING", "APPROVED", "REJECTED"]

  const categoryLabels: Record<ExpenseCategory, string> = {
    FOOD: "Food",
    TRANSPORT: "Transport",
    ACCOMMODATION: "Accommodation",
    OFFICE_SUPPLIES: "Office Supplies",
    SOFTWARE: "Software",
    TRAINING: "Training",
    MARKETING: "Marketing",
    TRAVEL: "Travel",
    ENTERTAINMENT: "Entertainment",
    UTILITIES: "Utilities",
    OTHER: "Other",
  }

  useEffect(() => {
    dispatch(fetchExpenses(filters))
  }, [dispatch, filters])

  // Get pagination data from the paginated object
  const pagination = paginated?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  }

  // Convert from 1-based (API) to 0-based (MUI TablePagination)
  const currentPage = pagination.page - 1
  const rowsPerPage = pagination.limit

  const filteredExpenses = useMemo(() => {
    if (!searchTerm.trim()) return expenses

    const term = searchTerm.toLowerCase()
    return expenses.filter(
      (expense) =>
        expense.description?.toLowerCase().includes(term) ||
        categoryLabels[expense.category].toLowerCase().includes(term) ||
        expense.user.name.toLowerCase().includes(term) ||
        expense.amount.toString().includes(term)
    )
  }, [expenses, searchTerm])

  // For search functionality, if there's a search term, use client-side pagination
  // Otherwise, use server-side pagination
  const shouldUseClientPagination = searchTerm.trim() !== ""
  
  const displayedExpenses = useMemo(() => {
    if (shouldUseClientPagination) {
      const startIndex = currentPage * rowsPerPage
      return filteredExpenses.slice(startIndex, startIndex + rowsPerPage)
    }
    return filteredExpenses // Server-side pagination
  }, [filteredExpenses, currentPage, rowsPerPage, shouldUseClientPagination])

  const handleApplyFilters = () => {
    const newFilters: Record<string, unknown> = {
      ...filters,
      page: 1, // Reset to first page when applying filters
    }
    
    if (localFilters.category) newFilters.category = localFilters.category
    else delete newFilters.category
    
    if (localFilters.startDate)
      newFilters.dateFrom = localFilters.startDate.format("YYYY-MM-DD")
    else delete newFilters.dateFrom
    
    if (localFilters.endDate)
      newFilters.dateTo = localFilters.endDate.format("YYYY-MM-DD")
    else delete newFilters.dateTo
    
    if (localFilters.status) newFilters.status = localFilters.status
    else delete newFilters.status

    dispatch(setFilters(newFilters))
    setShowFilters(false)
  }

  const handleClearFilters = () => {
    setLocalFilters({
      category: "",
      startDate: null,
      endDate: null,
      status: "",
    })
    setSearchTerm("")
    dispatch(
      setFilters({
        status: undefined,
        category: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
        limit: 10,
      })
    )
  }

  const handleStatusUpdate = async (
    expenseId: string,
    status: ExpenseStatus,
    rejectionReason?: string
  ) => {
    try {
      await dispatch(
        approveRejectExpense({
          id: expenseId,
          data: { status, rejectionReason },
        })
      ).unwrap()
      // Refresh the list after update
      dispatch(fetchExpenses(filters))
    } catch (error) {
      console.error("Failed to update expense status:", error)
    }
  }

  const handleReject = (expense: Expense) => {
    setSelectedExpense(expense)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const handleConfirmReject = async () => {
    if (selectedExpense) {
      await handleStatusUpdate(
        selectedExpense.id,
        "REJECTED",
        rejectionReason.trim() || undefined
      )
      setShowRejectDialog(false)
      setSelectedExpense(null)
      setRejectionReason("")
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await dispatch(deleteExpense(expenseId)).unwrap()
        dispatch(fetchExpenses(filters))
      } catch (error) {
        console.error("Failed to delete expense:", error)
      }
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    if (shouldUseClientPagination) {
      // Client-side pagination - just update the local page
      // Note: We don't need to do anything here as MUI handles it
      return
    }
    
    // Server-side pagination - update filters
    const newFilters = {
      ...filters,
      page: newPage + 1, // Convert from 0-based to 1-based
    }
    dispatch(setFilters(newFilters))
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newLimit = parseInt(event.target.value, 10)
    
    if (shouldUseClientPagination) {
      // For client-side pagination, we can't change the server limit
      return
    }
    
    const newFilters = {
      ...filters,
      limit: newLimit,
      page: 1, // Reset to first page
    }
    dispatch(setFilters(newFilters))
  }

  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowDetailDialog(true)
  }

  const handleExportData = () => {
    const headers = [
      "Date",
      "Amount",
      "Category",
      "Description",
      "Employee",
      "Status",
      "Created At",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredExpenses.map((expense) =>
        [
          formatDate(expense.date),
          expense.amount,
          categoryLabels[expense.category],
          `"${expense.description?.replace(/"/g, '""') || ""}"`,
          expense.user.name,
          expense.status,
          formatDate(expense.createdAt),
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `expenses_${dayjs().format("YYYY-MM-DD")}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string): "success" | "error" | "warning" => {
    switch (status) {
      case "APPROVED":
        return "success"
      case "REJECTED":
        return "error"
      default:
        return "warning"
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Fixed date formatting to handle timezone properly
  const formatDate = (date: Date | string) => {
    // Parse the date and format in user's local timezone
    const parsedDate = dayjs(date)
    return parsedDate.format("MMM DD, YYYY")
  }

  // Fixed date formatting for expense date specifically
  const formatExpenseDate = (date: Date | string) => {
    // For expense dates, we want to show the actual date that was selected
    // without timezone conversion affecting the day
    const parsedDate = dayjs.utc(date)
    return parsedDate.format("MMM DD, YYYY")
  }

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  const getStatusCounts = () => {
    return filteredExpenses.reduce((counts, expense) => {
      counts[expense.status] = (counts[expense.status] || 0) + 1
      return counts
    }, {} as Record<string, number>)
  }

  const statusCounts = getStatusCounts()

  const LoadingSkeleton = () => (
    <>
      {[...Array(rowsPerPage)].map((_, index) => (
        <TableRow key={index}>
          {[...Array(user?.role === "ADMIN" ? 7 : 6)].map((_, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton variant="text" width="80%" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper elevation={1}>
        {/* Header Section */}
        <Box p={3}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                {user?.role === "ADMIN" ? "All Team Expenses" : "My Expenses"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {shouldUseClientPagination ? filteredExpenses.length : pagination.total} expenses • Total:{" "}
                {formatAmount(getTotalAmount())}
              </Typography>
            </Box>

            <Box display="flex" gap={1}>
              <Button
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? "contained" : "outlined"}
                size="small"
              >
                Filters{" "}
                {Object.values(filters).filter(
                  (v) => v !== undefined && v !== "" && v !== 1 && v !== 10
                ).length > 0 &&
                  `(${
                    Object.values(filters).filter(
                      (v) => v !== undefined && v !== "" && v !== 1 && v !== 10
                    ).length
                  })`}
              </Button>

              {user?.role === "ADMIN" && (
                <Button
                  startIcon={<GetApp />}
                  variant="outlined"
                  size="small"
                  onClick={handleExportData}
                  disabled={filteredExpenses.length === 0}
                >
                  Export
                </Button>
              )}
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Status Summary Cards */}
          <Stack direction="row" spacing={2} mb={2} sx={{ overflowX: "auto" }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <Card key={status} sx={{ minWidth: 120, flexShrink: 0 }}>
                <CardContent sx={{ py: 1, px: 2, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="textSecondary">
                    {status}
                  </Typography>
                  <Typography
                    variant="h6"
                    color={`${getStatusColor(status)}.main`}
                  >
                    {count}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search expenses by description, category, employee, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            size="small"
            sx={{ mb: 2 }}
          />

          {/* Advanced Filters */}
          <Collapse in={showFilters}>
            <Card sx={{ p: 2, bgcolor: "grey.50" }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="subtitle2">Advanced Filters</Typography>
                <IconButton size="small" onClick={() => setShowFilters(false)}>
                  <ExpandLess />
                </IconButton>
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={localFilters.category}
                    label="Category"
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <DatePicker
                  label="Start Date"
                  value={localFilters.startDate}
                  onChange={(date) =>
                    setLocalFilters((prev) => ({ ...prev, startDate: date }))
                  }
                  slotProps={{ textField: { size: "small" } }}
                />

                <DatePicker
                  label="End Date"
                  value={localFilters.endDate}
                  onChange={(date) =>
                    setLocalFilters((prev) => ({ ...prev, endDate: date }))
                  }
                  slotProps={{ textField: { size: "small" } }}
                />

                {user?.role === "ADMIN" && (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={localFilters.status}
                      label="Status"
                      onChange={(e) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      <MenuItem value="">All Status</MenuItem>
                      {statuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    size="small"
                  >
                    Apply
                  </Button>

                  <Button
                    startIcon={<ClearAll />}
                    onClick={handleClearFilters}
                    size="small"
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>
            </Card>
          </Collapse>
        </Box>

        {/* Table Section */}
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                {user?.role === "ADMIN" && <TableCell>Employee</TableCell>}
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <LoadingSkeleton />
              ) : displayedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={user?.role === "ADMIN" ? 7 : 6}
                    align="center"
                    sx={{ py: 8 }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        color="textSecondary"
                        gutterBottom
                      >
                        No expenses found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {searchTerm || Object.keys(filters).length > 2
                          ? "Try adjusting your search or filters"
                          : "Start by adding your first expense"}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayedExpenses.map((expense: Expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatExpenseDate(expense.date)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {dayjs(expense.createdAt).fromNow()}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatAmount(expense.amount)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={categoryLabels[expense.category]}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderRadius: 1,
                          fontWeight: "medium",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 250,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={expense.description || ""}
                      >
                        {expense.description || "No description"}
                      </Typography>
                    </TableCell>

                    {user?.role === "ADMIN" && (
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: 14,
                              bgcolor: "primary.main",
                            }}
                          >
                            {expense.user.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {expense.user.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {expense.user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    )}

                    <TableCell>
                      <Chip
                        label={expense.status}
                        color={getStatusColor(expense.status)}
                        size="small"
                        sx={{
                          fontWeight: "medium",
                          minWidth: 80,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(expense)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Admin Actions */}
                        {user?.role === "ADMIN" &&
                          expense.status === "PENDING" && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() =>
                                    handleStatusUpdate(expense.id, "APPROVED")
                                  }
                                >
                                  <Check fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReject(expense)}
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                        {/* Employee Actions - can only delete their own pending expenses */}
                        {user?.role === "EMPLOYEE" &&
                          expense.user.id === user.id &&
                          expense.status === "PENDING" && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={shouldUseClientPagination ? [] : [5, 10, 25, 50]}
          component="div"
          count={shouldUseClientPagination ? filteredExpenses.length : pagination.total}
          rowsPerPage={rowsPerPage}
          page={currentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </Paper>

      {/* Expense Detail Dialog */}
      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedExpense && (
          <>
            <DialogTitle>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h5">Expense Details</Typography>
                <Chip
                  label={selectedExpense.status}
                  color={getStatusColor(selectedExpense.status)}
                  size="small"
                />
              </Box>
            </DialogTitle>

            <DialogContent>
              <Stack spacing={3}>
                {/* Amount and Date */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Amount
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {formatAmount(selectedExpense.amount)}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="textSecondary">
                      Date
                    </Typography>
                    <Typography variant="h6">
                      {formatExpenseDate(selectedExpense.date)}
                    </Typography>
                  </Box>
                </Box>

                {/* Category */}
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Category
                  </Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={categoryLabels[selectedExpense.category]}
                      variant="outlined"
                      sx={{ fontWeight: "medium" }}
                    />
                  </Box>
                </Box>

                {/* Description */}
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {selectedExpense.description || "No description provided"}
                  </Typography>
                </Box>

                {/* Employee Info (Admin view) */}
                {user?.role === "ADMIN" && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Submitted by
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2} mt={1}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {selectedExpense.user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedExpense.user.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {selectedExpense.user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Rejection Reason */}
                {selectedExpense.status === "REJECTED" &&
                  selectedExpense.rejectionReason && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Rejection Reason
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.5 }}
                        color="error"
                      >
                        {selectedExpense.rejectionReason}
                      </Typography>
                    </Box>
                  )}

                {/* Timestamps */}
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Timeline
                  </Typography>
                  <Stack spacing={1} mt={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Created:</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {dayjs(selectedExpense.createdAt).format(
                          "MMM DD, YYYY HH:mm"
                        )}
                      </Typography>
                    </Box>
                    {selectedExpense.updatedAt && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Last updated:</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {dayjs(selectedExpense.updatedAt).format(
                            "MMM DD, YYYY HH:mm"
                          )}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
              {user?.role === "ADMIN" &&
                selectedExpense.status === "PENDING" && (
                  <>
                    <Button
                      color="error"
                      startIcon={<Close />}
                      onClick={() => {
                        handleReject(selectedExpense)
                        setShowDetailDialog(false)
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Check />}
                      onClick={() => {
                        handleStatusUpdate(selectedExpense.id, "APPROVED")
                        setShowDetailDialog(false)
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Expense</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please provide a reason for rejecting this expense:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason (optional)"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
          >
            Reject Expense
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default ExpenseList