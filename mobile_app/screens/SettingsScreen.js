import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getConfig, saveConfig, isConfigured, isVisionConfigured } from '../services/configService';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    textApiKey: '',
    textBaseUrl: 'https://api.minimax.chat/v1',
    textModel: 'MiniMax-M2.5',
    
    visionApiKey: '',
    visionBaseUrl: 'https://api.minimax.chat/v1',
    visionModel: 'minimax-vl',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const savedConfig = await getConfig();
    setConfig(savedConfig);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config.textApiKey.trim()) {
      Alert.alert('错误', '请输入文字 API Key');
      return;
    }

    setSaving(true);
    const success = await saveConfig(config);
    setSaving(false);

    if (success) {
      Alert.alert('成功', '配置已保存');
    } else {
      Alert.alert('错误', '保存配置失败');
    }
  };

  const testTextConnection = async () => {
    if (!config.textApiKey.trim()) {
      Alert.alert('错误', '请先输入文字 API Key');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${config.textBaseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.textApiKey}`,
        },
      });

      if (response.ok) {
        Alert.alert('成功', '文字 API 连接测试成功！');
      } else {
        const error = await response.json();
        Alert.alert('失败', error.error?.message || '连接失败');
      }
    } catch (error) {
      Alert.alert('错误', `连接失败: ${error.message}`);
    }
    setSaving(false);
  };

  const testVisionConnection = async () => {
    if (!config.visionApiKey.trim()) {
      Alert.alert('错误', '请先输入图片 API Key');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${config.visionBaseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.visionApiKey}`,
        },
      });

      if (response.ok) {
        Alert.alert('成功', '图片 API 连接测试成功！');
      } else {
        const error = await response.json();
        Alert.alert('失败', error.error?.message || '连接失败');
      }
    } catch (error) {
      Alert.alert('错误', `连接失败: ${error.message}`);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 文字 API 配置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>文字 API 配置</Text>
        <Text style={styles.description}>
          用于文字分析和 AI 教练功能
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>API Key *</Text>
        <TextInput
          style={styles.input}
          value={config.textApiKey}
          onChangeText={(text) => setConfig({ ...config, textApiKey: text })}
          placeholder="sk-..."
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>API Base URL</Text>
        <TextInput
          style={styles.input}
          value={config.textBaseUrl}
          onChangeText={(text) => setConfig({ ...config, textBaseUrl: text })}
          placeholder="https://api.minimax.chat/v1"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>模型名称</Text>
        <TextInput
          style={styles.input}
          value={config.textModel}
          onChangeText={(text) => setConfig({ ...config, textModel: text })}
          placeholder="MiniMax-M2.5"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.testButton]}
        onPress={testTextConnection}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? '测试中...' : '测试文字 API'}
        </Text>
      </TouchableOpacity>

      {/* 图片 API 配置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>图片 API 配置</Text>
        <Text style={styles.description}>
          用于食物图片识别功能
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>API Key</Text>
        <TextInput
          style={styles.input}
          value={config.visionApiKey}
          onChangeText={(text) => setConfig({ ...config, visionApiKey: text })}
          placeholder="sk-... (可以留空使用文字API)"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>API Base URL</Text>
        <TextInput
          style={styles.input}
          value={config.visionBaseUrl}
          onChangeText={(text) => setConfig({ ...config, visionBaseUrl: text })}
          placeholder="https://api.minimax.chat/v1"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>图片模型</Text>
        <TextInput
          style={styles.input}
          value={config.visionModel}
          onChangeText={(text) => setConfig({ ...config, visionModel: text })}
          placeholder="abab6.5s-chat"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.testButton]}
        onPress={testVisionConnection}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? '测试中...' : '测试图片 API'}
        </Text>
      </TouchableOpacity>

      {/* 保存按钮 */}
      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? '保存中...' : '保存配置'}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#757575',
  },
  inputGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButton: {
    backgroundColor: '#2196F3',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 30,
  },
});
