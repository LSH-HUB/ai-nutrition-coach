# AI Nutrition Coach App - Specification Document

## 1. Project Overview

**Project Name:** AI Nutrition Coach
**Project Type:** Mobile Application (Android)
**Core Functionality:** An AI-powered nutrition and fitness assistant that helps users track food intake, monitor nutrition, visualize progress through charts, and receive personalized diet and workout recommendations.

## 2. Technology Stack & Choices

### Frontend
- **Framework:** React Native with Expo
- **Navigation:** @react-navigation/native with bottom tabs
- **Charts:** react-native-chart-kit
- **Image Picker:** expo-image-picker
- **HTTP Client:** axios
- **State Management:** React Context API

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite with better-sqlite3
- **AI Integration:** OpenAI-compatible API (supports vision and text)
- **File Upload:** multer
- **CORS:** cors middleware

### Architecture Pattern
- Clean separation: Frontend (Expo) ↔ REST API (Express) ↔ SQLite
- Modular folder structure

## 3. Feature List

### Core Features
1. **Home Screen** - Entry point with Calorie Food Logger and AI Personal Coach buttons
2. **Calorie Food Logger** - Log food via image upload or text description
3. **AI Food Analysis** - Vision LLM for images, text LLM for descriptions
4. **Daily Nutrition Summary** - View daily nutritional intake
5. **User Profile** - Input body metrics (age, gender, height, weight, bodyfat, BMR, goal_weight, goal_date)
6. **TDEE Calculation** - Calculate Total Daily Energy Expenditure
7. **Charts Dashboard** - Daily calorie intake, monthly trends, weight change
8. **AI Personal Coach** - Generate diet, workout, and supplement recommendations

### Database Tables
- users - User profile and body metrics
- food_records - Daily food entries
- nutrition_summary - Aggregated daily nutrition
- body_metrics - Historical body measurements
- ai_recommendations - AI-generated advice

### API Endpoints
- POST /analyze-food - Analyze food image or text
- POST /save-record - Save food record to database
- GET /daily-summary - Get daily nutrition summary
- GET /monthly-summary - Get monthly nutrition data
- GET /ai-coach - Get AI coach recommendations
- POST /user - Save/update user profile
- GET /user - Get user profile

## 4. UI/UX Design Direction

### Visual Style
- Modern, clean mobile UI with soft shadows
- Rounded corners on cards and buttons
- Consistent color scheme throughout

### Color Scheme
- Primary: #4CAF50 (Green - health/nutrition theme)
- Secondary: #FF9800 (Orange - energy/fitness)
- Background: #F5F5F5 (Light gray)
- Cards: #FFFFFF (White)
- Text Primary: #212121
- Text Secondary: #757575
- Success: #4CAF50
- Warning: #FF9800
- Error: #F44336

### Layout Approach
- Bottom tab navigation with 5 tabs:
  1. Home
  2. Food Logger
  3. Charts
  4. AI Coach
  5. Profile

### Screen Structure
1. **Home Screen** - Dashboard with quick stats and entry cards
2. **Food Logger Screen** - Image upload or text input for food logging
3. **Daily Nutrition Screen** - Today's food list with nutrition totals
4. **Charts Screen** - Three chart types (daily, monthly, weight)
5. **AI Coach Screen** - AI-generated recommendations with edit/regenerate
6. **Profile Screen** - User body data input form

## 5. Build Configuration

### APK Build Steps
1. Install dependencies: `npm install` in both backend and mobile_app
2. Start backend: `node server.js` in backend folder
3. Start Expo: `npx expo start` in mobile_app
4. Prebuild: `npx expo prebuild`
5. Build APK: `cd android && ./gradlew assembleRelease`
6. Copy APK to: `AI_Nutrition_Coach_App/build/android_apk/AI_Nutrition_Coach.apk`
