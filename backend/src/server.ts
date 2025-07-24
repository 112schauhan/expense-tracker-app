import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"
import routes from "./routes"
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(helmet())
app.use(morgan("combined"))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// app.use("/api", routes)

app.use("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

export default app
