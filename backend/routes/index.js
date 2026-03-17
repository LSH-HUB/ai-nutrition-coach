const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { userOps, foodOps, summaryOps, metricsOps, aiOps } = require('../database/db');
const { analyzeFoodImage, analyzeFoodText, generateCoachRecommendations } = require('../ai/openai');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../mobile_app/assets/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'food-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// POST /analyze-food - Analyze food image or text
router.post('/analyze-food', upload.single('image'), async (req, res) => {
  try {
    let result;

    if (req.file) {
      // Image upload - read and encode image
      const imagePath = req.file.path;
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');
      result = await analyzeFoodImage(imageBase64);
      result.image_path = `/assets/uploads/${req.file.filename}`;
    } else if (req.body.text) {
      // Text description
      result = await analyzeFoodText(req.body.text);
    } else {
      return res.status(400).json({ error: 'Please provide either an image or text description' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in /analyze-food:', error);
    res.status(500).json({ error: 'Failed to analyze food' });
  }
});

// POST /save-record - Save food record
router.post('/save-record', async (req, res) => {
  try {
    const { date, food_name, calories, protein, carbs, fat, weight, image_path } = req.body;

    if (!date || !food_name || !calories) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const recordId = foodOps.addRecord({
      date,
      food_name,
      calories: parseFloat(calories),
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      weight: parseFloat(weight) || 0,
      image_path: image_path || null
    });

    res.json({ success: true, id: recordId });
  } catch (error) {
    console.error('Error in /save-record:', error);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

// GET /daily-summary - Get daily nutrition summary
router.get('/daily-summary', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const summary = summaryOps.getDailySummary(date);
    const records = foodOps.getDailyRecords(date);

    res.json({
      date,
      summary: summary || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 },
      records: records || []
    });
  } catch (error) {
    console.error('Error in /daily-summary:', error);
    res.status(500).json({ error: 'Failed to get daily summary' });
  }
});

// GET /monthly-summary - Get monthly nutrition data
router.get('/monthly-summary', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const data = summaryOps.getMonthlySummary(year, month);

    // Fill in missing dates with zeros
    const daysInMonth = new Date(year, month, 0).getDate();
    const filledData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const existing = data.find(d => d.date === dateStr);
      filledData.push(existing || {
        date: dateStr,
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0
      });
    }

    res.json({ year, month, data: filledData });
  } catch (error) {
    console.error('Error in /monthly-summary:', error);
    res.status(500).json({ error: 'Failed to get monthly summary' });
  }
});

// GET /ai-coach - Get AI coach recommendations
router.get('/ai-coach', async (req, res) => {
  try {
    const user = userOps.getUser();
    const today = new Date().toISOString().split('T')[0];
    const summary = summaryOps.getDailySummary(today);

    const nutritionData = summary || {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0
    };

    // Check if we have recent recommendations
    const latestRecommendation = aiOps.getLatestRecommendation();
    let recommendations;

    if (latestRecommendation && latestRecommendation.date === today) {
      // Return cached recommendations
      recommendations = {
        diet_plan: latestRecommendation.diet_plan,
        workout_plan: latestRecommendation.workout_plan,
        supplement_plan: latestRecommendation.supplement_plan,
        cached: true
      };
    } else {
      // Generate new recommendations
      recommendations = await generateCoachRecommendations(user || {}, nutritionData);

      // Save to database
      aiOps.saveRecommendation({
        date: today,
        diet_plan: recommendations.diet_plan,
        workout_plan: recommendations.workout_plan,
        supplement_plan: recommendations.supplement_plan
      });
    }

    res.json({
      user: user || null,
      todayNutrition: nutritionData,
      recommendations
    });
  } catch (error) {
    console.error('Error in /ai-coach:', error);
    res.status(500).json({ error: 'Failed to get AI coach recommendations' });
  }
});

