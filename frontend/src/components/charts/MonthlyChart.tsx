import React from "react"
import { BarChart } from "@mui/x-charts/BarChart"
import { Paper, Typography, Box, useTheme, CircularProgress } from "@mui/material"
import { BarChartOutlined } from "@mui/icons-material"
import dayjs from "dayjs"
import { type MonthlyAnalytics } from "../../services/types"

interface MonthlyChartProps {
  data: MonthlyAnalytics[]
  loading?: boolean
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data, loading = false }) => {
  const theme = useTheme()

  // Format currency consistently
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Process and validate data with proper type conversion
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    
    // Filter out invalid data and convert types
    return data
      .filter(item => {
        const amount = Number(item.totalAmount)
        const count = Number(item.count)
        return !isNaN(amount) && !isNaN(count) && amount >= 0 && count >= 0
      })
      .map(item => ({
        month: item.month,
        count: Number(item.count) || 0,
        totalAmount: Number(item.totalAmount) || 0,
      }))
      .sort((a, b) => dayjs(a.month).unix() - dayjs(b.month).unix())
      .slice(-6) // Take last 6 months
  }, [data])

  const chartData = React.useMemo(() => {
    return processedData.map((item) => item.totalAmount)
  }, [processedData])

  const labels = React.useMemo(() => {
    return processedData.map((item) => dayjs(item.month).format("MMM YYYY"))
  }, [processedData])

  // const counts = React.useMemo(() => {
  //   return processedData.map((item) => item.count)
  // }, [processedData])

  const totals = React.useMemo(() => {
    const totalAmount = processedData.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalCount = processedData.reduce((sum, item) => sum + item.count, 0)
    const maxValue = chartData.length > 0 ? Math.max(...chartData) : 0
    const avgValue = chartData.length > 0 ? totalAmount / chartData.length : 0
    
    return {
      totalAmount,
      totalCount,
      maxValue,
      avgValue,
    }
  }, [processedData, chartData])

  if (loading) {
    return (
      <Paper
        sx={{
          p: 3,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Loading monthly data...
          </Typography>
        </Box>
      </Paper>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Paper
        sx={{
          p: 3,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box textAlign="center">
          <BarChartOutlined sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No monthly data available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Start adding expenses to see monthly trends
          </Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Box display="flex" alignItems="center" mb={2}>
        <BarChartOutlined sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" fontWeight="600">
          Monthly Expense Trends
        </Typography>
      </Box>

      {chartData.length > 0 && (
        <Box sx={{ position: "relative" }}>
          <BarChart
            xAxis={[
              {
                scaleType: "band",
                data: labels,
                tickLabelStyle: {
                  fontSize: 12,
                  fill: theme.palette.text.secondary,
                },
              },
            ]}
            series={[
              {
                data: chartData,
                label: "Monthly Expenses ($)",
                color: theme.palette.primary.main,
              },
            ]}
            width={500}
            height={300}
            margin={{
              left: 60,
              right: 20,
              top: 20,
              bottom: 60,
            }}
          />
        </Box>
      )}

      {/* Monthly Statistics */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom fontWeight="600">
          Monthly Statistics:
        </Typography>

        <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Average Monthly:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(totals.avgValue)}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Highest Month:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(totals.maxValue)}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Total Expenses:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(totals.totalAmount)}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="textSecondary">
            Expense Count:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {totals.totalCount}
          </Typography>
        </Box>
      </Box>

      {/* Trend Indicator */}
      {processedData.length >= 2 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Trend:
          </Typography>
          {(() => {
            const lastMonth = processedData[processedData.length - 1].totalAmount
            const prevMonth = processedData[processedData.length - 2].totalAmount
            const change = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0
            const isIncrease = change > 0

            return (
              <Typography
                variant="caption"
                color={isIncrease ? "error.main" : "success.main"}
                sx={{ ml: 1, fontWeight: "medium" }}
              >
                {isIncrease ? "↗" : "↘"} {Math.abs(change).toFixed(1)}%
                {isIncrease ? " increase" : " decrease"} from last month
              </Typography>
            )
          })()}
        </Box>
      )}
    </Paper>
  )
}

export default MonthlyChart