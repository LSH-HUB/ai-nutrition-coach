const OpenAI = require('openai');
const axios = require('axios');

// Configure OpenAI client with OpenAI-compatible API
// You can change the base URL to use different LLM providers
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

// Analyze food from image using vision LLM
async function analyzeFoodImage(imageBase64) {
  const prompt = `You are a nutrition expert. Analyze this food image and provide nutritional information.

Respond ONLY with valid JSON in this exact format:
{
  "food_name": "name of the food",
  "estimated_weight": number in grams,
  "calories": number (kcal),
  "protein": number in grams,
  "carbs": number in grams,
  "fat": number in grams
}

Do not include any other text or explanation.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.VISION_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error analyzing food image:', error.message);
    // Return mock data if API fails
    return {
      food_name: 'Mixed Meal',
      estimated_weight: 200,
      calories: 350,
      protein: 20,
      carbs: 40,
      fat: 15
    };
  }
}

// Analyze food from text description
async function analyzeFoodText(foodDescription) {
  const prompt = `You are a nutrition expert. Analyze this food description and provide nutritional information.

Food: ${foodDescription}

Respond ONLY with valid JSON in this exact format:
{
  "food_name": "name of the food",
  "estimated_weight": number in grams,
  "calories": number (kcal),
  "protein": number in grams,
  "carbs": number in grams,
  "fat": number in grams
}

Do not include any other text or explanation.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.TEXT_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error analyzing food text:', error.message);
    // Return mock data if API fails
    return {
      food_name: foodDescription,
      estimated_weight: 150,
      calories: 250,
      protein: 15,
      carbs: 30,
      fat: 10
    };
  }
}

// Generate AI coach recommendations
async function generateCoachRecommendations(userData, nutritionData) {
  const prompt = `You are a professional fitness and nutrition coach. Generate personalized recommendations based on the user's profile and nutrition data.

User Profile:
- Age: ${userData.age || 'Not set'}
- Gender: ${userData.gender || 'Not set'}
- Height: ${userData.height || 'Not set'} cm
- Current Weight: ${userData.weight || 'Not set'} kg
- Body Fat: ${userData.bodyfat || 'Not set'}%
- BMR: ${userData.bmr || 'Not set'} kcal
- TDEE: ${userData.tdee || 'Not set'} kcal
- Goal Weight: ${userData.goal_weight || 'Not set'} kg
- Goal Date: ${userData.goal_date || 'Not set'}
- Daily Calorie Target: ${userData.daily_calorie_target || 'Not set'} kcal

Today's Nutrition:
- Calories Consumed: ${nutritionData.total_calories || 0} kcal
- Protein: ${nutritionData.total_protein || 0}g
- Carbs: ${nutritionData.total_carbs || 0}g
- Fat: ${nutritionData.total_fat || 0}g

Respond ONLY with valid JSON in this exact format:
{
  "diet_plan": "Your personalized diet recommendation (detailed meal suggestions)",
  "workout_plan": "Your personalized workout recommendation (exercises, sets, reps)",
  "supplement_plan": "Your supplement recommendations (vitamins, minerals, etc.)"
}

Do not include any other text or explanation.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.TEXT_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error generating coach recommendations:', error.message);
    // Return default recommendations if API fails
    return {
      diet_plan: "Focus on protein-rich foods, complex carbs, and healthy fats. Eat 5-6 small meals throughout the day.",
      workout_plan: "Combine strength training with cardio. Aim for 3-4 workouts per week including compound exercises.",
      supplement_plan: "Consider a multivitamin, protein powder, and omega-3 fatty acids. Stay hydrated with 8+ glasses of water daily."
    };
  }
}

module.exports = {
  analyzeFoodImage,
  analyzeFoodText,
  generateCoachRecommendations
};
