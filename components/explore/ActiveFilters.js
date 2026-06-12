import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRICE_CAP } from './filters';

export default function ActiveFilters({
  filters,
  onUpdateFilters,
  onResetFilters,
  hideCategory = false,
}) {
  const showCategory = !hideCategory && filters.category !== 'All';
  const showCondition = filters.condition !== 'All';
  const showPrice = filters.minPrice > 0 || filters.maxPrice < PRICE_CAP;

  if (!showCategory && !showCondition && !showPrice) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {showCategory && (
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>{filters.category}</Text>
            <Pressable
              onPress={() => onUpdateFilters({ ...filters, category: 'All' })}
              hitSlop={8}
              accessibilityLabel={`Remove ${filters.category} filter`}
            >
              <Ionicons name="close" size={14} color="#502E82" />
            </Pressable>
          </View>
        )}
        {showCondition && (
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>{filters.condition}</Text>
            <Pressable
              onPress={() => onUpdateFilters({ ...filters, condition: 'All' })}
              hitSlop={8}
              accessibilityLabel={`Remove ${filters.condition} filter`}
            >
              <Ionicons name="close" size={14} color="#502E82" />
            </Pressable>
          </View>
        )}
        {showPrice && (
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>
              ${filters.minPrice}–{filters.maxPrice >= PRICE_CAP ? `$${PRICE_CAP}+` : `$${filters.maxPrice}`}
            </Text>
            <Pressable
              onPress={() => onUpdateFilters({ ...filters, minPrice: 0, maxPrice: PRICE_CAP })}
              hitSlop={8}
              accessibilityLabel="Remove price filter"
            >
              <Ionicons name="close" size={14} color="#502E82" />
            </Pressable>
          </View>
        )}
        <Pressable style={styles.clearAllButton} onPress={onResetFilters} hitSlop={8}>
          <Text style={styles.clearAllText}>Clear all</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EAFA',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  filterText: {
    color: '#502E82',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  clearAllText: {
    color: '#502E82',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontFamily: 'Poppins_600SemiBold',
  },
});
