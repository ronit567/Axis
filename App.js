import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useFonts, HammersmithOne_400Regular } from '@expo-google-fonts/hammersmith-one';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import HomeScreen from './screens/HomeScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [program, setProgram] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [socials, setSocials] = useState('');
  const [aboutYou, setAboutYou] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  let [fontsLoaded] = useFonts({
    HammersmithOne_400Regular,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    if (currentScreen === 'signin' || currentScreen === 'signup' || currentScreen === 'profileSetup') {
      // Slide in from right and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
    }
  }, [currentScreen]);

  const navigateToSignIn = () => {
    // Fade out current screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen('signin');
    });
  };

  const navigateToSignUp = () => {
    // Fade out current screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen('signup');
    });
  };

  const navigateToHome = () => {
    // Slide out and fade out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentScreen('home');
      fadeAnim.setValue(1);
    });
  };

  const navigateToProfileSetup = () => {
    // Fade out current screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen('profileSetup');
    });
  };

  const navigateBackToSignUp = () => {
    // Go back to signup screen from profile setup
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen('signup');
    });
  };

  const handleProfileComplete = () => {
    // Handle profile completion - for now just go back to home
    // You can add your own logic here (e.g., navigate to main app, save data, etc.)
    navigateToHome();
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const homeTranslateX = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const signInTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1000, 0],
  });

  // Render appropriate screen based on current state

  if (currentScreen === 'home') {
    return (
      <HomeScreen 
        fadeAnim={fadeAnim}
        homeTranslateX={homeTranslateX}
        onSignIn={navigateToSignIn}
        onSignUp={navigateToSignUp}
      />
    );
  } else if (currentScreen === 'signin') {
    return (
      <SignInScreen 
        fadeAnim={fadeAnim}
        signInTranslateX={signInTranslateX}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onBack={navigateToHome}
      />
    );
  } else if (currentScreen === 'signup') {
    return (
      <SignUpScreen 
        fadeAnim={fadeAnim}
        signInTranslateX={signInTranslateX}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        onBack={navigateToHome}
        onContinue={navigateToProfileSetup}
      />
    );
  } else {
    return (
      <ProfileSetupScreen 
        fadeAnim={fadeAnim}
        signInTranslateX={signInTranslateX}
        firstName={firstName}
        program={program}
        setProgram={setProgram}
        yearOfStudy={yearOfStudy}
        setYearOfStudy={setYearOfStudy}
        socials={socials}
        setSocials={setSocials}
        aboutYou={aboutYou}
        setAboutYou={setAboutYou}
        onBack={navigateBackToSignUp}
        onContinue={handleProfileComplete}
      />
    );
  }
}
