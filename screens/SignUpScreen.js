import React from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, Animated } from 'react-native';

export default function SignUpScreen({ 
  fadeAnim, 
  signInTranslateX, 
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email, 
  setEmail, 
  password, 
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onBack 
}) {
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
          {/* Logo */}
          <View style={styles.signUpIconContainer}>
            <Image 
              source={require('../images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.signUpContentContainer}>
            <Text style={styles.signUpTitle}>Sign Up</Text>
            
            <View style={styles.signUpFormContainer}>
              {/* First Name and Last Name Row */}
              <View style={styles.nameRow}>
                <View style={styles.nameInputContainer}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.nameInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder=""
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.nameInputContainer}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.nameInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder=""
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>
              
              {/* Email */}
              <Text style={styles.inputLabel}>Your email address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder=""
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              
              {/* Password */}
              <Text style={styles.inputLabel}>Choose a password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder=""
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              
              {/* Confirm Password */}
              <Text style={styles.inputLabel}>Confirm password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder=""
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
            
            {/* Buttons Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.signUpBackButton}
                onPress={onBack}
              >
                <Text style={styles.backButtonText}>‹  Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.signUpContinueButton}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  signUpIconContainer: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 10,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  signUpContentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: -30,
  },
  signUpTitle: {
    fontSize: 48,
    fontFamily: 'HammersmithOne_400Regular',
    color: '#4b307d',
    marginBottom: 5,
  },
  signUpFormContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameInputContainer: {
    width: '48%',
  },
  nameInput: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#4b307d',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'HammersmithOne_400Regular',
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
    marginBottom: 5,
    marginTop: 5,
    paddingLeft: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#4b307d',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'HammersmithOne_400Regular',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  signUpContinueButton: {
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
  signUpBackButton: {
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
});
