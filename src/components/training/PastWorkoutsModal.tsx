/**
 * Past Workouts Modal
 *
 * Displays a list of completed workout sessions with:
 * - Workout name
 * - Plan name
 * - Date
 * - Time duration
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutSession } from '@/types/training.types';

interface PastWorkoutsModalProps {
  visible: boolean;
  onClose: () => void;
  sessions: WorkoutSession[];
  loading: boolean;
}

export const PastWorkoutsModal: React.FC<PastWorkoutsModalProps> = ({
  visible,
  onClose,
  sessions,
  loading,
}) => {
  /**
   * Format date to readable German format
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    }

    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Gestern';
    }

    // Format as DD.MM.YYYY
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Calculate workout duration
   */
  const calculateDuration = (session: WorkoutSession): string => {
    if (!session.start_time || !session.end_time) return 'N/A';

    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    if (durationMinutes < 60) {
      return `${durationMinutes} Min`;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  /**
   * Render individual workout session item
   */
  const renderSessionItem = ({ item }: { item: WorkoutSession }) => {
    return (
      <View style={styles.sessionItem}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionWorkoutName} numberOfLines={1}>
              {item.workout?.name || 'Workout'}
            </Text>
            <Text style={styles.sessionPlanName} numberOfLines={1}>
              {item.plan?.name || 'Training'}
            </Text>
          </View>
        </View>
        <View style={styles.sessionDetails}>
          <View style={styles.sessionDetailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.sessionDetailText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.sessionDetailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.sessionDetailText}>{calculateDuration(item)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vergangene Workouts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3083FF" />
              <Text style={styles.loadingText}>Lade Workouts...</Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={64} color="#CCC" />
              <Text style={styles.emptyTitle}>Noch keine Workouts</Text>
              <Text style={styles.emptyText}>
                Absolviere dein erstes Workout, um deine Historie zu starten!
              </Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              renderItem={renderSessionItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    padding: 16,
  },
  sessionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionIconContainer: {
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionWorkoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sessionPlanName: {
    fontSize: 14,
    color: '#666',
  },
  sessionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#666',
  },
});
