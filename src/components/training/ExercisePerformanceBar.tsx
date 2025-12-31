import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ExercisePerformanceBarProps {
  exerciseName: string;
  percentageChange: number;
  hasPreviousData: boolean;
}

const ExercisePerformanceBar: React.FC<ExercisePerformanceBarProps> = ({
  exerciseName,
  percentageChange,
  hasPreviousData,
}) => {
  // Begrenze den prozentualen Wert für die Anzeige (max ±100%)
  const displayPercentage = Math.max(-100, Math.min(100, percentageChange));

  // Berechne die Breite der Bar (0-50% der Gesamtbreite)
  const barWidth = Math.abs(displayPercentage) / 2;

  // Bestimme die Farbe basierend auf positiv/negativ
  const isPositive = percentageChange >= 0;
  const colors = isPositive
    ? ['#4CAF50', '#45A049'] // Grün für Verbesserung
    : ['#F44336', '#D32F2F']; // Rot für Verschlechterung

  return (
    <View style={styles.container}>
      <Text style={styles.exerciseName}>{exerciseName}</Text>

      <View style={styles.barContainer}>
        {/* Mittellinie */}
        <View style={styles.centerLine} />

        {/* Bar Hintergrund */}
        <View style={styles.barBackground}>
          {hasPreviousData ? (
            <>
              {/* Negative Seite (links) */}
              <View style={styles.negativeSide}>
                {!isPositive && (
                  <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.bar, styles.negativeBar, { width: `${barWidth}%` }]}
                  />
                )}
              </View>

              {/* Positive Seite (rechts) */}
              <View style={styles.positiveSide}>
                {isPositive && (
                  <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.bar, styles.positiveBar, { width: `${barWidth}%` }]}
                  />
                )}
              </View>
            </>
          ) : (
            // Wenn keine Vergleichsdaten vorhanden sind, zeige einen neutralen Indikator
            <View style={styles.noDataContainer}>
              <View style={styles.noDataDot} />
            </View>
          )}
        </View>

        {/* Prozent-Anzeige */}
        <Text style={[
          styles.percentageText,
          isPositive ? styles.positiveText : styles.negativeText,
          !hasPreviousData && styles.noDataText
        ]}>
          {hasPreviousData
            ? `${isPositive ? '+' : ''}${displayPercentage.toFixed(0)}%`
            : 'Neu'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  barContainer: {
    position: 'relative',
    height: 32,
  },
  barBackground: {
    flexDirection: 'row',
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#999999',
    zIndex: 10,
  },
  negativeSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  positiveSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bar: {
    height: '100%',
    minWidth: 2,
  },
  negativeBar: {
    // Bar wächst nach links
  },
  positiveBar: {
    // Bar wächst nach rechts
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999999',
  },
  percentageText: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
    fontSize: 14,
    fontWeight: '700',
  },
  positiveText: {
    color: '#2E7D32',
  },
  negativeText: {
    color: '#C62828',
  },
  noDataText: {
    color: '#666666',
  },
});

export default ExercisePerformanceBar;
