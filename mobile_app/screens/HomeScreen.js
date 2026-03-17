import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase, userOps, summaryOps } from '../services/databaseService';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initAndLoadData();
  }, []);

  const initAndLoadData = async () => {
    try {
      setLoading(true);
      await initDatabase();
      
      const today = new Date().toISOString().split('T')[0];
      const [summaryData, userData] = await Promise.all([
        summaryOps.getDailySummary(today),
        userOps.getUser()
      ]);
      
      setDailySummary(summaryData || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
      setUser(userData || { daily_calorie_target: 2000 });
    } catch (error) {
      console.error('Error loading data:', error);
      setDailySummary({ total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
      setUser({ daily_calorie_target: 2000 });
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [summaryData, userData] = await Promise.all([
        summaryOps.getDailySummary(today),
        userOps.getUser()
      ]);
      setDailySummary(summaryData || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
      setUser(userData || { daily_calorie_target: 2000 });
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const getCaloriesRemaining = () => {
    if (!user || !dailySummary) return 0;
    return Math.round((user.daily_calorie_target || 2000) - (dailySummary.total_calories || 0));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome Back!</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Today's Progress</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(dailySummary?.total_calories || 0)}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(dailySummary?.total_protein || 0)}g</Text>
            <Text style={styles.statLabel}>Protein</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(dailySummary?.total_carbs || 0)}g</Text>
            <Text style={styles.statLabel}>Carbs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(dailySummary?.total_fat || 0)}g</Text>
            <Text style={styles.statLabel}>Fat</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(((dailySummary?.total_calories || 0) / (user?.daily_calorie_target || 2000)) * 100, 100)}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {getCaloriesRemaining()} kcal remaining
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <TouchableOpacity
        style={styles.moduleCard}
        onPress={() => navigation.navigate('Food Logger')}
      >
        <View style={styles.moduleIconContainer}>
          <Ionicons name="restaurant" size={32} color="#4CAF50" />
        </View>
        <View style={styles.moduleContent}>
          <Text style={styles.moduleTitle}>Calorie Food Logger</Text>
          <Text style={styles.moduleDescription}>
            Log your meals by taking a photo or typing what you ate
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#757575" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.moduleCard}
        onPress={() => navigation.navigate('AI Coach')}
      >
        <View style={[styles.moduleIconContainer, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="fitness" size={32} color="#FF9800" />
        </View>
        <View style={styles.moduleContent}>
          <Text style={styles.moduleTitle}>AI Personal Coach</Text>
          <Text style={styles.moduleDescription}>
            Get personalized diet, workout, and supplement recommendations
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#757575" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.moduleCard}
        onPress={() => navigation.navigate('DailyNutrition')}
      >
        <View style={[styles.moduleIconContainer, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="nutrition" size={32} color="#2196F3" />
        </View>
        <View style={styles.moduleContent}>
          <Text style={styles.moduleTitle}>Daily Nutrition</Text>
          <Text style={styles.moduleDescription}>
            View your today's food log and nutrition breakdown
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#757575" />
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
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 5,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  progressContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleContent: {
    flex: 1,
    marginLeft: 15,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  moduleDescription: {
    fontSize: 13,
    color: '#757575',
    marginTop: 5,
  },
  bottomPadding: {
    height: 20,
  },
});
