/**
 * Supplement Main Screen
 *
 * Main container for the supplement section with tab navigation
 * Handles the three main tabs:
 * 1. Stack - User's personal supplement stack
 * 2. Recommendations - Algorithm-based recommendations
 * 3. Blog - News and studies (coming soon)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../components/ui/theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { SupplementStackScreen } from './SupplementStackScreen';
import { SupplementRecommendationsScreen } from './SupplementRecommendationsScreen';
import { SupplementBlogScreen } from './SupplementBlogScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type TabId = 'stack' | 'recommendations' | 'blog';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'stack', label: 'Mein Stack' },
  { id: 'recommendations', label: 'Empfehlungen' },
  { id: 'blog', label: 'Blog' },
];

export function SupplementMainScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabId>('stack');
  const [stackRefreshKey, setStackRefreshKey] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  // Use ref to track current tab index for PanResponder
  const activeTabRef = useRef<TabId>('stack');

  // Keep ref in sync with state
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const animateToTab = useCallback((tabId: TabId) => {
    const index = TABS.findIndex(tab => tab.id === tabId);
    Animated.spring(translateX, {
      toValue: -index * SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, [translateX]);

  const switchToTab = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    animateToTab(tabId);
  }, [animateToTab]);

  // Pan responder for swipe gestures - uses ref to get current tab
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Only respond to horizontal gestures that are significant enough
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Use ref to get current tab index
        const currentIndex = TABS.findIndex(tab => tab.id === activeTabRef.current);
        const offset = -currentIndex * SCREEN_WIDTH;

        // Add boundaries to prevent over-scrolling
        let newTranslateX = offset + gestureState.dx;
        const minTranslate = -(TABS.length - 1) * SCREEN_WIDTH;
        const maxTranslate = 0;

        // Apply resistance at boundaries
        if (newTranslateX > maxTranslate) {
          newTranslateX = maxTranslate + (newTranslateX - maxTranslate) * 0.3;
        } else if (newTranslateX < minTranslate) {
          newTranslateX = minTranslate + (newTranslateX - minTranslate) * 0.3;
        }

        translateX.setValue(newTranslateX);
      },
      onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Use ref to get current tab index
        const currentIndex = TABS.findIndex(tab => tab.id === activeTabRef.current);

        if (gestureState.dx > SWIPE_THRESHOLD && currentIndex > 0) {
          // Swipe right - go to previous tab
          const newTab = TABS[currentIndex - 1].id;
          activeTabRef.current = newTab; // Update ref immediately
          setActiveTab(newTab);
          animateToIndex(currentIndex - 1);
        } else if (gestureState.dx < -SWIPE_THRESHOLD && currentIndex < TABS.length - 1) {
          // Swipe left - go to next tab
          const newTab = TABS[currentIndex + 1].id;
          activeTabRef.current = newTab; // Update ref immediately
          setActiveTab(newTab);
          animateToIndex(currentIndex + 1);
        } else {
          // Snap back to current tab
          animateToIndex(currentIndex);
        }
      },
    })
  ).current;

  // Helper function for animation by index (used by PanResponder)
  const animateToIndex = (index: number) => {
    Animated.spring(translateX, {
      toValue: -index * SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  const handleNavigateToRecommendations = () => {
    switchToTab('recommendations');
  };

  const handleNavigateToAllSupplements = () => {
    navigation.navigate('AllSupplements' as never);
  };

  const handleStackChanged = () => {
    setStackRefreshKey(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Logo left, Profile right */}
      <AppHeader />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => switchToTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Container with Swipe */}
      <View style={styles.contentContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.contentSlider,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {/* Tab 1: Stack */}
          <View style={styles.tabContent}>
            <SupplementStackScreen
              onNavigateToRecommendations={handleNavigateToRecommendations}
              refreshKey={stackRefreshKey}
            />
          </View>

          {/* Tab 2: Recommendations */}
          <View style={styles.tabContent}>
            <SupplementRecommendationsScreen
              onNavigateToAllSupplements={handleNavigateToAllSupplements}
              onStackChanged={handleStackChanged}
            />
          </View>

          {/* Tab 3: Blog */}
          <View style={styles.tabContent}>
            <SupplementBlogScreen />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  contentSlider: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * TABS.length,
    height: '100%',
  },
  tabContent: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
