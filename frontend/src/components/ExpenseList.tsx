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
} from "@mui/icons-material"
import dayjs, { Dayjs } from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useAppDispatch, useAppSelector } from "../store"
import {
  fetchExpenses,
  updateExpenseStatus,
  setFilters,
} from "../store/expenseSlice"
import { type Expense } from "../types"

dayjs.extend(relativeTime)

const ExpenseList: React.FC = () => {
  const dispatch = useAppDispatch()
  const { expenses, isLoading, filters } = useAppSelector(
    (state) => state.expenses
  )
  const { user } = useAppSelector((state) => state.auth)

  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const [localFilters, setLocalFilters] = useState({
    category: "",
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    status: "",
  })

  const categories = [
    "Travel",
    "Meals",
    "Office Supplies",
    "Software",
    "Training",
    "Marketing",
    "Equipment",
    "Transportation",
    "Communication",
    "Other",
  ]

  const statuses = ["PENDING", "APPROVED", "REJECTED"]

  useEffect(() => {
    dispatch(fetchExpenses(filters))
  }, [dispatch, filters])

  const filteredExpenses = useMemo(() => {
    if (!searchTerm.trim()) return expenses

    const term = searchTerm.toLowerCase()
    return expenses.filter(
      (expense) =>
        expense.description.toLowerCase().includes(term) ||
        expense.category.toLowerCase().includes(term) ||
        expense.user.name.toLowerCase().includes(term) ||
        expense.amount.toString().includes(term)
    )
  }, [expenses, searchTerm])

  const paginatedExpenses = useMemo(() => {
    const startIndex = page * rowsPerPage
    return filteredExpenses.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredExpenses, page, rowsPerPage])

  const handleApplyFilters = () => {
    const newFilters: Record<string, unknown> = {}
    if (localFilters.category) newFilters.category = localFilters.category
    if (localFilters.startDate)
      newFilters.startDate = localFilters.startDate.toDate()
    if (localFilters.endDate) newFilters.endDate = localFilters.endDate.toDate()
    if (localFilters.status) newFilters.status = localFilters.status

    dispatch(setFilters(newFilters))
    setPage(0)
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
    dispatch(setFilters({}))
    setPage(0)
  }

  const handleStatusUpdate = async (expenseId: string, status: string) => {
    try {
      await dispatch(updateExpenseStatus({ id: expenseId, status })).unwrap()
    } catch (error) {
      console.error("Failed to update expense status:", error)
    }
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
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
          expense.category,
          `"${expense.description.replace(/"/g, '""')}"`,
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

  const formatDate = (date: Date | string) => {
    return dayjs(date).format("MMM DD, YYYY")
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
          {[...Array(user?.role === "ADMIN" ? 7 : 5)].map((_, cellIndex) => (
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
                {filteredExpenses.length} expenses • Total:{" "}
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
                {Object.keys(filters).length > 0 &&
                  `(${Object.keys(filters).length})`}
              </Button>

              {user?.role === "ADMIN" && (
                <Button
                  startIcon={<GetApp />}
                  variant="outlined"
                  size="small"
                  onClick={handleExportData}
                >
                  Export
                </Button>
              )}
            </Box>
          </Box>

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
                <TextField
                  select
                  label="Category"
                  value={localFilters.category}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  size="small"
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>

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
                  <TextField
                    select
                    label="Status"
                    value={localFilters.status}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
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
              {isLoading ? (
                <LoadingSkeleton />
              ) : paginatedExpenses.length === 0 ? (
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
                        {searchTerm || Object.keys(filters).length > 0
                          ? "Try adjusting your search or filters"
                          : "Start by adding your first expense"}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExpenses.map((expense: Expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(expense.date)}
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
                        label={expense.category}
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
                        title={expense.description}
                      >
                        {expense.description}
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
                                  onClick={() =>
                                    handleStatusUpdate(expense.id, "REJECTED")
                                  }
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredExpenses.length}
          rowsPerPage={rowsPerPage}
          page={page}
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
                      {formatDate(selectedExpense.date)}
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
                      label={selectedExpense.category}
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
                    {selectedExpense.description}
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
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Last updated:</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {dayjs(selectedExpense.updatedAt).format(
                          "MMM DD, YYYY HH:mm"
                        )}
                      </Typography>
                    </Box>
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
                        handleStatusUpdate(selectedExpense.id, "REJECTED")
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
    </LocalizationProvider>
  )
}

export default ExpenseList
