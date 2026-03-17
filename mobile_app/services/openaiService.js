import { getConfig } from './configService';

// 分析食物图片
export const analyzeFoodImage = async (imageBase64) => {
  const config = await getConfig();
  
  const apiKey = config.visionApiKey || config.textApiKey;
  // 移除末尾的所有路径，只保留 https://api.minimax.chat/v1
  let baseUrl = (config.visionBaseUrl || config.textBaseUrl || 'https://api.minimax.chat/v1')
    .replace(/\/v1\/.*$/, '/v1');
  const model = config.visionModel || 'minimax-vl';
  
  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

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
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    let responseText = await response.text();
    console.log('Image API Response:', responseText);

    // 清理响应文本，移除 BOM 和其他不可见字符
    responseText = responseText.replace(/^\uFEFF/, '').trim();

    // 检查是否返回的是纯文本错误信息
    if (!response.ok) {
      // 尝试解析JSON错误
      try {
        const error = JSON.parse(responseText);
        throw new Error(error.error?.message || 'API 请求失败: ' + responseText.substring(0, 100));
      } catch (e) {
        // 如果不是JSON，返回原始错误信息
        throw new Error('API Error (' + response.status + '): ' + responseText.substring(0, 200));
      }
    }

    // 尝试解析JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response: ' + responseText.substring(0, 200));
    }
    
    const content = data.choices[0].message.content;

    // 清理响应内容，移除 BOM 和 markdown 代码块
    let cleanContent = content
      .replace(/^\uFEFF/, '')  // 移除 BOM
      .replace(/^```json\s*/, '')  // 移除 ```json
      .replace(/^```\s*/, '')  // 移除 ```
      .replace(/\s*```$/, '')  // 移除末尾 ```
      .trim();

    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('无法解析 AI 响应: ' + cleanContent.substring(0, 100));
  } catch (error) {
    console.error('Error analyzing food image:', error);
    throw error;
  }
};

// 分析食物文本描述
export const analyzeFoodText = async (foodDescription) => {
  const config = await getConfig();
  
  const apiKey = config.textApiKey;
  let baseUrl = (config.textBaseUrl || 'https://api.minimax.chat/v1')
    .replace(/\/v1\/.*$/, '/v1');
  const model = config.textModel || 'abab6.5s-chat';
  
  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

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
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
    });

    let responseText = await response.text();
    console.log('Text API Response:', responseText);

    // 清理响应文本
    responseText = responseText.replace(/^\uFEFF/, '').trim();

    if (!response.ok) {
      try {
        const error = JSON.parse(responseText);
        throw new Error(error.error?.message || 'API 请求失败');
      } catch (e) {
        throw new Error('API Error (' + response.status + '): ' + responseText.substring(0, 200));
      }
    }

    const data = JSON.parse(responseText);
    const content = data.choices[0].message.content;

    // 清理响应内容
    let cleanContent = content
      .replace(/^\uFEFF/, '')
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('无法解析 AI 响应: ' + cleanContent.substring(0, 100));
  } catch (error) {
    console.error('Error analyzing food text:', error);
    throw error;
  }
};

// 生成 AI 教练建议
export const generateCoachRecommendations = async (userData, nutritionData) => {
  const config = await getConfig();
  
  const apiKey = config.textApiKey;
  let baseUrl = (config.textBaseUrl || 'https://api.minimax.chat/v1')
    .replace(/\/v1\/.*$/, '/v1');
  const model = config.textModel || 'abab6.5s-chat';
  
  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const prompt = `You are a professional fitness and nutrition coach.

User Profile: ${JSON.stringify(userData)}
Today's Nutrition: ${JSON.stringify(nutritionData)}

Respond ONLY with valid JSON:
{"diet_plan": "...", "workout_plan": "...", "supplement_plan": "..."}`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
      }),
    });

    let responseText = await response.text();

    // 清理响应文本
    responseText = responseText.replace(/^\uFEFF/, '').trim();

    if (!response.ok) {
      throw new Error('API Error (' + response.status + '): ' + responseText.substring(0, 200));
    }

    const data = JSON.parse(responseText);
    const content = data.choices[0].message.content;

    // 清理响应内容
    let cleanContent = content
      .replace(/^\uFEFF/, '')
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('无法解析 AI 响应: ' + cleanContent.substring(0, 100));
  } catch (error) {
    console.error('Error generating coach recommendations:', error);
    throw error;
  }
};
