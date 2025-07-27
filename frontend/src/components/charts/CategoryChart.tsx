import React, { useMemo } from "react"
import { PieChart } from "@mui/x-charts/PieChart"
import {
  Paper,
  Typography,
  Box,
  useTheme,
  Card,
  CardContent,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material"
import {
  PieChartOutlined,
  TrendingUp,
  Category as CategoryIcon,
} from "@mui/icons-material"
import { type CategoryAnalytics } from "../../services/types"

interface CategoryChartProps {
  data: CategoryAnalytics[]
  loading?: boolean
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  loading = false,
}) => {
  const theme = useTheme()

  const categoryConfig = useMemo(
    () => ({
      FOOD: { color: "#FF6B6B", icon: "🍽️", label: "Food" },
      TRANSPORT: { color: "#4ECDC4", icon: "🚗", label: "Transport" },
      ACCOMMODATION: { color: "#45B7D1", icon: "🏨", label: "Accommodation" },
      OFFICE_SUPPLIES: {
        color: "#96CEB4",
        icon: "📎",
        label: "Office Supplies",
      },
      SOFTWARE: { color: "#FFEAA7", icon: "💻", label: "Software" },
      TRAINING: { color: "#DDA0DD", icon: "📚", label: "Training" },
      MARKETING: { color: "#98D8C8", icon: "📢", label: "Marketing" },
      TRAVEL: { color: "#F7DC6F", icon: "✈️", label: "Travel" },
      ENTERTAINMENT: { color: "#AED6F1", icon: "🎭", label: "Entertainment" },
      UTILITIES: { color: "#D5DBDB", icon: "⚡", label: "Utilities" },
      OTHER: { color: "#FFA07A", icon: "📋", label: "Other" },
    }),
    []
  )

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []

    console.log("🔍 CategoryChart - Raw data:", data)

    // Filter out categories with zero amounts and ensure proper data types
    const processed = data
      .filter((item) => {
        const amount = Number(item.totalAmount)
        const isValid = amount > 0 && !isNaN(amount)
        if (!isValid) {
          console.warn(`❌ Filtering out invalid category: ${item.category}`, {
            totalAmount: item.totalAmount,
            type: typeof item.totalAmount,
            converted: amount,
          })
        }
        return isValid
      })
      .map((item, index) => {
        const config =
          categoryConfig[item.category as keyof typeof categoryConfig]
        const amount = Number(item.totalAmount) || 0
        const count = Number(item.count) || 0
        const percentage = Number(item.percentage) || 0

        const processed = {
          id: index,
          value: amount,
          label: config?.label || item.category,
          category: item.category,
          count: count,
          percentage: percentage,
          color: config?.color || theme.palette.primary.main,
          icon: config?.icon || "📋",
        }

        console.log(`✅ Processed category ${item.category}:`, processed)
        return processed
      })
      .sort((a, b) => b.value - a.value) // Sort by amount descending

    // Calculate color intensities based on percentage
    const maxPercentage = Math.max(...processed.map((item) => item.percentage))
    const processedWithIntensity = processed.map((item) => {
      // Calculate opacity based on percentage (min 0.3, max 1.0)
      const intensityRatio =
        maxPercentage > 0 ? item.percentage / maxPercentage : 1
      const opacity = Math.max(0.3, Math.min(1.0, 0.4 + intensityRatio * 0.6))

      // Convert hex color to rgba with calculated opacity
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }

      return {
        ...item,
        colorWithOpacity: hexToRgba(item.color, opacity),
        colorIntensity: opacity,
      }
    })

    console.log(
      "📊 Final processed data with intensities:",
      processedWithIntensity
    )
    return processedWithIntensity
  }, [data, categoryConfig, theme.palette.primary.main])

  const totals = useMemo(() => {
    if (!processedData.length) {
      return {
        totalAmount: 0,
        totalCount: 0,
        averageAmount: 0,
        largestCategory: null,
        categoryCount: 0,
      }
    }

    const totalAmount = processedData.reduce((sum, item) => sum + item.value, 0)
    const totalCount = processedData.reduce((sum, item) => sum + item.count, 0)
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0
    const largestCategory = processedData[0]

    return {
      totalAmount,
      totalCount,
      averageAmount,
      largestCategory,
      categoryCount: processedData.length,
    }
  }, [processedData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

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
            Loading category data...
          </Typography>
        </Box>
      </Paper>
    )
  }

  if (!data || data.length === 0 || processedData.length === 0) {
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
                data: processedData,
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
            {processedData.map((item) => (
              <Card
                key={item.category}
                variant="outlined"
                sx={{
                  borderLeft: `4px solid ${item.color}`,
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  "&:hover": {
                    boxShadow: 3,
                    borderColor: "grey.300",
                    "& .category-icon": {
                      transform: "scale(1.1)",
                      backgroundColor: "white",
                      color: item.color,
                    },
                    "& .category-amount": {
                      color: "primary.dark",
                    },
                    "& .category-label": {
                      color: "white",
                    },
                    "& .category-details": {
                      color: "rgba(255, 255, 255, 0.8)",
                    },
                  },
                }}
                title={`${item.label}: ${formatCurrency(
                  item.value
                )} (${item.percentage.toFixed(1)}%) • ${item.count} expense${
                  item.count !== 1 ? "s" : ""
                }`}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(to right, ${item.colorWithOpacity} ${item.percentage}%, transparent ${item.percentage}%)`,
                    zIndex: 0,
                  }}
                />
                <CardContent sx={{ py: 2, px: 2, "&:last-child": { pb: 2 } }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          backgroundColor: item.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {item.label}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.count} expense{item.count !== 1 ? "s" : ""} •{" "}
                          {item.percentage.toFixed(1)}% of total
                        </Typography>
                      </Box>
                    </Box>

                    <Box textAlign="right">
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color="primary"
                        sx={{ fontSize: "1.1rem" }}
                      >
                        {formatCurrency(item.value)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Avg:{" "}
                        {formatCurrency(
                          item.count > 0 ? item.value / item.count : 0
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
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
                  Top Category
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {totals.largestCategory?.label}
                </Typography>
                <Typography variant="body2" color="primary">
                  {formatCurrency(totals.largestCategory?.value || 0)}
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
                  {totals.categoryCount}
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
      {totals.largestCategory && (
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
            <strong>{totals.largestCategory.label}</strong> represents your
            highest spending category with{" "}
            <strong>{totals.largestCategory.percentage.toFixed(1)}%</strong> of
            total expenses ({formatCurrency(totals.largestCategory.value)}).
            {totals.categoryCount > 1 && (
              <>
                {" "}
                Your expenses are spread across{" "}
                <strong>{totals.categoryCount} categories</strong> with an
                average of{" "}
                <strong>{formatCurrency(totals.averageAmount)}</strong> per
                expense.
              </>
            )}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default CategoryChart
