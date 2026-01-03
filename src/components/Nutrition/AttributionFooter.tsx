/**
 * Attribution Footer Component
 * Displays Open Food Facts attribution as required by ODbL license
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionTheme } from '../../constants/nutritionTheme';

interface AttributionFooterProps {
  compact?: boolean;
}

export function AttributionFooter({ compact = false }: AttributionFooterProps) {
  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactText}>
          Data from{' '}
          <Text
            style={styles.link}
            onPress={() => handleOpenLink('https://openfoodfacts.org')}
          >
            Open Food Facts
          </Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="information-circle" size={24} color={nutritionTheme.colors.protein} />
        <Text style={styles.title}>Data Attribution</Text>
      </View>

      <Text style={styles.description}>
        Nutritional data is provided by{' '}
        <Text
          style={styles.link}
          onPress={() => handleOpenLink('https://openfoodfacts.org')}
        >
          Open Food Facts
        </Text>
        , a collaborative, free and open database of food products from around the world.
      </Text>

      <View style={styles.licenseContainer}>
        <Text style={styles.licenseText}>
          This data is available under the{' '}
          <Text
            style={styles.link}
            onPress={() => handleOpenLink('https://opendatacommons.org/licenses/odbl/1.0/')}
          >
            Open Database License (ODbL)
          </Text>
          .
        </Text>
      </View>

      <View style={styles.linksContainer}>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleOpenLink('https://world.openfoodfacts.org/discover')}
          accessibilityLabel="Learn more about Open Food Facts"
        >
          <Ionicons name="globe" size={16} color={nutritionTheme.colors.protein} />
          <Text style={styles.linkButtonText}>Learn More</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleOpenLink('https://world.openfoodfacts.org/contribute')}
          accessibilityLabel="Contribute to Open Food Facts"
        >
          <Ionicons name="add-circle" size={16} color={nutritionTheme.colors.protein} />
          <Text style={styles.linkButtonText}>Contribute</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>🍊 Open Food Facts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: nutritionTheme.colors.cardBackground,
    borderRadius: nutritionTheme.borderRadius.lg,
    padding: nutritionTheme.spacing.md,
    marginVertical: nutritionTheme.spacing.md,
    ...nutritionTheme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nutritionTheme.spacing.sm,
    marginBottom: nutritionTheme.spacing.md,
  },
  title: {
    ...nutritionTheme.typography.h3,
    fontSize: 18,
  },
  description: {
    ...nutritionTheme.typography.body,
    color: nutritionTheme.colors.divider,
    marginBottom: nutritionTheme.spacing.md,
    lineHeight: 22,
  },
  link: {
    color: nutritionTheme.colors.protein,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  licenseContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: nutritionTheme.borderRadius.sm,
    padding: nutritionTheme.spacing.sm,
    marginBottom: nutritionTheme.spacing.md,
  },
  licenseText: {
    ...nutritionTheme.typography.caption,
    color: nutritionTheme.colors.divider,
  },
  linksContainer: {
    flexDirection: 'row',
    gap: nutritionTheme.spacing.sm,
    marginBottom: nutritionTheme.spacing.md,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: nutritionTheme.spacing.xs,
    backgroundColor: `${nutritionTheme.colors.protein}15`,
    borderRadius: nutritionTheme.borderRadius.md,
    paddingVertical: nutritionTheme.spacing.sm,
  },
  linkButtonText: {
    ...nutritionTheme.typography.caption,
    color: nutritionTheme.colors.protein,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: nutritionTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: nutritionTheme.colors.divider,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactContainer: {
    paddingVertical: nutritionTheme.spacing.sm,
    alignItems: 'center',
  },
  compactText: {
    ...nutritionTheme.typography.caption,
    color: nutritionTheme.colors.divider,
  },
});
