import React, { useMemo } from "react"
import { PieChart } from "@mui/x-charts/PieChart"
import {
  Paper,
  Typography,
  Box,
  useTheme,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Divider,
} from "@mui/material"
import {
  PieChartOutlined,
  TrendingUp,
  Category as CategoryIcon,
} from "@mui/icons-material"

interface CategoryData {
  category: string
  _sum: { amount: number }
  _count: { id: number }
}

interface CategoryChartProps {
  data: CategoryData[]
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const theme = useTheme()

  const categoryConfig = {
    Travel: { color: "#FF6B6B", icon: "✈️" },
    Meals: { color: "#4ECDC4", icon: "🍽️" },
    "Office Supplies": { color: "#45B7D1", icon: "📎" },
    Software: { color: "#96CEB4", icon: "💻" },
    Training: { color: "#FFEAA7", icon: "📚" },
    Marketing: { color: "#DDA0DD", icon: "📢" },
    Equipment: { color: "#98D8C8", icon: "🔧" },
    Transportation: { color: "#F7DC6F", icon: "🚗" },
    Communication: { color: "#AED6F1", icon: "📞" },
    Other: { color: "#D5DBDB", icon: "📋" },
  }

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      id: index,
      value: parseFloat(item._sum.amount.toString()),
      label: item.category,
      count: item._count.id,
      color:
        categoryConfig[item.category as keyof typeof categoryConfig]?.color ||
        theme.palette.primary.main,
    }))
  }, [data, theme.palette.primary.main])

  const totals = useMemo(() => {
    const totalAmount = data.reduce(
      (sum, item) => sum + parseFloat(item._sum.amount.toString()),
      0
    )
    const totalCount = data.reduce((sum, item) => sum + item._count.id, 0)
    const averageAmount = totalAmount / totalCount
    const largestCategory = data.reduce(
      (max, item) =>
        parseFloat(item._sum.amount.toString()) >
        parseFloat(max._sum.amount.toString())
          ? item
          : max,
      data[0] || { category: "", _sum: { amount: 0 }, _count: { id: 0 } }
    )

    return { totalAmount, totalCount, averageAmount, largestCategory }
  }, [data])

  const sortedData = useMemo(() => {
    return [...data].sort(
      (a, b) =>
        parseFloat(b._sum.amount.toString()) -
        parseFloat(a._sum.amount.toString())
    )
  }, [data])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getPercentage = (amount: number) => {
    if (totals.totalAmount === 0) return 0
    return (amount / totals.totalAmount) * 100
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

      <Grid container spacing={3}>
        {/* Chart Section */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            pr: { md: 3 },
            mb: { xs: 3, md: 0 },
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
            slotProps={{
              legend: { direction: "vertical" },
            }}
          />

          {/* Total Amount Display */}
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {formatCurrency(totals.totalAmount)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Approved Expenses
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {totals.totalCount} expense{totals.totalCount !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>

        {/* Category Details Section */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            pl: { md: 3 },
            mb: { xs: 3, md: 0 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Category Breakdown
          </Typography>

          <Stack spacing={2} sx={{ maxHeight: 280, overflowY: "auto" }}>
            {sortedData.map((item) => {
              const amount = parseFloat(item._sum.amount.toString())
              const percentage = getPercentage(amount)
              const config =
                categoryConfig[item.category as keyof typeof categoryConfig]

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
                            {item.category}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item._count.id} expense
                            {item._count.id !== 1 ? "s" : ""}
                          </Typography>
                        </Box>
                      </Box>

                      <Box textAlign="right">
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="primary"
                        >
                          {formatCurrency(amount)}
                        </Typography>
                        <Chip
                          label={`${percentage.toFixed(1)}%`}
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
        <Box mt={2}>
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Quick Insights
          </Typography>

          <Box
            display="flex"
            flexWrap="wrap"
            gap={2}
            justifyContent="space-between"
          >
            <Box flex="1 1 200px" minWidth={200} maxWidth={300}>
              <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Average per Expense
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatCurrency(totals.averageAmount)}
                </Typography>
              </Card>
            </Box>

            <Box flex="1 1 200px" minWidth={200} maxWidth={300}>
              <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Largest Category
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {totals.largestCategory.category}
                </Typography>
                <Typography variant="body2" color="primary">
                  {formatCurrency(
                    parseFloat(totals.largestCategory._sum.amount.toString())
                  )}
                </Typography>
              </Card>
            </Box>

            <Box flex="1 1 200px" minWidth={200} maxWidth={300}>
              <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Categories
                </Typography>
                <Typography variant="h5" color="info.main" fontWeight="bold">
                  {data.length}
                </Typography>
              </Card>
            </Box>

            <Box flex="1 1 200px" minWidth={200} maxWidth={300}>
              <Card variant="outlined" sx={{ textAlign: "center", p: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Approval Rate
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  100%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  (Approved only)
                </Typography>
              </Card>
            </Box>
          </Box>
        </Box>
      </Grid>

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
            {totals.largestCategory.category} represents the highest spending
            category with{" "}
            <strong>
              {getPercentage(
                parseFloat(totals.largestCategory._sum.amount.toString())
              ).toFixed(1)}
              %
            </strong>{" "}
            of total expenses.
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
