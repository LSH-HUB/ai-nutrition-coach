import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USERS: '@nutrition_users',
  FOOD_RECORDS: '@nutrition_food_records',
  NUTRITION_SUMMARY: '@nutrition_summary',
  BODY_METRICS: '@nutrition_body_metrics',
  AI_RECOMMENDATIONS: '@nutrition_ai_recommendations',
};

// 辅助函数
const getItem = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Error getting item:', e);
    return null;
  }
};

const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Error setting item:', e);
    return false;
  }
};

// 初始化数据库
export const initDatabase = async () => {
  try {
    // 初始化空数据
    const users = await getItem(STORAGE_KEYS.USERS);
    if (!users) await setItem(STORAGE_KEYS.USERS, []);
    
    const records = await getItem(STORAGE_KEYS.FOOD_RECORDS);
    if (!records) await setItem(STORAGE_KEYS.FOOD_RECORDS, []);
    
    const summary = await getItem(STORAGE_KEYS.NUTRITION_SUMMARY);
    if (!summary) await setItem(STORAGE_KEYS.NUTRITION_SUMMARY, {});
    
    const metrics = await getItem(STORAGE_KEYS.BODY_METRICS);
    if (!metrics) await setItem(STORAGE_KEYS.BODY_METRICS, []);
    
    const recs = await getItem(STORAGE_KEYS.AI_RECOMMENDATIONS);
    if (!recs) await setItem(STORAGE_KEYS.AI_RECOMMENDATIONS, []);
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
};

// 用户操作
export const userOps = {
  getUser: async () => {
    const users = await getItem(STORAGE_KEYS.USERS);
    return users && users.length > 0 ? users[users.length - 1] : null;
  },

  updateUser: async (user) => {
    const users = await getItem(STORAGE_KEYS.USERS) || [];
    const newUser = {
      ...user,
      id: users.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users.push(newUser);
    await setItem(STORAGE_KEYS.USERS, users);
    return newUser.id;
  }
};

// 食物记录操作
export const foodOps = {
  addRecord: async (record) => {
    const records = await getItem(STORAGE_KEYS.FOOD_RECORDS) || [];
    const summary = await getItem(STORAGE_KEYS.NUTRITION_SUMMARY) || {};
    
    const newRecord = {
      ...record,
      id: records.length + 1,
      created_at: new Date().toISOString(),
    };
    records.push(newRecord);
    
    // 更新每日汇总
    if (!summary[record.date]) {
      summary[record.date] = {
        date: record.date,
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
      };
    }
    summary[record.date].total_calories += record.calories;
    summary[record.date].total_protein += record.protein;
    summary[record.date].total_carbs += record.carbs;
    summary[record.date].total_fat += record.fat;
    
    await setItem(STORAGE_KEYS.FOOD_RECORDS, records);
    await setItem(STORAGE_KEYS.NUTRITION_SUMMARY, summary);
    
    return newRecord.id;
  },

  getDailyRecords: async (date) => {
    const records = await getItem(STORAGE_KEYS.FOOD_RECORDS) || [];
    return records
      .filter(r => r.date === date)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
};

// 营养汇总操作
export const summaryOps = {
  getDailySummary: async (date) => {
    const summary = await getItem(STORAGE_KEYS.NUTRITION_SUMMARY) || {};
    return summary[date] || null;
  },

  getMonthlySummary: async (year, month) => {
    const summary = await getItem(STORAGE_KEYS.NUTRITION_SUMMARY) || {};
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const result = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push(summary[dateStr] || {
        date: dateStr,
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
      });
    }
    
    return result;
  }
};

// 身体指标操作
export const metricsOps = {
  addMetric: async (metric) => {
    const metrics = await getItem(STORAGE_KEYS.BODY_METRICS) || [];
    const newMetric = {
      ...metric,
      id: metrics.length + 1,
      created_at: new Date().toISOString(),
    };
    metrics.push(newMetric);
    await setItem(STORAGE_KEYS.BODY_METRICS, metrics);
  },

  getMetrics: async (limit = 30) => {
    const metrics = await getItem(STORAGE_KEYS.BODY_METRICS) || [];
    return metrics
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }
};

// AI 建议操作
export const aiOps = {
  saveRecommendation: async (recommendation) => {
    const recs = await getItem(STORAGE_KEYS.AI_RECOMMENDATIONS) || [];
    const newRec = {
      ...recommendation,
      id: recs.length + 1,
      created_at: new Date().toISOString(),
    };
    recs.push(newRec);
    await setItem(STORAGE_KEYS.AI_RECOMMENDATIONS, recs);
  },

  getLatestRecommendation: async () => {
    const recs = await getItem(STORAGE_KEYS.AI_RECOMMENDATIONS) || [];
    if (recs.length === 0) return null;
    return recs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  },

  updateTodayRecommendation: async (recommendation, date) => {
    const recs = await getItem(STORAGE_KEYS.AI_RECOMMENDATIONS) || [];
    const index = recs.findIndex(r => r.date === date);
    if (index >= 0) {
      recs[index] = { ...recs[index], ...recommendation };
    } else {
      recs.push({
        ...recommendation,
        id: recs.length + 1,
        created_at: new Date().toISOString(),
      });
    }
    await setItem(STORAGE_KEYS.AI_RECOMMENDATIONS, recs);
  }
};
