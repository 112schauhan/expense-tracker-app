import React, { useState, useEffect } from "react"
import {
  Container,
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
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
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

          <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => fillDemoCredentials("employee")}
              disabled={isFormDisabled}
              fullWidth
              startIcon={<span>👤</span>}
            >
              Employee Demo
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => fillDemoCredentials("admin")}
              disabled={isFormDisabled}
              fullWidth
              startIcon={<span>👑</span>}
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
            Demo credentials: admin@expensetracker.com /
            john.doe@expensetracker.com
            <br />
            Password: password123
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage

// import React, { useState, useEffect } from "react"
// import {
//   Container,
//   Paper,
//   TextField,
//   Button,
//   Typography,
//   Box,
//   Alert,
//   CircularProgress,
//   Divider,
// } from "@mui/material"
// import { useAppDispatch, useAppSelector } from "../../store"
// import { login, clearError } from "../../store/authSlice"
// import { useNavigate } from "react-router-dom"

// const LoginPage: React.FC = () => {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const dispatch = useAppDispatch()
//   const navigate = useNavigate()
//   const { isLoading, error, user } = useAppSelector((state) => state.auth)

//   useEffect(() => {
//     if (user) {
//       navigate("/dashboard")
//     }
//   }, [user, navigate])

//   useEffect(() => {
//     return () => {
//       dispatch(clearError())
//     }
//   }, [dispatch])

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!email.trim() || !password.trim()) {
//       return
//     }

//     setIsSubmitting(true)

//     try {
//       const result = await await dispatch(login({ email, password })).unwrap()

//       if (login.fulfilled.match(result)) {
//         console.log("Login successful")
//       } else {
//         console.log("Login failed")
//       }
//     } catch (error) {
//       console.error("Login error:", error)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const fillDemoCredentials = (role: "employee" | "admin") => {
//     if (isLoading || isSubmitting) return

//     if (role === "employee") {
//       setEmail("employee@demo.com")
//       setPassword("password123")
//     } else {
//       setEmail("admin@demo.com")
//       setPassword("password123")
//     }

//     if (error) {
//       dispatch(clearError())
//     }
//   }

//   const isFormDisabled = isLoading || isSubmitting

//   return (
//     <Container maxWidth="sm">
//       <Box
//         display="flex"
//         flexDirection="column"
//         alignItems="center"
//         justifyContent="center"
//         minHeight="100vh"
//       >
//         <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
//           <Typography variant="h4" component="h1" gutterBottom align="center">
//             Expense Tracker
//           </Typography>
//           <Typography
//             variant="subtitle1"
//             gutterBottom
//             align="center"
//             color="textSecondary"
//           >
//             Sign in to manage your expenses
//           </Typography>

//           {error && (
//             <Alert severity="error" sx={{ mb: 2 }}>
//               {error}
//             </Alert>
//           )}

//           <Box
//             component="form"
//             onSubmit={handleSubmit}
//             sx={{ mt: 2 }}
//             noValidate
//           >
//             <TextField
//               fullWidth
//               label="Email Address"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               margin="normal"
//               required
//               disabled={isFormDisabled}
//               autoComplete="email"
//               autoFocus
//               variant="outlined"
//               error={!!error && error.includes("email")}
//             />
//             <TextField
//               fullWidth
//               label="Password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               margin="normal"
//               required
//               disabled={isFormDisabled}
//               autoComplete="current-password"
//               variant="outlined"
//               error={!!error && error.includes("password")}
//             />

//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               sx={{ mt: 3, mb: 2 }}
//               disabled={isFormDisabled || !email.trim() || !password.trim()}
//               size="large"
//             >
//               {isFormDisabled ? (
//                 <Box display="flex" alignItems="center" gap={1}>
//                   <CircularProgress size={20} color="inherit" />
//                   Signing In...
//                 </Box>
//               ) : (
//                 "Sign In"
//               )}
//             </Button>
//           </Box>

//           <Divider sx={{ my: 3 }}>
//             <Typography variant="body2" color="textSecondary">
//               Demo Accounts
//             </Typography>
//           </Divider>

//           <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
//             <Button
//               variant="outlined"
//               size="medium"
//               onClick={() => fillDemoCredentials("employee")}
//               disabled={isFormDisabled}
//               fullWidth
//               startIcon={<span>👤</span>}
//             >
//               Employee Demo
//             </Button>
//             <Button
//               variant="outlined"
//               size="medium"
//               onClick={() => fillDemoCredentials("admin")}
//               disabled={isFormDisabled}
//               fullWidth
//               startIcon={<span>👑</span>}
//             >
//               Admin Demo
//             </Button>
//           </Box>

//           <Typography
//             variant="caption"
//             display="block"
//             sx={{ mt: 2, textAlign: "center" }}
//             color="textSecondary"
//           >
//             Demo credentials: employee@demo.com / admin@demo.com
//             <br />
//             Password: password123
//           </Typography>
//         </Paper>
//       </Box>
//     </Container>
//   )
// }

// export default LoginPage
