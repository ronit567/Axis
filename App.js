import React, { useState, useRef, useEffect } from 'react';
import { View, Animated, Easing, Platform } from 'react-native';
import { useFonts, HammersmithOne_400Regular } from '@expo-google-fonts/hammersmith-one';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import * as SecureStore from 'expo-secure-store';
import { convex } from './config/convex';
import { api } from './convex/_generated/api';
import HomeScreen from './screens/HomeScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import MainHomeScreen from './screens/MainHomeScreen';

// Sessions persist in the device keychain (fixes the old "signed out on every
// cold start" bug). SecureStore is native-only; on web Convex Auth falls back
// to its default storage.
const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

// Branded boot screen: the logo breathes while fonts/auth resolve. No text —
// custom fonts aren't guaranteed to be loaded yet at this point.
function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
      <Animated.Image
        source={require('./images/logo.png')}
        resizeMode="contain"
        style={{
          width: 110,
          height: 110,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
          transform: [
            { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.05] }) },
          ],
        }}
      />
    </View>
  );
}

export default function App() {
  return (
    <ConvexAuthProvider
      client={convex}
      storage={Platform.OS === 'ios' || Platform.OS === 'android' ? secureStorage : undefined}
    >
      <AppContent />
    </ConvexAuthProvider>
  );
}

function AppContent() {
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
  const [isSigningUp, setIsSigningUp] = useState(false);

  // One shared enter transition: every navigation swaps the screen
  // immediately and the new screen fades + slides in (from the right going
  // forward, from the left going back). No fade-to-blank phase — that
  // two-step fade-out/slide-in was what made the old flow feel choppy.
  const transition = useRef(new Animated.Value(1)).current;
  const directionRef = useRef(1); // 1 = forward, -1 = back

  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  // Reactive profile — updates everywhere the moment it changes.
  const profile = useQuery(api.users.current);

  let [fontsLoaded] = useFonts({
    HammersmithOne_400Regular,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  // Restored session on cold start → skip straight to the main screen.
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentScreen === 'home') {
      setCurrentScreen('mainhome');
    }
  }, [authLoading, isAuthenticated, currentScreen]);

  // Replay the enter animation whenever the screen changes.
  useEffect(() => {
    transition.setValue(0);
    const animation = Animated.timing(transition, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [currentScreen]);

  const navigate = (screen, direction = 1) => {
    directionRef.current = direction;
    setCurrentScreen(screen);
  };

  const navigateToSignIn = () => navigate('signin', 1);
  const navigateToSignUp = () => navigate('signup', 1);
  const navigateToHome = () => navigate('home', -1);
  const navigateToProfileSetup = () => navigate('profileSetup', 1);
  const navigateBackToSignUp = () => navigate('signup', -1);
  const navigateToMainHome = () => navigate('mainhome', 1);

  const handleProfileComplete = async () => {
    // New sign-up: one call creates the account AND the profile row — the
    // server (convex/auth.ts) builds the user doc from these params and
    // rejects non-@uwo.ca emails.
    if (!isAuthenticated) {
      setIsSigningUp(true);
      try {
        await signIn('password', {
          flow: 'signUp',
          email: email.trim().toLowerCase(),
          password,
          firstName,
          lastName,
          program,
          yearOfStudy,
          bio: aboutYou,
          phone: socials,
        });
      } catch (error) {
        console.error('Signup error:', error);
        const detail = typeof error?.data === 'string' ? error.data : error?.message || '';
        if (detail.includes('already exists')) {
          alert('This email is already registered. Please sign in instead.');
        } else if (detail.includes('@uwo.ca')) {
          alert(detail);
        } else {
          alert('Failed to create account. Please try again.');
        }
        return;
      } finally {
        setIsSigningUp(false);
      }
    }

    // Navigate to main home screen after profile setup
    navigateToMainHome();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setConfirmPassword('');
      setProgram('');
      setYearOfStudy('');
      setSocials('');
      setAboutYou('');
      setCurrentScreen('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!fontsLoaded || authLoading || isSigningUp) {
    return <LoadingScreen />;
  }

  // Enter offset: 48px from the direction of travel, settling to 0.
  const enterTranslateX = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [directionRef.current * 48, 0],
  });
  const fadeAnim = transition;
  const homeTranslateX = enterTranslateX;
  const signInTranslateX = enterTranslateX;

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
        user={profile}
        onBack={navigateBackToSignUp}
        onContinue={handleProfileComplete}
      />
    );
  } else if (currentScreen === 'mainhome') {
    // Only render MainHomeScreen if user is authenticated
    if (!isAuthenticated) {
      // User is not authenticated, redirect to home
      setCurrentScreen('home');
      return (
        <HomeScreen
          fadeAnim={fadeAnim}
          homeTranslateX={homeTranslateX}
          onSignIn={navigateToSignIn}
          onSignUp={navigateToSignUp}
        />
      );
    }
    return (
      <MainHomeScreen
        firstName={profile?.firstName ?? firstName}
        onLogout={handleLogout}
        userId={profile?._id}
      />
    );
  }
}
