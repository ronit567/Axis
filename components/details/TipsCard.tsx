import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
export type Tip = { icon: IoniconName; text: string };

// Static advice lists shown at the bottom of a listing — safety tips to buyers,
// selling tips to the owner.
export const SAFETY_TIPS: Tip[] = [
  { icon: 'checkmark-circle', text: 'Meet in public places on campus' },
  { icon: 'checkmark-circle', text: 'Inspect items before paying' },
  { icon: 'checkmark-circle', text: 'Use secure payment methods' },
];
export const SELLER_TIPS: Tip[] = [
  { icon: 'camera', text: 'Add more photos to increase interest' },
  { icon: 'pricetag', text: 'Consider lowering price if no inquiries' },
  { icon: 'chatbubble', text: 'Respond quickly to buyers for better sales' },
];

type Props = {
  title: string;
  icon: IoniconName;
  accent: string;
  backgroundColor: string;
  tips: Tip[];
};

/** Tinted advice card with a header and a list of icon + text rows. */
export default function TipsCard({ title, icon, accent, backgroundColor, tips }: Props) {
  return (
    <View style={[styles.section, { backgroundColor }]}>
      <View style={styles.header}>
        <Ionicons name={icon} size={20} color={accent} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.list}>
        {tips.map((tip, i) => (
          <View key={i} style={styles.row}>
            <Ionicons name={tip.icon} size={16} color={accent} />
            <Text style={styles.text}>{tip.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
});
