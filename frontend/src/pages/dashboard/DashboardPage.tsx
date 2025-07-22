import React, { useEffect, useState } from "react"
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
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
} from "@mui/material"
import {
  Add,
  Logout,
  Dashboard as DashboardIcon,
  TrendingUp,
  NotificationsNone,
  Refresh,
} from "@mui/icons-material"
import { useAppDispatch, useAppSelector } from "../../store"
import { logout } from "../../store/authSlice"
import { fetchExpenses, fetchAnalytics } from "../../store/expenseSlice"
import ExpenseForm from "../../components/forms/ExpenseForm"
// import CategoryChart from '../../components/charts/CategoryChart';
// import MonthlyChart from '../../components/charts/MonthlyChart';
// import StatsCards from '../../components/charts/StatsCards';
import ExpenseList from "../../components/ExpenseList"
import StatsCards from "../../components/charts/StatsCards"
import CategoryChart from "../../components/charts/CategoryChart"
import MonthlyChart from "../../components/charts/MonthlyChart"

const DashboardPage: React.FC = () => {
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const dispatch = useAppDispatch()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const { user } = useAppSelector((state) => state.auth)
  const { expenses, analytics, isLoading } = useAppSelector(
    (state) => state.expenses
  )

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchExpenses({}))
    if (user?.role === "ADMIN") {
      dispatch(fetchAnalytics())
    }
  }, [dispatch, user?.role])

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
    dispatch(fetchExpenses({}))
    if (user?.role === "ADMIN") {
      dispatch(fetchAnalytics())
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
              {user?.name.charAt(0).toUpperCase()}
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

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
              disabled={isLoading}
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

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <StatsCards stats={stats} userRole={user?.role || "EMPLOYEE"} />
        </Grid>

        {/* Charts Section - Admin Only */}
        {user?.role === "ADMIN" && analytics && (
          <Grid container spacing={3} mb={4}>
            <Box width="100%" mb={2}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                <TrendingUp sx={{ mr: 1 }} />
                Analytics Overview
              </Typography>
            </Box>

            <Box
              sx={{
                width: { xs: "100%", lg: "50%" },
                mb: { xs: 3, lg: 0 },
                pr: { lg: 2 },
              }}
            >
              <CategoryChart data={analytics.categoryBreakdown} />
            </Box>

            <Box
              sx={{
                width: { xs: "100%", lg: "50%" },
                mb: { xs: 3, lg: 0 },
                pr: { lg: 2 },
              }}
            >
              <MonthlyChart data={analytics.monthlyTrends} />
            </Box>

            {/* Additional Analytics Cards */}
            <Grid width="100%" mb={2}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Insights
                </Typography>
                <Grid container spacing={2}>
                  <Box
                    sx={{
                      width: { xs: "100%", lg: "50%" },
                      mb: { xs: 3, lg: 0 },
                      pr: { lg: 2 },
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography color="textSecondary" gutterBottom>
                          Avg Expense
                        </Typography>
                        <Typography variant="h5">
                          $
                          {stats.total > 0
                            ? (stats.total / expenses.length).toFixed(2)
                            : "0.00"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  <Box
                    sx={{
                      width: { xs: "100%", lg: "50%" },
                      mb: { xs: 3, lg: 0 },
                      pr: { lg: 2 },
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography color="textSecondary" gutterBottom>
                          This Month
                        </Typography>
                        <Typography variant="h5">
                          {stats.thisMonthCount}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          expenses
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  <Box
                    sx={{
                      width: { xs: "100%", lg: "50%" },
                      mb: { xs: 3, lg: 0 },
                      pr: { lg: 2 },
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography color="textSecondary" gutterBottom>
                          Approval Rate
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          {expenses.length > 0
                            ? Math.round(
                                (stats.approved / expenses.length) * 100
                              )
                            : 0}
                          %
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  <Box
                    sx={{
                      width: { xs: "100%", lg: "50%" },
                      mb: { xs: 3, lg: 0 },
                      pr: { lg: 2 },
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography color="textSecondary" gutterBottom>
                          Monthly Spend
                        </Typography>
                        <Typography variant="h5">
                          ${stats.monthlyTotal.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Recent Expenses Section */}
        <Grid width="100%" mb={2}>
          <Typography variant="h5" gutterBottom>
            {user?.role === "ADMIN" ? "All Expenses" : "My Expenses"}
          </Typography>
          <ExpenseList />
        </Grid>

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
