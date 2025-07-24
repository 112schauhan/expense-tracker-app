import React from "react"
import { BarChart } from "@mui/x-charts/BarChart"
import { Paper, Typography, Box, useTheme } from "@mui/material"
import { BarChartOutlined } from "@mui/icons-material"
import dayjs from "dayjs"
import { type MonthlyAnalytics } from "../../services/types"

interface MonthlyChartProps {
  data: MonthlyAnalytics[]
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const theme = useTheme()

  const sortedData = data
    .sort((a, b) => dayjs(a.month).unix() - dayjs(b.month).unix())
    .slice(-6)

  const chartData = sortedData.map((item) => item.totalAmount)
  const labels = sortedData.map((item) => dayjs(item.month).format("MMM YYYY"))
  const counts = sortedData.map((item) => item.count)

  const maxValue = Math.max(...chartData)
  const avgValue = chartData.reduce((a, b) => a + b, 0) / chartData.length || 0

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
        <Typography variant="h6">Monthly Expense Trends</Typography>
      </Box>

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

      {/* Monthly Statistics */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Monthly Statistics:
        </Typography>

        <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Average Monthly:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            ${avgValue.toFixed(2)}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Highest Month:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            ${maxValue.toFixed(2)}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="textSecondary">
            Total Expenses:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {counts.reduce((a, b) => a + b, 0)}
          </Typography>
        </Box>
      </Box>

      {/* Trend Indicator */}
      {sortedData.length >= 2 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Trend:
          </Typography>
          {(() => {
            const lastMonth = sortedData[sortedData.length - 1].totalAmount
            const prevMonth = sortedData[sortedData.length - 2].totalAmount
            const change =
              prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0
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