import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"
import routes from "./routes"
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(helmet())
app.use(morgan("combined"))
app.use(express.json({ limit: '10mb'}));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use('/api/health',(req,res)=>{
    return res.status(200).json({
        message:'Expense Tracker API is running'
    })
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});

export default app;


