import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_KEY = '@nutrition_coach_config';

// 默认配置
const defaultConfig = {
  textApiKey: '',
  textBaseUrl: 'https://api.minimax.chat/v1',
  textModel: 'MiniMax-M2.5',
  
  visionApiKey: '',
  visionBaseUrl: 'https://api.minimax.chat/v1',
  visionModel: 'minimax-vl',
};

// 获取配置
export const getConfig = async () => {
  try {
    const config = await AsyncStorage.getItem(CONFIG_KEY);
    return config ? { ...defaultConfig, ...JSON.parse(config) } : defaultConfig;
  } catch (error) {
    console.error('Error getting config:', error);
    return defaultConfig;
  }
};

// 保存配置
export const saveConfig = async (config) => {
  try {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
};

// 检查是否已配置（文字 API）
export const isConfigured = async () => {
  const config = await getConfig();
  return !!config.textApiKey && config.textApiKey !== 'sk-dummy-key';
};

// 检查是否已配置（图片 API）
export const isVisionConfigured = async () => {
  const config = await getConfig();
  return !!config.visionApiKey && config.visionApiKey !== 'sk-dummy-key';
};
