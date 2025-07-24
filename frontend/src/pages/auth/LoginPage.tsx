import React, { useState, useEffect } from "react"
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material"
import { useDispatch, useSelector } from "react-redux"
import { loginUser } from "../../store/authSlice"
import { useNavigate } from "react-router-dom"
import { type RootState, type AppDispatch } from "../../store"

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { user, loading, error } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (user) {
      navigate("/dashboard")
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      return
    }

    try {
      const result = await dispatch(loginUser({ email, password })).unwrap()
      if (result.success) {
        navigate("/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const fillDemoCredentials = (role: "employee" | "admin") => {
    if (loading) return

    if (role === "employee") {
      setEmail("john.doe@expensetracker.com")
      setPassword("password123")
    } else {
      setEmail("admin@expensetracker.com")
      setPassword("password123")
    }
  }

  const isFormDisabled = loading

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.50",
        padding: 2,
        width:'100vw'
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "500px",
          mx: "auto"
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Expense Tracker
          </Typography>
          <Typography
            variant="subtitle1"
            gutterBottom
            align="center"
            color="textSecondary"
          >
            Sign in to manage your expenses
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 2 }}
            noValidate
          >
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={isFormDisabled}
              autoComplete="email"
              autoFocus
              variant="outlined"
              error={!!error && error.toLowerCase().includes("email")}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={isFormDisabled}
              autoComplete="current-password"
              variant="outlined"
              error={!!error && error.toLowerCase().includes("password")}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isFormDisabled || !email.trim() || !password.trim()}
              size="large"
            >
              {isFormDisabled ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} color="inherit" />
                  Signing In...
                </Box>
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Demo Accounts
            </Typography>
          </Divider>

          <Box sx={{ display: "flex", gap: 1, flexDirection: "column", mt: 2 }}>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => fillDemoCredentials("employee")}
              disabled={isFormDisabled}
              fullWidth
              startIcon={<span style={{ fontSize: "16px" }}>👤</span>}
              sx={{ py: 1.5 }}
            >
              Employee Demo
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => fillDemoCredentials("admin")}
              disabled={isFormDisabled}
              fullWidth
              startIcon={<span style={{ fontSize: "16px" }}>👑</span>}
              sx={{ py: 1.5 }}
            >
              Admin Demo
            </Button>
          </Box>

          <Typography
            variant="caption"
            display="block"
            sx={{ mt: 2, textAlign: "center" }}
            color="textSecondary"
          >
            Demo credentials: admin@expensetracker.com / john.doe@expensetracker.com
            <br />
            Password: password123
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default LoginPage