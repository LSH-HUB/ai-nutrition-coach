import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase, userOps, metricsOps } from '../services/databaseService';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    bodyfat: '',
    goal_weight: '',
    goal_date: '',
  });

  useEffect(() => {
    initAndLoadUser();
  }, []);

  const initAndLoadUser = async () => {
    try {
      setLoading(true);
      await initDatabase();
      const userData = await userOps.getUser();
      if (userData) {
        setUser(userData);
        setFormData({
          age: userData.age?.toString() || '',
          gender: userData.gender || '',
          height: userData.height?.toString() || '',
          weight: userData.weight?.toString() || '',
          bodyfat: userData.bodyfat?.toString() || '',
          goal_weight: userData.goal_weight?.toString() || '',
          goal_date: userData.goal_date || '',
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.age || !formData.gender || !formData.height || !formData.weight) {
      Alert.alert('Missing Fields', 'Please fill in all required fields (age, gender, height, weight).');
      return;
    }

    setSaving(true);
    try {
      const metrics = calculateMetrics();
      
      await userOps.updateUser({
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        bodyfat: formData.bodyfat ? parseFloat(formData.bodyfat) : null,
        bmr: metrics.bmr,
        tdee: metrics.tdee,
        goal_weight: formData.goal_weight ? parseFloat(formData.goal_weight) : null,
        goal_date: formData.goal_date || null,
        daily_calorie_target: metrics.calorieTarget,
      });

      // Also add to body metrics
      await metricsOps.addMetric({
        date: new Date().toISOString().split('T')[0],
        weight: parseFloat(formData.weight),
        bodyfat: formData.bodyfat ? parseFloat(formData.bodyfat) : null,
        bmr: metrics.bmr,
      });

      Alert.alert('Success', 'Profile saved successfully!');
      initAndLoadUser();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const calculateMetrics = () => {
    const age = parseInt(formData.age) || 0;
    const height = parseFloat(formData.height) || 0;
    const weight = parseFloat(formData.weight) || 0;
    const gender = formData.gender.toLowerCase();

    if (age === 0 || height === 0 || weight === 0 || !gender) {
      return { bmr: 0, tdee: 0, calorieTarget: 2000 };
    }

    let bmr;
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    const tdee = bmr * 1.2;

    let calorieTarget = tdee;
    if (formData.goal_weight) {
      const goalWeight = parseFloat(formData.goal_weight);
      const weightDiff = goalWeight - weight;
      if (weightDiff < 0) {
        calorieTarget = tdee - 500;
      } else if (weightDiff > 0) {
        calorieTarget = tdee + 500;
      }
    }

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calorieTarget: Math.round(calorieTarget),
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Profile</Text>
        <Text style={styles.subtitle}>Set your body metrics and goals</Text>
      </View>

      {metrics.bmr > 0 && (
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Calculated Values</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.bmr}</Text>
              <Text style={styles.metricLabel}>BMR (kcal)</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.tdee}</Text>
              <Text style={styles.metricLabel}>TDEE (kcal)</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.calorieTarget}</Text>
              <Text style={styles.metricLabel}>Daily Target</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Body Metrics</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            placeholderTextColor="#9E9E9E"
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderButton, formData.gender === 'Male' && styles.genderButtonActive]}
              onPress={() => setFormData({ ...formData, gender: 'Male' })}
            >
              <Text style={[styles.genderText, formData.gender === 'Male' && styles.genderTextActive]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, formData.gender === 'Female' && styles.genderButtonActive]}
              onPress={() => setFormData({ ...formData, gender: 'Female' })}
            >
              <Text style={[styles.genderText, formData.gender === 'Female' && styles.genderTextActive]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Height (cm) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your height"
            placeholderTextColor="#9E9E9E"
            value={formData.height}
            onChangeText={(text) => setFormData({ ...formData, height: text })}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Weight (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your weight"
            placeholderTextColor="#9E9E9E"
            value={formData.weight}
            onChangeText={(text) => setFormData({ ...formData, weight: text })}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Body Fat (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter body fat percentage (optional)"
            placeholderTextColor="#9E9E9E"
            value={formData.bodyfat}
            onChangeText={(text) => setFormData({ ...formData, bodyfat: text })}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Goals</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Goal Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your goal weight"
            placeholderTextColor="#9E9E9E"
            value={formData.goal_weight}
            onChangeText={(text) => setFormData({ ...formData, goal_weight: text })}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Goal Date</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2024-12-31"
            placeholderTextColor="#9E9E9E"
            value={formData.goal_date}
            onChangeText={(text) => setFormData({ ...formData, goal_date: text })}
          />
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color="#2196F3" />
        <Text style={styles.infoText}>
          Your BMR (Basal Metabolic Rate) is calculated using the Mifflin-St Jeor equation.
          TDEE is estimated assuming a sedentary activity level.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    padding: 20,
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 5,
  },
  metricsCard: {
    backgroundColor: '#E8F5E9',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  metricLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: '#212121',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  genderText: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#4CAF50',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 30,
  },
});
