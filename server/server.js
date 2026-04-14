import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import morgan from 'morgan'
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
await connectDB()
app.use(morgan('dev')) // Fixed morgan usage
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }))
console.log("heloo")
app.get('/', (req, res) => res.send("Server is live..."))
app.use('/api/users', userRouter)
app.use('/api/resumes', resumeRouter)
app.use('/api/ai', aiRouter)

// Global Error Handler to catch Express/BodyParser errors (like 400 Bad Request Payload Limit)
app.use((err, req, res, next) => {
    console.error("🚨 GLOBAL EXPRESS ERROR CAUGHT 🚨:", err.stack || err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        error: err.toString()
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});