import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { analyzeFoodImage, analyzeFoodText } from '../services/openaiService';
import { initDatabase, foodOps } from '../services/databaseService';
import { isConfigured, isVisionConfigured, getConfig } from '../services/configService';

export default function FoodLoggerScreen() {
  const [mode, setMode] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setStatusMessage('Permission Required: Please allow access to your photo library.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (pickerResult && !pickerResult.canceled && pickerResult.assets && pickerResult.assets[0]) {
        setImage(pickerResult.assets[0]);
        setResult(null);
        setStatusMessage('Image selected! Click Analyze Food to continue.');
      }
    } catch (error) {
      setStatusMessage('Error: ' + error.message);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        setStatusMessage('Permission Required: Please allow access to your camera.');
        return;
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (pickerResult && !pickerResult.canceled && pickerResult.assets && pickerResult.assets[0]) {
        setImage(pickerResult.assets[0]);
        setResult(null);
        setStatusMessage('Photo taken! Click Analyze Food to continue.');
      }
    } catch (error) {
      setStatusMessage('Error: ' + error.message);
    }
  };

  const analyzeFoodItem = async () => {
    setStatusMessage('');
    setDebugInfo('');
    
    try {
      const configured = mode === 'image' ? await isVisionConfigured() : await isConfigured();
      
      if (!configured) {
        setStatusMessage('ERROR: API Not Configured! Please go to Settings and configure your API Key.');
        return;
      }

      if (mode === 'image' && !image) {
        setStatusMessage('ERROR: Please select an image first.');
        return;
      }

      if (mode === 'text' && !textInput.trim()) {
        setStatusMessage('ERROR: Please enter a food description.');
        return;
      }

      // 显示当前配置
      const config = await getConfig();
      const currentBaseUrl = mode === 'image' ? (config.visionBaseUrl || config.textBaseUrl) : config.textBaseUrl;
      const currentModel = mode === 'image' ? (config.visionModel || 'minimax-vl') : (config.textModel || 'MiniMax-M2.5');
      setDebugInfo(`URL: ${currentBaseUrl}/chat/completions\nModel: ${currentModel}`);

      setAnalyzing(true);
      setStatusMessage('Analyzing... Please wait...');
      setResult(null);

      let response;
      if (mode === 'image') {
        if (!image.base64) {
          setStatusMessage('ERROR: Image data not available. Please try text mode.');
          setAnalyzing(false);
          return;
        }
        response = await analyzeFoodImage(image.base64);
      } else {
        response = await analyzeFoodText(textInput);
      }
      
      setStatusMessage('Analysis complete!');
      setResult(response);
    } catch (error) {
      console.error('Error analyzing food:', error);
      setStatusMessage('ERROR: ' + (error.message || 'Failed to analyze food'));
    } finally {
      setAnalyzing(false);
    }
  };

  const saveRecord = async () => {
    if (!result) return;

    setSaving(true);
    try {
      await initDatabase();
      const today = new Date().toISOString().split('T')[0];
      await foodOps.addRecord({
        date: today,
        food_name: result.food_name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        weight: result.estimated_weight,
        image_path: null,
      });
      setStatusMessage('SUCCESS: Food record saved!');
      setResult(null);
      setTextInput('');
      setImage(null);
    } catch (error) {
      setStatusMessage('ERROR: Failed to save record.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Your Food</Text>
        <Text style={styles.subtitle}>Take a photo or type what you ate</Text>
      </View>

      {statusMessage ? (
        <View style={[styles.statusBox, statusMessage.includes('ERROR') ? styles.errorBox : styles.successBox]}>
          <Text style={[styles.statusText, statusMessage.includes('ERROR') ? styles.errorText : styles.successText]}>
            {statusMessage}
          </Text>
        </View>
      ) : null}

      {debugInfo ? (
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      ) : null}

      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'image' && styles.modeButtonActive]}
          onPress={() => setMode('image')}
        >
          <Text style={[styles.modeButtonText, mode === 'image' && styles.modeButtonTextActive]}>
            Upload Image
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'text' && styles.modeButtonActive]}
          onPress={() => setMode('text')}
        >
          <Text style={[styles.modeButtonText, mode === 'text' && styles.modeButtonTextActive]}>
            Type Food
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'image' ? (
        <View style={styles.inputContainer}>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                <Text style={styles.changeImageText}> Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Text style={styles.imageButtonText}>Choose from Library</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 2 slices of pizza, 1 bowl of rice"
            placeholderTextColor="#9E9E9E"
            value={textInput}
            onChangeText={setTextInput}
            multiline
            numberOfLines={4}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
        onPress={analyzeFoodItem}
        disabled={analyzing}
      >
        {analyzing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.analyzeButtonText}>Analyze Food</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Analysis Result</Text>

          <View style={styles.resultCard}>
            <Text style={styles.foodName}>{result.food_name}</Text>
            <Text style={styles.portionText}>Estimated portion: {result.estimated_weight}g</Text>

            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{result.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{result.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{result.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{result.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={saveRecord}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save to Log</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, backgroundColor: '#4CAF50' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginTop: 5 },
  statusBox: { margin: 15, padding: 15, borderRadius: 10 },
  errorBox: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#F44336' },
  successBox: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#4CAF50' },
  statusText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorText: { color: '#F44336' },
  successText: { color: '#4CAF50' },
  debugBox: { marginHorizontal: 15, marginBottom: 15, padding: 10, backgroundColor: '#FFF3E0', borderRadius: 8 },
  debugText: { fontSize: 12, fontFamily: 'monospace', color: '#E65100' },
  modeContainer: { flexDirection: 'row', margin: 15, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 5 },
  modeButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modeButtonActive: { backgroundColor: '#4CAF50' },
  modeButtonText: { fontSize: 14, fontWeight: '600', color: '#757575' },
  modeButtonTextActive: { color: '#FFFFFF' },
  inputContainer: { marginHorizontal: 15, marginBottom: 15 },
  imageButtonsContainer: { gap: 10 },
  imageButton: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: '#4CAF50', borderStyle: 'dashed' },
  imageButtonText: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },
  imagePreviewContainer: { alignItems: 'center' },
  imagePreview: { width: '100%', height: 250, borderRadius: 10 },
  changeImageButton: { marginTop: 10 },
  changeImageText: { color: '#4CAF50', fontSize: 14, fontWeight: '600' },
  textInput: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, fontSize: 16, minHeight: 120, textAlignVertical: 'top' },
  analyzeButton: { backgroundColor: '#FF9800', marginHorizontal: 15, padding: 15, borderRadius: 10, alignItems: 'center' },
  analyzeButtonDisabled: { backgroundColor: '#BDBDBD' },
  analyzeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  resultContainer: { margin: 15 },
  resultTitle: { fontSize: 18, fontWeight: '600', color: '#212121', marginBottom: 10 },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  foodName: { fontSize: 22, fontWeight: 'bold', color: '#212121', textAlign: 'center' },
  portionText: { fontSize: 14, color: '#757575', textAlign: 'center', marginTop: 5, marginBottom: 15 },
  nutritionGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E0E0E0' },
  nutritionItem: { alignItems: 'center' },
  nutritionValue: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  nutritionLabel: { fontSize: 12, color: '#757575', marginTop: 5 },
  saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  saveButtonDisabled: { backgroundColor: '#BDBDBD' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  bottomPadding: { height: 30 },
});
