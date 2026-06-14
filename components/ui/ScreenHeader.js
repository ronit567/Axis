import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../config/theme';

/**
 * Shared top header for the bottom-nav tab screens, so Saved / Messages /
 * Profile all read as the same app instead of three different ones. Same purple
 * + rounded-bottom tokens as the Home header (which stays bespoke because it
 * carries the greeting, avatar and search), and a left-aligned title to match
 * Home's greeting alignment.
 *
 * - `title`        — the screen name, left-aligned and white.
 * - `badgeCount`   — optional count shown as a white pill after the title.
 * - `onBack`/`embedded` — when reached as a tab (`embedded`) the bottom nav owns
 *   navigation, so no back arrow; otherwise an arrow calls `onBack`.
 * - `actionLabel`/`onAction` — optional right-aligned text button (e.g. Edit).
 * - `children`     — optional content below the title row (e.g. a search bar).
 */
export default function ScreenHeader({
  title,
  badgeCount = 0,
  onBack,
  embedded,
  actionLabel,
  onAction,
  children,
}) {
  const insets = useSafeAreaInsets();
  const showBack = !embedded && onBack;
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.back}
            hitSlop={8}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
        <View style={styles.spacer} />
        {actionLabel ? (
          <TouchableOpacity onPress={onAction} hitSlop={8} accessibilityLabel={actionLabel}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children ? <View style={styles.below}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
  },
  back: {
    marginRight: 12,
    marginLeft: -4,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.semibold,
    color: colors.onPrimary,
  },
  badge: {
    backgroundColor: colors.onPrimary,
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  spacer: {
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.onPrimary,
  },
  below: {
    marginTop: 16,
  },
});
