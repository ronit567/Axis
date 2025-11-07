import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { useFonts, HammersmithOne_400Regular } from '@expo-google-fonts/hammersmith-one';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import HomeScreen from './screens/HomeScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import MainHomeScreen from './screens/MainHomeScreen';
import { getCurrentSession, getCurrentUser, getUserProfile, signUp } from './services/authService';

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
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  let [fontsLoaded] = useFonts({
    HammersmithOne_400Regular,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  // Check for existing session on app load
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const { session } = await getCurrentSession();
      
      if (session?.user) {
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser);
        
        // Fetch user profile
        const { profile } = await getUserProfile(currentUser.id);
        if (profile) {
          setUserProfile(profile);
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          setEmail(profile.email || '');
          setProgram(profile.program || '');
          setYearOfStudy(profile.year_of_study || '');
          setAboutYou(profile.bio || '');
          setCurrentScreen('mainhome');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const navigateToMainHome = () => {
    // Navigate to the main home screen after login/signup
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen('mainhome');
    });
  };

  const handleProfileComplete = async () => {
    // Create account with Supabase if user doesn't exist yet
    if (!user) {
      setIsLoading(true);
      try {
        const { user: newUser, error } = await signUp(email, password, {
          firstName,
          lastName,
          program,
          yearOfStudy,
          bio: aboutYou,
          phoneNumber: socials,
        });

        if (error) {
          console.error('Signup error:', error);
          
          // Handle specific error cases
          if (error.code === 'user_already_exists') {
            alert('This email is already registered. Please sign in instead.');
          } else if (error.message?.includes('already registered')) {
            alert('This email is already registered. Please sign in instead.');
          } else {
            alert(error.message || 'Failed to create account. Please try again.');
          }
          
          setIsLoading(false);
          return;
        }

        if (!newUser) {
          alert('Failed to create account. Please try again.');
          setIsLoading(false);
          return;
        }

        setUser(newUser);
        // Profile is created/updated in signUp function
      } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during signup. Please try again.');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }
    
    // Navigate to main home screen after profile setup
    navigateToMainHome();
  };

  const handleAuthSuccess = (userData, profileData) => {
    setUser(userData);
    setUserProfile(profileData);
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4b307d" />
        <Text style={{ marginTop: 10, fontFamily: 'Poppins_400Regular', color: '#4b307d' }}>Loading...</Text>
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
        onSignIn={navigateToMainHome}
        onAuthSuccess={handleAuthSuccess}
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
        onAuthSuccess={handleAuthSuccess}
      />
    );
  } else if (currentScreen === 'profileSetup') {
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
        user={user}
        onBack={navigateBackToSignUp}
        onContinue={handleProfileComplete}
      />
    );
  } else if (currentScreen === 'mainhome') {
    return <MainHomeScreen firstName={firstName} />;
  }
}
