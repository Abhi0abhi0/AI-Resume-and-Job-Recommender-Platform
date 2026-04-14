import express from "express";
import multer from "multer";
import protect from "../middlewares/authMiddleware.js";
import { enhanceJobDescription, enhanceProfessionalSummary, uploadResume, predictRole, checkATS, recommendSkills } from "../controllers/aiController.js";

const aiRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

aiRouter.post('/enhance-pro-sum', protect, enhanceProfessionalSummary)
aiRouter.post('/enhance-job-desc', protect, enhanceJobDescription)
aiRouter.post('/upload-resume', protect, upload.single('resume'), uploadResume)
aiRouter.post('/predict-role', protect, predictRole)
aiRouter.post('/check-ats', protect, upload.single('resume'), checkATS)
aiRouter.post('/recommend-skills', protect, recommendSkills)

export default aiRouter