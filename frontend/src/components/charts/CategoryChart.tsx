import React, { useMemo } from "react"
import { PieChart } from "@mui/x-charts/PieChart"
import {
  Paper,
  Typography,
  Box,
  useTheme,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
} from "@mui/material"
import {
  PieChartOutlined,
  TrendingUp,
  Category as CategoryIcon,
} from "@mui/icons-material"
import { type CategoryAnalytics } from "../../services/types"

interface CategoryChartProps {
  data: CategoryAnalytics[]
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const theme = useTheme()

  const categoryConfig = {
    FOOD: { color: "#FF6B6B", icon: "🍽️", label: "Food" },
    TRANSPORT: { color: "#4ECDC4", icon: "🚗", label: "Transport" },
    ACCOMMODATION: { color: "#45B7D1", icon: "🏨", label: "Accommodation" },
    OFFICE_SUPPLIES: { color: "#96CEB4", icon: "📎", label: "Office Supplies" },
    SOFTWARE: { color: "#FFEAA7", icon: "💻", label: "Software" },
    TRAINING: { color: "#DDA0DD", icon: "📚", label: "Training" },
    MARKETING: { color: "#98D8C8", icon: "📢", label: "Marketing" },
    TRAVEL: { color: "#F7DC6F", icon: "✈️", label: "Travel" },
    ENTERTAINMENT: { color: "#AED6F1", icon: "🎭", label: "Entertainment" },
    UTILITIES: { color: "#D5DBDB", icon: "⚡", label: "Utilities" },
    OTHER: { color: "#FFA07A", icon: "📋", label: "Other" },
  }

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      id: index,
      value: item.totalAmount,
      label: categoryConfig[item.category]?.label || item.category,
      count: item.count,
      color: categoryConfig[item.category]?.color || theme.palette.primary.main,
    }))
  }, [data, theme.palette.primary.main])

  const totals = useMemo(() => {
    const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalCount = data.reduce((sum, item) => sum + item.count, 0)
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0
    const largestCategory = data.reduce(
      (max, item) => (item.totalAmount > max.totalAmount ? item : max),
      data[0] || { category: "FOOD", totalAmount: 0, count: 0, percentage: 0 }
    )

    return { totalAmount, totalCount, averageAmount, largestCategory }
  }, [data])

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.totalAmount - a.totalAmount)
  }, [data])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
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
          <CategoryIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No expense data available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Start adding expenses to see category breakdown
          </Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <PieChartOutlined sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" fontWeight="600">
          Expenses by Category
        </Typography>
      </Box>

      {/* Use Box with flex and wrap for container similar to Grid container spacing={3} */}
      <Box display="flex" flexWrap="wrap" gap={3}>
        {/* Chart Section */}
        <Box
          sx={{
            flex: "1 1 100%",
            maxWidth: { xs: "100%", md: "50%" },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <PieChart
            series={[
              {
                data: chartData,
                highlightScope: { fade: "global", highlight: "item" },
                faded: {
                  innerRadius: 30,
                  additionalRadius: -30,
                  color: "gray",
                },
                innerRadius: 40,
                outerRadius: 120,
                paddingAngle: 2,
                cornerRadius: 5,
                startAngle: -90,
                endAngle: 270,
              },
            ]}
            height={300}
            width={300}
          />

          {/* Total Amount Display */}
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {formatCurrency(totals.totalAmount)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Expenses
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {totals.totalCount} expense{totals.totalCount !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>

        {/* Category Details Section */}
        <Box
          sx={{
            flex: "1 1 100%",
            maxWidth: { xs: "100%", md: "50%" },
          }}
        >
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Category Breakdown
          </Typography>

          <Stack spacing={2} sx={{ maxHeight: 280, overflowY: "auto" }}>
            {sortedData.map((item) => {
              const config = categoryConfig[item.category]

              return (
                <Card
                  key={item.category}
                  variant="outlined"
                  sx={{
                    borderLeft: `4px solid ${
                      config?.color || theme.palette.primary.main
                    }`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateX(4px)",
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" sx={{ fontSize: "1.2rem" }}>
                          {config?.icon || "📋"}
                        </Typography>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {config?.label || item.category}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.count} expense{item.count !== 1 ? "s" : ""}
                          </Typography>
                        </Box>
                      </Box>

                      <Box textAlign="right">
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="primary"
                        >
                          {formatCurrency(item.totalAmount)}
                        </Typography>
                        <Chip
                          label={`${item.percentage.toFixed(1)}%`}
                          size="small"
                          sx={{
                            backgroundColor:
                              config?.color || theme.palette.primary.main,
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        </Box>

        {/* Statistics Section */}
        <Box
          sx={{
            flex: "1 1 100%",
          }}
        >
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Quick Insights
          </Typography>

          {/* Use Box flex container for the 4 cards with spacing */}
          <Box
            display="flex"
            flexWrap="wrap"
            gap={2}
            justifyContent="space-between"
          >
            {/* Each card */}
            <Box
              sx={{
                flex: "1 1 100%",
                maxWidth: { xs: "100%", sm: "48%", md: "23%" },
              }}
            >
              <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Average per Expense
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatCurrency(totals.averageAmount)}
                </Typography>
              </Card>
            </Box>

            <Box
              sx={{
                flex: "1 1 100%",
                maxWidth: { xs: "100%", sm: "48%", md: "23%" },
              }}
            >
              <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Largest Category
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {categoryConfig[totals.largestCategory.category]?.label ||
                    totals.largestCategory.category}
                </Typography>
                <Typography variant="body2" color="primary">
                  {formatCurrency(totals.largestCategory.totalAmount)}
                </Typography>
              </Card>
            </Box>

            <Box
              sx={{
                flex: "1 1 100%",
                maxWidth: { xs: "100%", sm: "48%", md: "23%" },
              }}
            >
              <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Categories
                </Typography>
                <Typography variant="h5" color="info.main" fontWeight="bold">
                  {data.length}
                </Typography>
              </Card>
            </Box>

            <Box
              sx={{
                flex: "1 1 100%",
                maxWidth: { xs: "100%", sm: "48%", md: "23%" },
              }}
            >
              <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Total Count
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  {totals.totalCount}
                </Typography>
              </Card>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Trend Indicator */}
      {data.length > 0 && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "grey.50",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <TrendingUp sx={{ color: "success.main", fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight="600">
              Category Analysis
            </Typography>
          </Box>

          <Typography variant="body2" color="textSecondary">
            {categoryConfig[totals.largestCategory.category]?.label ||
              totals.largestCategory.category}{" "}
            represents the highest spending category with{" "}
            <strong>{totals.largestCategory.percentage.toFixed(1)}%</strong> of
            total expenses.
            {data.length > 1 && (
              <>
                {" "}
                The average expense amount across all categories is{" "}
                <strong>{formatCurrency(totals.averageAmount)}</strong>.
              </>
            )}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default CategoryChart