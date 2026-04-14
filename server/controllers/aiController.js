import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

// controller for enhancing a resume's professional summary
// POST: /api/ai/enhance-pro-sum
import axios from 'axios';

export const enhanceProfessionalSummary = async (req, res) => {
    try {
        const { userContent } = req.body;

        if (!userContent) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const flaskUrl = 'http://127.0.0.1:5001/enhance-summary';

        const response = await axios.post(flaskUrl, {
            text: userContent
        });

        // Flask API 'enhancedContent' key return kar rahi hai
        const enhancedContent = response.data.enhancedContent;

        return res.status(200).json({ enhancedContent });

    } catch (error) {
        console.error("Local AI Error:", error.message);

        // Agar Flask server band ho toh user ko message mile
        return res.status(500).json({
            message: "AI Enhancement service is currently unavailable. Please ensure the local ML server is running."
        });
    }
};
// controller for enhancing a resume's job description
// POST: /api/ai/enhance-job-desc
export const enhanceJobDescription = async (req, res) => {
    try {
        const { userContent } = req.body;

        if (!userContent) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Flask API ko call kar rahe hain jo hamara local model chala rahi hai
        const flaskUrl = 'http://127.0.0.1:5001/enhance-summary';

        const response = await axios.post(flaskUrl, {
            text: userContent
        });

        // Response wahi 'enhancedContent' key mein aayega
        const enhancedContent = response.data.enhancedContent;

        return res.status(200).json({ enhancedContent });

    } catch (error) {
        console.error("Local AI JD Error:", error.message);
        return res.status(500).json({
            message: "JD Enhancement failed. Make sure Flask server is active."
        });
    }
};
// controller for uploading a resume to the database
// POST: /api/ai/upload-resume
export const uploadResume = async (req, res) => {
    try {

        const { title } = req.body;
        const file = req.file;
        const userId = req.userId;

        console.log("----- UPLOAD RESUME HIT -----");
        console.log("Title:", title);
        console.log("File Name:", file ? file.originalname : "N/A");

        if (!file) {
            console.log("REJECTING 400: file is empty!");
            return res.status(400).json({ message: 'Missing required fields: no PDF uploaded.' })
        }

        let parsedData = {};
        let predicted_role = "";
        let predicted_roles = [];

        try {
            const pyResponse = await fetch('http://127.0.0.1:5001/parse-resume-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/pdf' },
                body: file.buffer
            });

            if (!pyResponse.ok) {
                throw new Error(`Python API returned ${pyResponse.status}`);
            }

            let pyData = {};
            try {
                pyData = await pyResponse.json();
            } catch (err) {
                console.warn("Python didn't return valid JSON. Falling back to empty resume format.", err);
                pyData = {
                    "professional_summary": "",
                    "skills": [],
                    "personal_info": {},
                    "experience": [],
                    "project": [],
                    "education": [],
                    "predicted_role": "",
                    "predicted_roles": []
                };
            }

            if (pyData && pyData.error) {
                console.error("Python Parser Error:", pyData.error);
                return res.status(400).json({ message: "Failed to parse resume via Python model" });
            }

            // The python model returns personal_info, experience, education, skills, predicted_role, and predicted_roles
            predicted_role = pyData?.predicted_role || "";
            predicted_roles = pyData?.predicted_roles || [];
            delete pyData.predicted_role;
            delete pyData.predicted_roles;

            parsedData = pyData;

        } catch (pyError) {
            console.error("Python Parser Fetch Failed:", pyError.message);
            return res.status(500).json({ message: "Python Parse API is unreachable. Is app.py running?" });
        }

        const newResume = await Resume.create({ userId, title, predicted_role, predicted_roles, ...parsedData })

        res.json({ resumeId: newResume._id })
    } catch (error) {
        console.error("Upload Resume Error:", error);
        return res.status(400).json({ message: error.message || "An error occurred during upload" })
    }
}

// controller for manual prediction
// POST: /api/ai/predict-role
export const predictRole = async (req, res) => {
    try {
        const { text, resumeId } = req.body;
        const userId = req.userId;

        if (!text) {
            return res.status(400).json({ message: 'Text is required' })
        }

        const mlResponse = await fetch('http://127.0.0.1:5001/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const mlData = await mlResponse.json();
        console.log(mlData)
        if (mlData.error) {
            return res.status(400).json({ message: mlData.error });
        }

        if (resumeId) {
            await Resume.findOneAndUpdate(
                { userId, _id: resumeId },
                { predicted_role: mlData.role, predicted_roles: mlData.roles || [] }
            );
        }

        return res.status(200).json(mlData);

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

// controller for skill recommendation
// POST: /api/ai/recommend-skills
export const recommendSkills = async (req, res) => {
    try {
        const { role, level } = req.body;

        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        const pyResponse = await fetch('http://127.0.0.1:5001/recommend-skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, level: level || '' })
        });

        if (!pyResponse.ok) {
            throw new Error(`Python API returned ${pyResponse.status}`);
        }

        const result = await pyResponse.json();

        if (result.error) {
            return res.status(400).json({ message: result.error });
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error("Skill Recommend Error:", error.message);
        return res.status(500).json({
            message: "Skill recommendation service is currently unavailable. Please ensure the local ML server is running."
        });
    }
}

// controller for ATS health check
// POST: /api/ai/check-ats
export const checkATS = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No PDF file uploaded.' });
        }

        const pyResponse = await fetch('http://127.0.0.1:5001/check-ats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/pdf' },
            body: file.buffer
        });

        const atsResult = await pyResponse.json();

        // Forward Flask's error responses (e.g. not_a_resume) directly to client
        if (!pyResponse.ok) {
            return res.status(pyResponse.status).json(atsResult);
        }

        return res.status(200).json(atsResult);

    } catch (error) {
        console.error("ATS Check Error:", error.message);
        return res.status(500).json({
            message: "ATS analysis service is currently unavailable. Please ensure the local ML server is running."
        });
    }
}
