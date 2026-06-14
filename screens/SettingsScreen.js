import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import ScreenHeader from '../components/ui/ScreenHeader';

// Each row is a single setting; `value` shows a trailing summary (e.g. the
// signed-in email) and a missing `onPress` marks a not-yet-built placeholder.
const SECTIONS = [
  {
    title: 'Account',
    rows: [
      { key: 'email', icon: 'mail-outline', label: 'Email', valueKey: 'email' },
      { key: 'notifications', icon: 'notifications-outline', label: 'Notifications' },
      { key: 'privacy', icon: 'lock-closed-outline', label: 'Privacy & Safety' },
    ],
  },
  {
    title: 'Support',
    rows: [
      { key: 'help', icon: 'help-circle-outline', label: 'Help & Support' },
      { key: 'terms', icon: 'document-text-outline', label: 'Terms & Privacy Policy' },
      { key: 'about', icon: 'information-circle-outline', label: 'About Axis' },
    ],
  },
];

export default function SettingsScreen({ onBack, onLogout }) {
  const profile = useQuery(api.users.current);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  // Placeholder rows aren't wired up yet — say so rather than dead-tapping.
  const comingSoon = (label) =>
    Alert.alert(label, 'This feature is coming soon.');

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.rows.map((row, i) => (
                <TouchableOpacity
                  key={row.key}
                  style={[styles.row, i > 0 && styles.rowBorder]}
                  onPress={() => comingSoon(row.label)}
                  activeOpacity={0.6}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={row.icon} size={20} color="#502E82" />
                  </View>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  {row.valueKey && profile?.[row.valueKey] ? (
                    <Text style={styles.rowValue} numberOfLines={1}>
                      {profile[row.valueKey]}
                    </Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color="#C4BCD1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Axis · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 60,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#9B91A8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0ECF7',
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3EAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: '#333333',
  },
  rowValue: {
    maxWidth: 150,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#9B91A8',
    marginRight: 6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#D32F2F',
    marginLeft: 8,
  },
  version: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#C4BCD1',
    textAlign: 'center',
    marginTop: 24,
  },
});
