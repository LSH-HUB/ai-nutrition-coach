import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase, summaryOps, foodOps, userOps } from '../services/databaseService';

export default function DailyNutritionScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    initAndLoadData();
  }, []);

  const initAndLoadData = async () => {
    try {
      setLoading(true);
      await initDatabase();
      
      const today = new Date().toISOString().split('T')[0];
      const [summary, records, user] = await Promise.all([
        summaryOps.getDailySummary(today),
        foodOps.getDailyRecords(today),
        userOps.getUser()
      ]);

      setData({
        date: today,
        summary: summary || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 },
        records: records || [],
        user: user,
      });
    } catch (error) {
      console.error('Error loading daily summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCaloriesRemaining = () => {
    if (!data?.user || !data?.summary) return 0;
    return Math.round((data.user.daily_calorie_target || 2000) - (data.summary.total_calories || 0));
  };

  const getProgressPercentage = () => {
    if (!data?.user || !data?.summary) return 0;
    const target = data.user.daily_calorie_target || 2000;
    const consumed = data.summary.total_calories || 0;
    return Math.min((consumed / target) * 100, 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const { date, summary, records, user } = data || {};
  const calorieTarget = user?.daily_calorie_target || 2000;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        <View style={styles.summaryContainer}>
          <View style={styles.calorieCircle}>
            <Text style={styles.calorieValue}>{Math.round(summary?.total_calories || 0)}</Text>
            <Text style={styles.calorieLabel}>consumed</Text>
          </View>

          <View style={styles.macroSummary}>
            <View style={styles.macroRow}>
              <View style={[styles.macroItem, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.macroValue}>{Math.round(summary?.total_protein || 0)}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={[styles.macroItem, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.macroValue}>{Math.round(summary?.total_carbs || 0)}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={[styles.macroItem, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.macroValue}>{Math.round(summary?.total_fat || 0)}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getProgressPercentage()}%` },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              {getCaloriesRemaining()} kcal remaining
            </Text>
            <Text style={styles.progressTarget}>Target: {calorieTarget} kcal</Text>
          </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Today's Food Log</Text>

        {records && records.length > 0 ? (
          <FlatList
            data={records}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.foodCard}>
                <View style={styles.foodHeader}>
                  <Text style={styles.foodName}>{item.food_name}</Text>
                  <Text style={styles.foodCalories}>{Math.round(item.calories)} kcal</Text>
                </View>
                <View style={styles.foodMacros}>
                  <Text style={styles.macroText}>P: {Math.round(item.protein)}g</Text>
                  <Text style={styles.macroText}>C: {Math.round(item.carbs)}g</Text>
                  <Text style={styles.macroText}>F: {Math.round(item.fat)}g</Text>
                  {item.weight > 0 && (
                    <Text style={styles.macroText}>{Math.round(item.weight)}g</Text>
                  )}
                </View>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={initAndLoadData}
                colors={['#4CAF50']}
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyText}>No food logged today</Text>
            <Text style={styles.emptySubtext}>
              Tap the Food Logger tab to add meals
            </Text>
          </View>
        )}
      </View>
    </View>
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
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 10,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  calorieCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  macroSummary: {
    flex: 1,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    marginHorizontal: 3,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  macroLabel: {
    fontSize: 10,
    color: '#757575',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressTarget: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  foodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  foodCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  foodMacros: {
    flexDirection: 'row',
    gap: 15,
  },
  macroText: {
    fontSize: 13,
    color: '#757575',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#757575',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 5,
  },
});
