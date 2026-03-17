import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { initDatabase, summaryOps, metricsOps, userOps } from '../services/databaseService';

const screenWidth = Dimensions.get('window').width;

export default function ChartsScreen() {
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState('daily');
  const [monthlyData, setMonthlyData] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initAndLoadData();
  }, []);

  const initAndLoadData = async () => {
    try {
      setLoading(true);
      await initDatabase();
      
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      // Get monthly data and fill in missing dates
      const rawData = await summaryOps.getMonthlySummary(year, month);
      const daysInMonth = new Date(year, month, 0).getDate();
      const filledData = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const existing = rawData.find(d => d.date === dateStr);
        filledData.push(existing || {
          date: dateStr,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0
        });
      }

      const [metrics, userData] = await Promise.all([
        metricsOps.getMetrics(30),
        userOps.getUser()
      ]);

      setMonthlyData(filledData);
      setWeightData(metrics || []);
      setUser(userData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
  };

  const getDailyCaloriesData = () => {
    const last7Days = monthlyData.slice(-7);
    const labels = last7Days.map((d) => {
      const date = new Date(d.date);
      return `${date.getDate()}`;
    });
    const data = last7Days.map((d) => d.total_calories || 0);

    return {
      labels,
      datasets: [{ data: data.length > 0 ? data : [0] }],
    };
  };

  const getMonthlyCaloriesData = () => {
    const labels = monthlyData.map((d) => {
      const date = new Date(d.date);
      return `${date.getDate()}`;
    });
    const data = monthlyData.map((d) => d.total_calories || 0);

    return {
      labels,
      datasets: [{ data: data.length > 0 ? data : [0] }],
    };
  };

  const getWeightData = () => {
    const reversed = [...weightData].reverse();
    const last10 = reversed.slice(-10);
    const labels = last10.map((d) => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const data = last10.map((d) => d.weight || 0);

    return {
      labels,
      datasets: [{ data: data.length > 0 ? data : [0] }],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading charts...</Text>
      </View>
    );
  }

  const calorieTarget = user?.daily_calorie_target || 2000;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Visualization</Text>
        <Text style={styles.subtitle}>Track your nutrition and progress</Text>
      </View>

      <View style={styles.chartSelector}>
        <TouchableOpacity
          style={[styles.chartButton, selectedChart === 'daily' && styles.chartButtonActive]}
          onPress={() => setSelectedChart('daily')}
        >
          <Text style={[styles.chartButtonText, selectedChart === 'daily' && styles.chartButtonTextActive]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chartButton, selectedChart === 'monthly' && styles.chartButtonActive]}
          onPress={() => setSelectedChart('monthly')}
        >
          <Text style={[styles.chartButtonText, selectedChart === 'monthly' && styles.chartButtonTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chartButton, selectedChart === 'weight' && styles.chartButtonActive]}
          onPress={() => setSelectedChart('weight')}
        >
          <Text style={[styles.chartButtonText, selectedChart === 'weight' && styles.chartButtonTextActive]}>
            Weight
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        {selectedChart === 'daily' && (
          <View>
            <Text style={styles.chartTitle}>Last 7 Days Calorie Intake</Text>
            <LineChart
              data={getDailyCaloriesData()}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
            <View style={styles.targetLine}>
              <Text style={styles.targetLabel}>Daily Target: {calorieTarget} kcal</Text>
            </View>
          </View>
        )}

        {selectedChart === 'monthly' && (
          <View>
            <Text style={styles.chartTitle}>This Month's Calorie Trend</Text>
            <LineChart
              data={getMonthlyCaloriesData()}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
            <View style={styles.targetLine}>
              <Text style={styles.targetLabel}>Daily Target: {calorieTarget} kcal</Text>
            </View>
          </View>
        )}

        {selectedChart === 'weight' && (
          <View>
            <Text style={styles.chartTitle}>Weight Change</Text>
            {weightData.length > 0 ? (
              <LineChart
                data={getWeightData()}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#FF9800',
                  },
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No weight data available</Text>
                <Text style={styles.noDataSubtext}>Update your profile to track weight</Text>
              </View>
            )}
            {user?.goal_weight && (
              <View style={styles.targetLine}>
                <Text style={styles.targetLabel}>Goal Weight: {user.goal_weight} kg</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Statistics Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {monthlyData.length > 0
                ? Math.round(monthlyData.reduce((sum, d) => sum + (d.total_calories || 0), 0) / monthlyData.length)
                : 0}
            </Text>
            <Text style={styles.summaryLabel}>Avg Daily Calories</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {monthlyData.length > 0 ? monthlyData.filter((d) => d.total_calories > 0).length : 0}
            </Text>
            <Text style={styles.summaryLabel}>Days Logged</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {weightData.length > 0 ? weightData[0]?.weight?.toFixed(1) || 0 : 0}
            </Text>
            <Text style={styles.summaryLabel}>Current Weight (kg)</Text>
          </View>
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
  chartSelector: {
    flexDirection: 'row',
    margin: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 5,
  },
  chartButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chartButtonActive: {
    backgroundColor: '#4CAF50',
  },
  chartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  chartButtonTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 10,
    marginLeft: -10,
  },
  targetLine: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  targetLabel: {
    fontSize: 14,
    color: '#757575',
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#757575',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 5,
  },
  summaryContainer: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 30,
  },
});
