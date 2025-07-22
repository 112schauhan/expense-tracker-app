import React from "react"
import { Grid, Card, CardContent, Typography, Box, Avatar } from "@mui/material"
import {
  AttachMoney,
  HourglassEmpty,
  CheckCircle,
  Cancel,
  CalendarMonth,
} from "@mui/icons-material"

interface StatsCardsProps {
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
    monthlyTotal: number
    thisMonthCount: number
  }
  userRole: string
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, userRole }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const cardData = [
    {
      title: "Total Expenses",
      value: formatCurrency(stats.total),
      icon: AttachMoney,
      color: "primary.main",
      bgColor: "primary.light",
      subtitle: `${stats.approved + stats.pending + stats.rejected} total`,
    },
    {
      title: "This Month",
      value: formatCurrency(stats.monthlyTotal),
      icon: CalendarMonth,
      color: "info.main",
      bgColor: "info.light",
      subtitle: `${stats.thisMonthCount} expenses`,
    },
    {
      title: "Pending",
      value: stats.pending.toString(),
      icon: HourglassEmpty,
      color: "warning.main",
      bgColor: "warning.light",
      subtitle: "Awaiting approval",
    },
    {
      title: "Approved",
      value: stats.approved.toString(),
      icon: CheckCircle,
      color: "success.main",
      bgColor: "success.light",
      subtitle: "Ready for payment",
    },
  ]

  if (userRole === "ADMIN") {
    cardData.push({
      title: "Rejected",
      value: stats.rejected.toString(),
      icon: Cancel,
      color: "error.main",
      bgColor: "error.light",
      subtitle: "Requires revision",
    })
  }

  return (
    <Grid container spacing={2}>
      {cardData.map((card, index) => (
        <Box
          sx={{
            width: {
              xs: "100%",
              sm: "48%",
              md: userRole === "ADMIN" ? "19%" : "24%",
            },
            mb: 2,
            mr: { xs: 0, sm: 2 },
            display: "inline-block",
            verticalAlign: "top",
          }}
          key={index}
        >
          <Card
            sx={{
              height: "100%",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="body2"
                  >
                    {card.title}
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {card.subtitle}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: card.bgColor,
                    color: card.color,
                    width: 56,
                    height: 56,
                  }}
                >
                  <card.icon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Grid>
  )
}

export default StatsCards
