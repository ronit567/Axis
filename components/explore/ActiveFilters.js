import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

export default function ActiveFilters({
  filters,
  onUpdateFilters,
  onResetFilters,
}) {
  const activeFilterCount = [
    filters.category !== 'All',
    filters.condition !== 'All',
    filters.minPrice > 0 || filters.maxPrice < 100,
  ].filter(Boolean).length;

  if (activeFilterCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filters.category !== 'All' && (
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>{filters.category}</Text>
            <Pressable onPress={() => onUpdateFilters({ ...filters, category: 'All' })}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>
        )}
        {filters.condition !== 'All' && (
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>{filters.condition}</Text>
            <Pressable onPress={() => onUpdateFilters({ ...filters, condition: 'All' })}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>
        )}
        {(filters.minPrice > 0 || filters.maxPrice < 100) && (
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>
              ${filters.minPrice}-${filters.maxPrice}
            </Text>
            <Pressable
              onPress={() => onUpdateFilters({ ...filters, minPrice: 0, maxPrice: 100 })}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>
        )}
        <Pressable style={styles.clearAllButton} onPress={onResetFilters}>
          <Text style={styles.clearAllText}>Clear all</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  filterText: {
    color: '#B39BD5',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  closeIcon: {
    color: '#B39BD5',
    fontSize: 14,
    fontWeight: '600',
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearAllText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'Poppins_600SemiBold',
  },
});
