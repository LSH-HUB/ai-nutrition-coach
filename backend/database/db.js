const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/nutrition.db');

let db = null;

// Initialize database
async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age INTEGER,
      gender TEXT,
      height REAL,
      weight REAL,
      bodyfat REAL,
      bmr REAL,
      goal_weight REAL,
      goal_date TEXT,
      tdee REAL,
      daily_calorie_target REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS food_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      weight REAL,
      image_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS nutrition_summary (
      date TEXT PRIMARY KEY,
      total_calories REAL DEFAULT 0,
      total_protein REAL DEFAULT 0,
      total_carbs REAL DEFAULT 0,
      total_fat REAL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS body_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      weight REAL,
      bodyfat REAL,
      bmr REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ai_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      diet_plan TEXT,
      workout_plan TEXT,
      supplement_plan TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
  console.log('Database initialized successfully');
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, buffer);
  }
}

// Helper to get results as array of objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
}

// User operations
const userOps = {
  getUser: () => {
    return queryOne('SELECT * FROM users ORDER BY id DESC LIMIT 1');
  },

  createUser: (user) => {
    run(`
      INSERT INTO users (age, gender, height, weight, bodyfat, bmr, goal_weight, goal_date, tdee, daily_calorie_target)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.age, user.gender, user.height, user.weight,
      user.bodyfat, user.bmr, user.goal_weight, user.goal_date,
      user.tdee, user.daily_calorie_target
    ]);
  },

  updateUser: (user) => {
    const existingUser = userOps.getUser();
    if (existingUser) {
      run(`
        UPDATE users SET
          age = ?, gender = ?, height = ?, weight = ?,
          bodyfat = ?, bmr = ?, goal_weight = ?, goal_date = ?,
          tdee = ?, daily_calorie_target = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        user.age, user.gender, user.height, user.weight,
        user.bodyfat, user.bmr, user.goal_weight, user.goal_date,
        user.tdee, user.daily_calorie_target, existingUser.id
      ]);
    } else {
      userOps.createUser(user);
    }
  }
};

// Food records operations
const foodOps = {
  addRecord: (record) => {
    run(`
      INSERT INTO food_records (date, food_name, calories, protein, carbs, fat, weight, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.date, record.food_name, record.calories,
      record.protein, record.carbs, record.fat, record.weight, record.image_path
    ]);

    // Update nutrition summary
    const existingSummary = queryOne('SELECT * FROM nutrition_summary WHERE date = ?', [record.date]);
    if (existingSummary) {
      run(`
        UPDATE nutrition_summary SET
          total_calories = total_calories + ?,
          total_protein = total_protein + ?,
          total_carbs = total_carbs + ?,
          total_fat = total_fat + ?
        WHERE date = ?
      `, [record.calories, record.protein, record.carbs, record.fat, record.date]);
    } else {
      run(`
        INSERT INTO nutrition_summary (date, total_calories, total_protein, total_carbs, total_fat)
        VALUES (?, ?, ?, ?, ?)
      `, [record.date, record.calories, record.protein, record.carbs, record.fat]);
    }
  },

  getDailyRecords: (date) => {
    return queryAll('SELECT * FROM food_records WHERE date = ? ORDER BY created_at DESC', [date]);
  },

  getDateRangeRecords: (startDate, endDate) => {
    return queryAll(`
      SELECT * FROM food_records
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `, [startDate, endDate]);
  }
};

// Nutrition summary operations
const summaryOps = {
  getDailySummary: (date) => {
    return queryOne('SELECT * FROM nutrition_summary WHERE date = ?', [date]);
  },

  getMonthlySummary: (year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    return queryAll(`
      SELECT * FROM nutrition_summary
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `, [startDate, endDate]);
  }
};

// Body metrics operations
const metricsOps = {
  addMetric: (metric) => {
    run(`
      INSERT INTO body_metrics (date, weight, bodyfat, bmr)
      VALUES (?, ?, ?, ?)
    `, [metric.date, metric.weight, metric.bodyfat, metric.bmr]);
  },

  getMetrics: (limit = 30) => {
    return queryAll('SELECT * FROM body_metrics ORDER BY date DESC LIMIT ?', [limit]);
  }
};

// AI recommendations operations
const aiOps = {
  saveRecommendation: (recommendation) => {
    run(`
      INSERT INTO ai_recommendations (date, diet_plan, workout_plan, supplement_plan)
      VALUES (?, ?, ?, ?)
    `, [recommendation.date, recommendation.diet_plan, recommendation.workout_plan, recommendation.supplement_plan]);
  },

  getLatestRecommendation: () => {
    return queryOne('SELECT * FROM ai_recommendations ORDER BY created_at DESC LIMIT 1');
  },

  updateTodayRecommendation: (recommendation, date) => {
    run(`
      UPDATE ai_recommendations SET
        diet_plan = ?,
        workout_plan = ?,
        supplement_plan = ?
      WHERE date = ?
    `, [recommendation.diet_plan, recommendation.workout_plan, recommendation.supplement_plan, date]);
  }
};

module.exports = {
  initializeDatabase,
  userOps,
  foodOps,
  summaryOps,
  metricsOps,
  aiOps
};
