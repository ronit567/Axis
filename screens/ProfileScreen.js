import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen({ userProfile, onBack, onLogout, onProfileUpdate }) {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'editProfile', 'settings'

  const firstName = userProfile?.first_name || 'First';
  const lastName = userProfile?.last_name || 'Last';
  const email = userProfile?.email || 'myemail@gmail.com';

  const handleChangeProfile = () => {
    setCurrentView('editProfile');
  };

  const handleSettings = () => {
    setCurrentView('settings');
  };

  const handleLogOut = () => {
    onLogout();
  };

  // Render Edit Profile Screen
  if (currentView === 'editProfile') {
    return (
      <EditProfileView
        userProfile={userProfile}
        onBack={() => setCurrentView('main')}
        onProfileUpdate={onProfileUpdate}
      />
    );
  }

  // Render Settings Screen
  if (currentView === 'settings') {
    return (
      <SettingsView
        userProfile={userProfile}
        onBack={() => setCurrentView('main')}
        onLogout={onLogout}
      />
    );
  }

  // Main Profile View
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Purple Header Section */}
      <View style={styles.purpleHeader}>
        <Text style={styles.headerTitle}>Profile</Text>
        
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar} />
        </View>
        
        {/* Name and Email */}
        <Text style={styles.nameText}>{firstName} {lastName}</Text>
        <Text style={styles.emailText}>{email}</Text>
      </View>

      {/* White Content Section */}
      <View style={styles.whiteContent}>
        {/* Three Icon Buttons */}
        <View style={styles.iconButtonsRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={32} color="#000000" />
            <Text style={styles.iconButtonLabel}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="people-outline" size={32} color="#000000" />
            <Text style={styles.iconButtonLabel}>Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="document-text-outline" size={32} color="#000000" />
            <Text style={styles.iconButtonLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={handleChangeProfile}>
            <View style={styles.menuButtonContent}>
              <Ionicons name="person" size={24} color="#000000" />
              <Text style={styles.menuButtonText}>Change My Profile</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={handleSettings}>
            <View style={styles.menuButtonContent}>
              <Ionicons name="menu" size={24} color="#000000" />
              <Text style={styles.menuButtonText}>Settings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={handleLogOut}>
            <View style={styles.menuButtonContent}>
              <MaterialIcons name="logout" size={24} color="#000000" />
              <Text style={styles.menuButtonText}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Edit Profile View Component
function EditProfileView({ userProfile, onBack, onProfileUpdate }) {
  const [firstName, setFirstName] = useState(userProfile?.first_name || '');
  const [lastName, setLastName] = useState(userProfile?.last_name || '');
  const [program, setProgram] = useState(userProfile?.program || '');
  const [yearOfStudy, setYearOfStudy] = useState(userProfile?.year_of_study || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    const { updateUserProfile } = require('../services/authService');
    
    setIsLoading(true);
    try {
      const updates = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        program: program.trim(),
        year_of_study: yearOfStudy.trim(),
        bio: bio.trim(),
      };

      const { profile, error } = await updateUserProfile(userProfile.id, updates);

      if (error) {
        alert('Failed to update profile. Please try again.');
      } else {
        alert('Profile updated successfully!');
        if (onProfileUpdate) {
          onProfileUpdate(profile);
        }
        onBack();
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.editHeaderTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.editContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>First Name</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>{firstName || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>{lastName || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>{userProfile?.email || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Program</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>{program || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Year of Study</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>{yearOfStudy || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>About Me</Text>
          <View style={[styles.inputContainer, styles.bioContainer]}>
            <Text style={styles.inputText}>{bio || 'Not set'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={onBack}>
          <Text style={styles.saveButtonText}>Back to Profile</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Settings View Component
function SettingsView({ userProfile, onBack, onLogout }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleChangePassword = () => {
    alert('Change Password functionality - Coming soon!');
  };

  const handleDeleteAccount = () => {
    alert('Are you sure you want to delete your account? This cannot be undone.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.editHeaderTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.settingsContent} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingsItem} onPress={handleChangePassword}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#502E82" />
              <Text style={styles.settingsItemText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={onLogout}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="log-out-outline" size={22} color="#502E82" />
              <Text style={styles.settingsItemText}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={handleDeleteAccount}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="trash-outline" size={22} color="#FF4444" />
              <Text style={[styles.settingsItemText, { color: '#FF4444' }]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // Main Profile View Styles
  purpleHeader: {
    backgroundColor: '#B39BD5',
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000000',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
  },
  nameText: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000000',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#4A4A4A',
  },
  whiteContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
  },
  iconButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  iconButton: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconButtonLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
    marginTop: 8,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#000000',
    marginLeft: 15,
  },
  
  // Edit Profile View Styles
  editHeader: {
    backgroundColor: '#B39BD5',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editHeaderTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  editContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#666666',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bioContainer: {
    minHeight: 100,
  },
  inputText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
  },
  saveButton: {
    backgroundColor: '#B39BD5',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  
  // Settings View Styles
  settingsContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginBottom: 15,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  settingsItemText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
  },
});
