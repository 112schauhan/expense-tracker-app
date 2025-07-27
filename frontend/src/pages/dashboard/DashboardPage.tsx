import React, { useEffect, useState } from "react"
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Fab,
  useTheme,
  useMediaQuery,
  Alert,
} from "@mui/material"
import {
  Add,
  Logout,
  Dashboard as DashboardIcon,
  TrendingUp,
  NotificationsNone,
  Refresh,
} from "@mui/icons-material"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "../../store/authSlice"
import { fetchExpenses } from "../../store/expenseSlice"
import { getExpenseAnalytics } from "../../services/analyticsService"
import ExpenseForm from "../../components/forms/ExpenseForm"
import ExpenseList from "../../components/ExpenseList"
import StatsCards from "../../components/charts/StatsCards"
import CategoryChart from "../../components/charts/CategoryChart"
import MonthlyChart from "../../components/charts/MonthlyChart"
import { type RootState, type AppDispatch } from "../../store"
import { type ExpenseAnalytics } from "../../services/types"

const DashboardPage: React.FC = () => {
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const dispatch = useDispatch<AppDispatch>()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const { user } = useSelector((state: RootState) => state.auth)
  const { expenses, loading, error } = useSelector((state: RootState) => state.expenses)

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchExpenses())
    if (user?.role === "ADMIN") {
      loadAnalytics()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user?.role])

  const loadAnalytics = async () => {
    if (user?.role !== "ADMIN") return
    
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const response = await getExpenseAnalytics()
      if (response.success) {
        setAnalytics(response.data)
      } else {
        setAnalyticsError("Failed to load analytics")
      }
    } catch (error) {
      setAnalyticsError("Failed to load analytics")
      console.error("Analytics error:", error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    setAnchorEl(null)
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleRefresh = () => {
    dispatch(fetchExpenses())
    if (user?.role === "ADMIN") {
      loadAnalytics()
    }
    setLastRefresh(new Date())
  }

  const calculateStats = () => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const thisMonth = expenses.filter((e) => {
      const expenseDate = new Date(e.date)
      const now = new Date()
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      )
    })

    const pending = expenses.filter((e) => e.status === "PENDING").length
    const approved = expenses.filter((e) => e.status === "APPROVED").length
    const rejected = expenses.filter((e) => e.status === "REJECTED").length
    const monthlyTotal = thisMonth.reduce(
      (sum, expense) => sum + expense.amount,
      0
    )

    return {
      total,
      pending,
      approved,
      rejected,
      monthlyTotal,
      thisMonthCount: thisMonth.length,
    }
  }

  const stats = calculateStats()

  return (
    <Box sx={{ flexGrow: 1, bgcolor: "grey.50", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Expense Tracker
          </Typography>

          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Welcome, {user?.name}
              </Typography>
              <Chip
                label={user?.role}
                size="small"
                color={user?.role === "ADMIN" ? "secondary" : "primary"}
              />
            </Box>
          )}

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <NotificationsNone />
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            aria-label="account of current user"
            aria-haspopup="true"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem>
              <Box>
                <Typography variant="subtitle2">{user?.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header Section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {user?.role === "ADMIN" ? "Admin Dashboard" : "My Dashboard"}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
          </Box>

          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowExpenseForm(true)}
                size="large"
              >
                Add Expense
              </Button>
            )}
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Box mb={4}>
          <StatsCards stats={stats} userRole={user?.role || "EMPLOYEE"} />
        </Box>

        {/* Analytics Section - Admin Only */}
        {user?.role === "ADMIN" && (
          <Box mb={4}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", mb: 3 }}
            >
              <TrendingUp sx={{ mr: 1 }} />
              Analytics Overview
            </Typography>

            {analyticsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {analyticsError}
              </Alert>
            )}

            <Box 
              sx={{ 
                display: "flex", 
                flexDirection: { xs: "column", lg: "row" },
                gap: 3,
                minHeight: "500px"
              }}
            >
              {/* Category Breakdown */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {analyticsLoading ? (
                  <Paper sx={{ p: 3, height: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Typography>Loading analytics...</Typography>
                  </Paper>
                ) : analytics?.expensesByCategory ? (
                  <CategoryChart data={analytics.expensesByCategory} />
                ) : (
                  <Paper sx={{ p: 3, height: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Typography color="textSecondary">No category data available</Typography>
                  </Paper>
                )}
              </Box>

              {/* Monthly Trends */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {analyticsLoading ? (
                  <Paper sx={{ p: 3, height: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Typography>Loading analytics...</Typography>
                  </Paper>
                ) : analytics?.expensesByMonth ? (
                  <MonthlyChart data={analytics.expensesByMonth} />
                ) : (
                  <Paper sx={{ p: 3, height: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Typography color="textSecondary">No monthly data available</Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* Recent Expenses Section */}
        <Box mb={2}>
          <Typography variant="h5" gutterBottom>
            {user?.role === "ADMIN" ? "All Expenses" : "My Expenses"}
          </Typography>
          <ExpenseList />
        </Box>

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add expense"
            onClick={() => setShowExpenseForm(true)}
            sx={{
              position: "fixed",
              bottom: 16,
              right: 16,
            }}
          >
            <Add />
          </Fab>
        )}

        {/* Expense Form Modal */}
        <ExpenseForm
          open={showExpenseForm}
          onClose={() => setShowExpenseForm(false)}
        />
      </Container>
    </Box>
  )
}

export default DashboardPage