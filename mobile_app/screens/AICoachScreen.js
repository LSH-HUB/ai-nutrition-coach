import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase, userOps, summaryOps, aiOps } from '../services/databaseService';
import { generateCoachRecommendations } from '../services/openaiService';
import { isConfigured } from '../services/configService';

export default function AICoachScreen() {
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [user, setUser] = useState(null);
  const [todayNutrition, setTodayNutrition] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    initAndLoadData();
  }, []);

  const initAndLoadData = async () => {
    try {
      setLoading(true);
      await initDatabase();
      
      const userData = await userOps.getUser();
      const today = new Date().toISOString().split('T')[0];
      const summary = await summaryOps.getDailySummary(today);
      const latestRec = await aiOps.getLatestRecommendation();

      setUser(userData);
      setTodayNutrition(summary || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });

      if (latestRec && latestRec.date === today) {
        setRecommendations({
          diet_plan: latestRec.diet_plan,
          workout_plan: latestRec.workout_plan,
          supplement_plan: latestRec.supplement_plan,
          cached: true
        });
      }
    } catch (error) {
      console.error('Error loading AI coach:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const configured = await isConfigured();
    if (!configured) {
      Alert.alert('API Not Configured', 'Please go to Settings and configure your API Key first.');
      return;
    }

    try {
      setRegenerating(true);
      
      const nutritionData = todayNutrition || {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0
      };

      const newRecs = await generateCoachRecommendations(user || {}, nutritionData);
      
      const today = new Date().toISOString().split('T')[0];
      await aiOps.saveRecommendation({
        date: today,
        diet_plan: newRecs.diet_plan,
        workout_plan: newRecs.workout_plan,
        supplement_plan: newRecs.supplement_plan
      });

      setRecommendations(newRecs);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate recommendations');
      console.error(error);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your personalized recommendations...</Text>
      </View>
    );
  }

  const calorieTarget = user?.daily_calorie_target || 2000;
  const caloriesConsumed = todayNutrition?.total_calories || 0;
  const caloriesRemaining = Math.max(0, calorieTarget - caloriesConsumed);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={initAndLoadData} colors={['#4CAF50']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Personal Coach</Text>
        <Text style={styles.subtitle}>Your personalized fitness advisor</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Today's Progress</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>{Math.round(caloriesConsumed)}</Text>
            <Text style={styles.progressLabel}>Consumed</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>{caloriesRemaining}</Text>
            <Text style={styles.progressLabel}>Remaining</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>{calorieTarget}</Text>
            <Text style={styles.progressLabel}>Target</Text>
          </View>
        </View>
      </View>

      {recommendations ? (
        <>
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="restaurant" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.recommendationTitle}>Diet Plan</Text>
            </View>
            <Text style={styles.recommendationText}>
              {recommendations.diet_plan || 'No diet recommendations available'}
            </Text>
          </View>

          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="fitness" size={24} color="#FF9800" />
              </View>
              <Text style={styles.recommendationTitle}>Workout Plan</Text>
            </View>
            <Text style={styles.recommendationText}>
              {recommendations.workout_plan || 'No workout recommendations available'}
            </Text>
          </View>

          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="medical" size={24} color="#2196F3" />
              </View>
              <Text style={styles.recommendationTitle}>Supplement Plan</Text>
            </View>
            <Text style={styles.recommendationText}>
              {recommendations.supplement_plan || 'No supplement recommendations available'}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.noRecommendationsCard}>
          <Ionicons name="bulb-outline" size={48} color="#FF9800" />
          <Text style={styles.noRecommendationsTitle}>No Recommendations Yet</Text>
          <Text style={styles.noRecommendationsText}>
            Tap the button below to generate your personalized diet, workout, and supplement recommendations.
          </Text>
        </View>
      )}

      {user && (
        <View style={styles.userStatsCard}>
          <Text style={styles.userStatsTitle}>Your Profile</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{user.weight} kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>{user.goal_weight || 'N/A'} kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>BMR</Text>
              <Text style={styles.statValue}>{Math.round(user.bmr || 0)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>TDEE</Text>
              <Text style={styles.statValue}>{Math.round(user.tdee || 0)}</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.regenerateButton, regenerating && styles.regenerateButtonDisabled]}
        onPress={handleRegenerate}
        disabled={regenerating}
      >
        {regenerating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.regenerateButtonText}>
              {recommendations ? 'Regenerate Recommendations' : 'Generate Recommendations'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Quick Tips</Text>
        <View style={styles.tipItem}>
          <Ionicons name="water" size={20} color="#2196F3" />
          <Text style={styles.tipText}>Drink at least 8 glasses of water daily</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="moon" size={20} color="#7E57C2" />
          <Text style={styles.tipText}>Get 7-9 hours of quality sleep</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="walk" size={20} color="#4CAF50" />
          <Text style={styles.tipText}>Aim for 10,000 steps per day</Text>
        </View>
      </View>

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
  progressCard: {
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
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
  },
  recommendationCard: {
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
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  recommendationText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 22,
  },
  noRecommendationsCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noRecommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginTop: 15,
  },
  noRecommendationsText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  userStatsCard: {
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
  userStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  regenerateButton: {
    backgroundColor: '#FF9800',
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  regenerateButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  regenerateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsCard: {
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
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 12,
  },
  bottomPadding: {
    height: 30,
  },
});
