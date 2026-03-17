# AI Nutrition Coach App

A complete AI-powered nutrition and fitness assistant mobile application built with React Native (Expo), Node.js, and SQLite.

## Features

- **Home Dashboard** - Quick overview of daily nutrition progress
- **Calorie Food Logger** - Log food via image upload or text description using AI
- **AI Personal Coach** - Personalized diet, workout, and supplement recommendations
- **Charts** - Daily and monthly calorie trends, weight tracking
- **User Profile** - Body metrics input with automatic BMR/TDEE calculation
- **Daily Nutrition** - Detailed breakdown of daily food intake

## Tech Stack

- **Frontend:** React Native (Expo SDK 50)
- **Backend:** Node.js + Express
- **Database:** SQLite (sql.js)
- **Charts:** react-native-chart-kit
- **AI:** OpenAI-compatible API

## Project Structure

```
AI_Nutrition_Coach_App/
├── SPEC.md                  # Project specification
├── README.md                # This file
├── mobile_app/              # React Native Expo app
│   ├── App.js               # Main app component
│   ├── screens/             # All screen components
│   │   ├── HomeScreen.js
│   │   ├── FoodLoggerScreen.js
│   │   ├── ChartsScreen.js
│   │   ├── AICoachScreen.js
│   │   ├── ProfileScreen.js
│   │   └── DailyNutritionScreen.js
│   ├── services/            # API services
│   │   └── api.js
│   ├── android/             # Generated Android project
│   └── package.json
├── backend/                 # Express API server
│   ├── server.js            # Main server file
│   ├── routes/              # API routes
│   ├── database/            # SQLite database
│   │   └── db.js
│   ├── ai/                  # AI integration
│   │   └── openai.js
│   └── package.json
└── database/                # SQLite database file
    └── nutrition.db
```

## Installation & Setup

### Prerequisites

- Node.js 18+
- Java JDK 17+ (required for Android build)
- Android SDK (for building APK)

### 1. Install Backend Dependencies

```bash
cd AI_Nutrition_Coach_App/backend
npm install
```

### 2. Install Mobile App Dependencies

```bash
cd AI_Nutrition_Coach_App/mobile_app
npm install
```

### 3. Configure AI API

In `backend/ai/openai.js`, configure your OpenAI-compatible API:

```javascript
const openai = new OpenAI({
  apiKey: 'YOUR_API_KEY',  // Your API key
  baseURL: 'https://api.openai.com/v1'  // Or your custom endpoint
});
```

### 4. Start the Backend Server

```bash
cd AI_Nutrition_Coach_App/backend
node server.js
```

The backend runs on `http://localhost:3000`

### 5. Configure Mobile App API URL

In `mobile_app/services/api.js`, update the API base URL:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
// For Android emulator: 'http://10.0.2.2:3000/api'
// For physical device: Use your computer's IP address
```

### 6. Run the App (Development)

```bash
cd AI_Nutrition_Coach_App/mobile_app
npx expo start
```

## Building the Android APK

### Option 1: Using Expo

```bash
cd mobile_app
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Option 2: Manual Build

```bash
cd mobile_app
# Generate native Android project
npx expo prebuild --platform android

# Build release APK
cd android
# On Windows:
gradlew.bat assembleRelease
# On Mac/Linux:
./gradlew assembleRelease
```

### Copy APK to Build Folder

```bash
mkdir -p ../build/android_apk
cp android/app/build/outputs/apk/release/app-release.apk ../build/android_apk/AI_Nutrition_Coach.apk
```

## API Endpoints

- `POST /api/analyze-food` - Analyze food image or text
- `POST /api/save-record` - Save food record
- `GET /api/daily-summary` - Get daily nutrition summary
- `GET /api/monthly-summary` - Get monthly nutrition data
- `GET /api/ai-coach` - Get AI coach recommendations
- `POST /api/ai-coach/regenerate` - Regenerate AI recommendations
- `GET /api/user` - Get user profile
- `POST /api/user` - Save/update user profile
- `GET /api/body-metrics` - Get body metrics history
- `GET /api/health` - Health check endpoint

## Database Tables

- **users** - User profile and body metrics
- **food_records** - Daily food entries
- **nutrition_summary** - Aggregated daily nutrition
- **body_metrics** - Historical body measurements
- **ai_recommendations** - AI-generated advice

## Environment Variables

For the backend, you can set:

- `PORT` - Server port (default: 3000)
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_BASE_URL` - Custom API endpoint
- `VISION_MODEL` - Model for image analysis
- `TEXT_MODEL` - Model for text analysis

## Color Scheme

- Primary: #4CAF50 (Green)
- Secondary: #FF9800 (Orange)
- Background: #F5F5F5 (Light gray)
- Success: #4CAF50
- Warning: #FF9800
- Error: #F44336

## License

MIT License
