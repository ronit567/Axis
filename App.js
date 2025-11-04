import React, { useState } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, TextInput } from 'react-native';
import { useFonts, HammersmithOne_400Regular } from '@expo-google-fonts/hammersmith-one';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  let [fontsLoaded] = useFonts({
    HammersmithOne_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const renderHomeScreen = () => (
    <View style={styles.container}>
      <Image 
        source={require('./images/header.png')}
        style={styles.headerImage}
        resizeMode="cover"
      />
      <View style={styles.logoContainer}>
        <Image 
          source={require('./images/grey_circle.png')}
          style={styles.greyCircle}
          resizeMode="contain"
        />
        <Image 
          source={require('./images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.contentContainer}>
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
        
        <View style={styles.homeButtonContainer}>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => {
              console.log('Sign in button pressed!');
              setCurrentScreen('signin');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>Sign in  ›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.createAccountButton}
            activeOpacity={0.7}
          >
            <Text style={styles.createAccountText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSignInScreen = () => (
    <View style={styles.container}>
      <Image 
        source={require('./images/header.png')}
        style={styles.headerImage}
        resizeMode="cover"
      />
      <View style={styles.logoContainer}>
        <Image 
          source={require('./images/grey_circle.png')}
          style={styles.greyCircle}
          resizeMode="contain"
        />
        <Image 
          source={require('./images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.contentContainer}>
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
        
        <View style={styles.signInButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentScreen('home')}
          >
            <Text style={styles.backButtonText}>‹  Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return currentScreen === 'home' ? renderHomeScreen() : renderSignInScreen();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerImage: {
    width: '100%',
    height: 380,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  logoContainer: {
    position: 'absolute',
    top: 300,
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
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 60,
    fontFamily: 'HammersmithOne_400Regular',
    marginBottom: -5,
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
  homeButtonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  signInButtonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  signInButton: {
    backgroundColor: '#4b307d',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 15,
    width: 250,
    alignItems: 'center',
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'HammersmithOne_400Regular',
  },
  createAccountButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4b307d',
    width: 250,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#4b307d',
    fontSize: 16,
    fontFamily: 'HammersmithOne_400Regular',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginTop: -30,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'HammersmithOne_400Regular',
    color: '#000000',
    marginBottom: 8,
    marginTop: 15,
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
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4b307d',
    width: 160,
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#4b307d',
    fontSize: 18,
    fontFamily: 'HammersmithOne_400Regular',
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
    fontSize: 18,
    fontFamily: 'HammersmithOne_400Regular',
  },
});
