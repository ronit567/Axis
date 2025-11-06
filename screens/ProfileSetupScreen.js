import React, { useState } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, Animated, ActivityIndicator, Alert } from 'react-native';
import { signUp } from '../services/authService';
import ErrorModal from '../components/ErrorModal';

export default function ProfileSetupScreen({ 
  fadeAnim, 
  signInTranslateX, 
  firstName,
  program,
  setProgram,
  yearOfStudy,
  setYearOfStudy,
  socials,
  setSocials,
  aboutYou,
  setAboutYou,
  user,
  onBack,
  onContinue
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleContinue = async () => {
    // Validate required fields
    if (!program.trim()) {
      setErrorMessage('Please enter your program');
      setShowErrorModal(true);
      return;
    }

    if (!yearOfStudy.trim()) {
      setErrorMessage('Please enter your year of study');
      setShowErrorModal(true);
      return;
    }

    // If user already exists (from App.js state), just update profile
    if (user) {
      onContinue();
      return;
    }

    // Otherwise, this is a new signup - we'll handle it in App.js
    // For now, just proceed
    onContinue();
  };

  const handleBack = () => {
    // Reset state before going back
    setIsLoading(false);
    setShowErrorModal(false);
    setErrorMessage('');
    onBack();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateX: signInTranslateX }] }]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Profile Icon */}
          <View style={styles.profileIconContainer}>
            <Image 
              source={require('../images/grey_circle.png')}
              style={styles.greyCircle}
              resizeMode="contain"
            />
            <Image 
              source={require('../images/profile_icon.png')}
              style={[styles.profileIcon, { tintColor: '#B0B0B0' }]}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.contentContainer}>
            {/* Greeting */}
            <Text style={styles.greeting}>
              Hi <Text style={styles.greetingName}>{firstName || 'there'}</Text>!
            </Text>
            
            <View style={styles.formContainer}>
              {/* Program and Year Of Study Row */}
              <View style={styles.rowContainer}>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>Program?</Text>
                  <TextInput
                    style={styles.input}
                    value={program}
                    onChangeText={setProgram}
                    placeholder=""
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>Year Of Study</Text>
                  <TextInput
                    style={styles.input}
                    value={yearOfStudy}
                    onChangeText={setYearOfStudy}
                    placeholder=""
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>
              
              {/* Socials */}
              <Text style={styles.inputLabel}>Socials</Text>
              <TextInput
                style={styles.input}
                value={socials}
                onChangeText={setSocials}
                placeholder=""
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              
              {/* About You */}
              <Text style={styles.inputLabel}>About You</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={aboutYou}
                onChangeText={setAboutYou}
                placeholder=""
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
              />
            </View>
            
            {/* Buttons Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>‹  Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.continueButton, isLoading && styles.buttonDisabled]}
                onPress={handleContinue}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <ErrorModal 
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Validation Error"
        message={errorMessage}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  profileIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 45,
    marginBottom: 0,
    width: 200,
    height: 200,
    alignSelf: 'center',
  },
  greyCircle: {
    width: 200,
    height: 200,
    position: 'absolute',
  },
  profileIcon: {
    width: 100,
    height: 100,
    position: 'absolute',
    marginTop: -5,
    marginLeft: -8,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -30,
  },
  greeting: {
    fontSize: 36,
    fontFamily: 'HammersmithOne_400Regular',
    color: '#000000',
    marginBottom: 10,
  },
  greetingName: {
    color: '#4b307d',
    textDecorationLine: 'underline',
  },
  formContainer: {
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  halfInputContainer: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
    marginBottom: 5,
    paddingLeft: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#4b307d',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  textArea: {
    height: 120,
    paddingTop: 15,
    paddingBottom: 15,
    borderRadius: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4b307d',
    width: 140,
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#4b307d',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  continueButton: {
    backgroundColor: '#4b307d',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    width: 160,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
