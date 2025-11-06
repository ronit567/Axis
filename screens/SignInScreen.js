import React, { useState } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, Animated, ActivityIndicator } from 'react-native';
import { signIn, getUserProfile } from '../services/authService';
import ErrorModal from '../components/ErrorModal';

export default function SignInScreen({ 
  fadeAnim, 
  signInTranslateX, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  onBack,
  onSignIn,
  onAuthSuccess
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleBack = () => {
    // Clear password and reset state before going back
    setPassword('');
    setIsLoading(false);
    setShowErrorModal(false);
    setErrorMessage('');
    onBack();
  };

  const handleSignIn = async () => {
    // Validate inputs
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      setShowErrorModal(true);
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const { user, session, error } = await signIn(email, password);

      if (error) {
        console.error('Sign in error:', error);
        let message = 'Failed to sign in. Please check your credentials.';
        
        if (error.message?.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please try again.';
        } else if (error.message?.includes('Email not confirmed')) {
          message = 'Please verify your email address before signing in.';
        }
        
        setErrorMessage(message);
        setShowErrorModal(true);
        setIsLoading(false);
        return;
      }

      if (user) {
        // Fetch user profile
        const { profile } = await getUserProfile(user.id);
        
        if (onAuthSuccess) {
          onAuthSuccess(user, profile);
        }
        
        // Navigate to main home
        onSignIn();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setErrorMessage('An error occurred during sign in. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
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
          <Image 
            source={require('../images/header.png')}
            style={styles.headerImageSignIn}
            resizeMode="cover"
          />
          <View style={styles.logoContainerSignIn}>
            <Image 
              source={require('../images/grey_circle.png')}
              style={styles.greyCircle}
              resizeMode="contain"
            />
            <Image 
              source={require('../images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.contentContainerSignIn}>
            <Text style={styles.title}>
              <Text style={styles.titlePurple}>A</Text>
              <Text style={styles.titleBlack}>x</Text>
              <Text style={styles.titlePurple}>i</Text>
              <Text style={styles.titleBlack}>s</Text>
            </Text>
            
            <Text style={styles.tagline}>
              <Text style={styles.taglinePurple}>Shop</Text>
              <Text style={styles.taglineBlack}> and </Text>
              <Text style={styles.taglinePurple}>sell</Text>
              <Text style={styles.taglineBlack}> easily—just for your school community</Text>
            </Text>
            
            <View style={styles.formContainer}>
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
              
              <Text style={styles.inputLabel}>Choose a password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder=""
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
            
            <View style={styles.signInButtonContainerForm}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBack}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>‹  Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.continueButton, isLoading && styles.buttonDisabled]}
                onPress={handleSignIn}
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
        title="Sign In Error"
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
  },
  headerImageSignIn: {
    width: '100%',
    height: 200,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  logoContainerSignIn: {
    position: 'absolute',
    top: 130,
    alignSelf: 'center',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greyCircle: {
    width: 200,
    height: 200,
    position: 'absolute',
  },
  logo: {
    width: 120,
    height: 120,
  },
  contentContainerSignIn: {
    alignItems: 'center',
    marginTop: 85,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 60,
    fontFamily: 'HammersmithOne_400Regular',
    marginBottom: -10,
  },
  titlePurple: {
    color: '#4b307d',
  },
  titleBlack: {
    color: '#000000',
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'HammersmithOne_400Regular',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 15,
  },
  taglinePurple: {
    color: '#4b307d',
  },
  taglineBlack: {
    color: '#000000',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginTop: -25,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
    marginBottom: 6,
    marginTop: 10,
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
  },
  signInButtonContainerForm: {
    marginTop: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 160,
    alignItems: 'center',
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