// POST /ai-coach/regenerate - Regenerate AI recommendations
router.post('/ai-coach/regenerate', async (req, res) => {
  try {
    const user = userOps.getUser();
    const today = new Date().toISOString().split('T')[0];
    const summary = summaryOps.getDailySummary(today);

    const nutritionData = summary || {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0
    };

    // Always generate new recommendations
    const recommendations = await generateCoachRecommendations(user || {}, nutritionData);

    // Save to database (overwrite today's recommendation)
    const existingToday = aiOps.getLatestRecommendation();
    if (existingToday && existingToday.date === today) {
      // Update existing
      aiOps.updateTodayRecommendation({
        diet_plan: recommendations.diet_plan,
        workout_plan: recommendations.workout_plan,
        supplement_plan: recommendations.supplement_plan
      }, today);
    } else {
      // Insert new
      aiOps.saveRecommendation({
        date: today,
        diet_plan: recommendations.diet_plan,
        workout_plan: recommendations.workout_plan,
        supplement_plan: recommendations.supplement_plan
      });
    }

    res.json({
      user: user || null,
      todayNutrition: nutritionData,
      recommendations
    });
  } catch (error) {
    console.error('Error in /ai-coach/regenerate:', error);
    res.status(500).json({ error: 'Failed to regenerate AI recommendations' });
  }
});

// GET /user - Get user profile
router.get('/user', async (req, res) => {
  try {
    const user = userOps.getUser();
    res.json(user || null);
  } catch (error) {
    console.error('Error in /user GET:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /user - Save/update user profile
router.post('/user', async (req, res) => {
  try {
    const { age, gender, height, weight, bodyfat, bmr, goal_weight, goal_date, tdee, daily_calorie_target } = req.body;

    if (!age || !gender || !height || !weight) {
      return res.status(400).json({ error: 'Please fill in required fields (age, gender, height, weight)' });
    }

    // Calculate TDEE if not provided
    let calculatedTdee = tdee;
    if (!calculatedTdee) {
      // Mifflin-St Jeor Equation
      if (gender.toLowerCase() === 'male') {
        calculatedTdee = (10 * weight) + (6.25 * height) - (5 * age) + 5;
      } else {
        calculatedTdee = (10 * weight) + (6.25 * height) - (5 * age) - 161;
      }
      // Assume sedentary activity level (1.2)
      calculatedTdee = calculatedTdee * 1.2;
    }

    // Calculate daily calorie target based on goal
    let calorieTarget = daily_calorie_target;
    if (!calorieTarget && goal_weight && weight) {
      const weightDiff = goal_weight - weight;
      if (weightDiff < 0) {
        // Weight loss goal - reduce calories
        calorieTarget = calculatedTdee - 500;
      } else if (weightDiff > 0) {
        // Weight gain goal - increase calories
        calorieTarget = calculatedTdee + 500;
      } else {
        calorieTarget = calculatedTdee;
      }
    }
    calorieTarget = calorieTarget || calculatedTdee;

    // Calculate BMR if not provided
    let calculatedBmr = bmr;
    if (!calculatedBmr) {
      if (gender.toLowerCase() === 'male') {
        calculatedBmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
      } else {
        calculatedBmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
      }
    }

    const userId = userOps.updateUser({
      age: parseInt(age),
      gender,
      height: parseFloat(height),
      weight: parseFloat(weight),
      bodyfat: parseFloat(bodyfat) || null,
      bmr: calculatedBmr,
      goal_weight: parseFloat(goal_weight) || null,
      goal_date: goal_date || null,
      tdee: calculatedTdee,
      daily_calorie_target: calorieTarget
    });

    // Also add to body metrics
    metricsOps.addMetric({
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(weight),
      bodyfat: parseFloat(bodyfat) || null,
      bmr: calculatedBmr
    });

    res.json({ success: true, id: userId });
  } catch (error) {
    console.error('Error in /user POST:', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// GET /body-metrics - Get body metrics history
router.get('/body-metrics', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const metrics = metricsOps.getMetrics(limit);
    res.json(metrics);
  } catch (error) {
    console.error('Error in /body-metrics:', error);
    res.status(500).json({ error: 'Failed to get body metrics' });
  }
});

module.exports = router;
