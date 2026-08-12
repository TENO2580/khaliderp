import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export default function SkeletonList({ rows = 5 }: { rows?: number }) {
  const animatedValue = useRef(new Animated.Value(0.3)).current;
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    ).start();
  }, [animatedValue]);

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.row}>
          <Animated.View style={[styles.skeletonBlock, { width: 40, height: 40, borderRadius: 20, opacity: animatedValue }]} />
          <View style={styles.columnWrapper}>
            <Animated.View style={[styles.skeletonBlock, { width: '40%', opacity: animatedValue }]} />
            <Animated.View style={[styles.skeletonBlock, { width: '70%', height: 12, marginTop: 8, opacity: animatedValue }]} />
          </View>
          <Animated.View style={[styles.skeletonBlock, { width: 60, opacity: animatedValue }]} />
        </View>
      ))}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  columnWrapper: {
    flex: 1,
    marginLeft: 16,
  },
  skeletonBlock: {
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 8,
  },
});
