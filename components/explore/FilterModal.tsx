import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { PRICE_CAP, Filters } from './filters';
import PressableScale from '../ui/PressableScale';
import { haptics } from '../../config/haptics';

const { height: SCREEN_H } = Dimensions.get('window');

const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Clothing', 'Appliances', 'Other'];
const CONDITIONS = ['All', 'Like New', 'Good', 'Fair'];

type Props = {
  visible: boolean;
  filters: Filters;
  onClose: () => void;
  onUpdateFilters: (filters: Filters) => void;
  onResetFilters: () => void;
};

export default function FilterModal({
  visible,
  filters,
  onClose,
  onUpdateFilters,
  onResetFilters,
}: Props) {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onUpdateFilters({ ...filters, [key]: value });
  };

  // Light tap on discrete chip selections (not the continuous sliders).
  const selectFilter = (key: 'category' | 'condition', value: string) => {
    haptics.tap();
    updateFilter(key, value);
  };

  // A single-select row of filter pills bound to one filter key.
  const renderFilterChips = (filterKey: 'category' | 'condition', options: string[]) => (
    <View style={styles.filterOptions}>
      {options.map((option) => {
        const isSelected = filters[filterKey] === option;
        return (
          <Pressable
            key={option}
            style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
            onPress={() => selectFilter(filterKey, option)}
          >
            <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // Keep the sheet mounted through its exit so the close animation can play
  // before the native Modal unmounts.
  const [rendered, setRendered] = useState(visible);
  const backdrop = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // Spring gives the sheet a soft "pop"; clamped so it never overshoots
        // past its resting edge and leaves a gap at the bottom.
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 6,
          overshootClamping: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible]);

  if (!rendered) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Scrim fades in/out independently of the sheet's slide */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]} />
        {/* Tap outside the sheet to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close filters" />
        <Animated.View style={[styles.modalContent, { transform: [{ translateY }] }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
            >
              <Ionicons name="close" size={22} color="#502E82" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              {renderFilterChips('category', CATEGORIES)}
            </View>

            {/* Condition Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Condition</Text>
              {renderFilterChips('condition', CONDITIONS)}
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceLabel}>${filters.minPrice}</Text>
                <Text style={styles.priceLabel}>
                  {filters.maxPrice >= PRICE_CAP ? `$${PRICE_CAP}+` : `$${filters.maxPrice}`}
                </Text>
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Min</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={PRICE_CAP}
                  step={5}
                  value={filters.minPrice}
                  onValueChange={(value) => updateFilter('minPrice', value)}
                  minimumTrackTintColor="#B39BD5"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#B39BD5"
                />
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Max</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={PRICE_CAP}
                  step={5}
                  value={filters.maxPrice}
                  onValueChange={(value) => updateFilter('maxPrice', value)}
                  minimumTrackTintColor="#B39BD5"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#B39BD5"
                />
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <PressableScale style={styles.resetButton} onPress={onResetFilters}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </PressableScale>
            <PressableScale style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8F4',
  },
  modalTitle: {
    fontSize: 20,
    color: '#1F1B29',
    fontFamily: 'Poppins_600SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    color: '#1F1B29',
    marginBottom: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3F1',
  },
  filterOptionSelected: {
    backgroundColor: '#502E82',
    borderColor: '#502E82',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#4A4458',
    fontFamily: 'Poppins_500Medium',
  },
  filterOptionTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#502E82',
    fontFamily: 'Poppins_600SemiBold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    width: 30,
    fontFamily: 'Poppins_400Regular',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDE8F4',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3EFF9',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#502E82',
    fontFamily: 'Poppins_600SemiBold',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#502E82',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
});
