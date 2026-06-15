import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from '../ui/PressableScale';
import { haptics } from '../../config/haptics';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onSell: () => void;
};

/** Persistent bottom tab bar with the centre "sell" button. */
export default function BottomNav({ activeTab, onNavigate, onSell }: Props) {
  const insets = useSafeAreaInsets();

  const renderNavItem = (
    key: string,
    label: string,
    activeIcon: IoniconName,
    inactiveIcon: IoniconName,
  ) => {
    const active = activeTab === key;
    return (
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (!active) haptics.tap();
          onNavigate(key);
        }}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
      >
        <Ionicons
          name={active ? activeIcon : inactiveIcon}
          size={26}
          color={active ? '#502E82' : '#999999'}
        />
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
      {renderNavItem('home', 'Home', 'home', 'home-outline')}
      {renderNavItem('saved', 'Saved', 'heart', 'heart-outline')}
      <PressableScale style={styles.sellButton} scaleTo={0.88} onPress={onSell}>
        <View style={styles.addButtonCircle}>
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </View>
      </PressableScale>
      {renderNavItem('messagesList', 'Messages', 'chatbubble-ellipses', 'chatbubble-ellipses-outline')}
      {renderNavItem('profile', 'Profile', 'person', 'person-outline')}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0ECF7',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  navLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#502E82',
    fontFamily: 'Poppins_500Medium',
  },
  sellButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    marginTop: -30,
  },
  addButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B39BD5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
