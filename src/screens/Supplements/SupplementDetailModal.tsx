/**
 * Supplement Detail Modal
 *
 * Shows detailed information about a supplement including:
 * - Name and category
 * - Target areas
 * - Benefits
 * - Notes and contraindications
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { theme } from '../../components/ui/theme';
import { SupplementDefinition, TargetArea } from '../../services/supplements/types';
import { getTargetAreaDisplayName } from '../../services/supplements/stackStorage';

interface SupplementDetailModalProps {
  visible: boolean;
  supplement: SupplementDefinition | null;
  onClose: () => void;
}

export function SupplementDetailModal({
  visible,
  supplement,
  onClose,
}: SupplementDetailModalProps) {
  if (!supplement) return null;

  const benefits = supplement.positiveConditions.map(c => c.description);
  const cautions = supplement.negativeConditions.map(c => c.description);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.icon}>💊</Text>
              <View style={styles.headerText}>
                <Text style={styles.title}>{supplement.name}</Text>
                <Text style={styles.substanceClass}>{getSubstanceClassDisplayName(supplement.substanceClass)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Target Areas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Zielbereiche</Text>
              <View style={styles.tagsContainer}>
                {supplement.targetAreas.map((area) => (
                  <View key={area} style={styles.tag}>
                    <Text style={styles.tagText}>{getTargetAreaDisplayName(area)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Benefits */}
            {benefits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vorteile</Text>
                {benefits.map((benefit, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>✓</Text>
                    <Text style={styles.listItemText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Notes */}
            {supplement.notes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Wichtige Hinweise</Text>
                {supplement.notes.map((note, index) => (
                  <View key={index} style={styles.noteBox}>
                    <Text style={styles.noteText}>{note}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Cautions */}
            {cautions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vorsicht bei</Text>
                {cautions.map((caution, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bulletWarning}>⚠</Text>
                    <Text style={styles.listItemText}>{caution}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Contraindications */}
            {supplement.contraindications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kontraindikationen</Text>
                <View style={styles.warningBox}>
                  {supplement.contraindications.map((contra, index) => (
                    <Text key={index} style={styles.warningText}>• {contra}</Text>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function getSubstanceClassDisplayName(substanceClass: string): string {
  const displayNames: Record<string, string> = {
    'Aminosaeure_Derivat': 'Aminosäure-Derivat',
    'Protein': 'Protein',
    'Kreatin': 'Kreatin',
    'Vitamin': 'Vitamin',
    'Mineral_Spurenelement': 'Mineral / Spurenelement',
    'Fettsaeuren_Oel': 'Fettsäuren / Öl',
    'Pflanzenextrakt': 'Pflanzenextrakt',
    'Pilz': 'Pilz',
    'Probiotikum': 'Probiotikum',
    'Elektrolyt_Buffer_Osmolyte': 'Elektrolyt',
    'Hormon_Signalstoff': 'Hormon / Signalstoff',
    'Sonstiges': 'Sonstiges',
  };

  return displayNames[substanceClass] || substanceClass;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  icon: {
    fontSize: 40,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  substanceClass: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  tagText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: '#FFFFFF',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  bullet: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.bold,
  },
  bulletWarning: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.warning,
  },
  listItemText: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.md,
  },
  noteBox: {
    backgroundColor: theme.colors.surfaceSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info,
  },
  noteText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.md,
  },
  warningBox: {
    backgroundColor: '#FFF5E6',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  warningText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.md,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});
