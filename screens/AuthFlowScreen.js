import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TextInput,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthActions } from '@convex-dev/auth/react';
import { convex } from '../config/convex';
import { api } from '../convex/_generated/api';
import ErrorModal from '../components/ErrorModal';
import EmailValidationModal from '../components/EmailValidationModal';
import FadeInView from '../components/ui/FadeInView';
import PressableScale from '../components/ui/PressableScale';

// UX-only pre-check; the real gate is server-side in convex/auth.ts.
const isValidSchoolEmail = (email) => /^[A-Za-z0-9._%+-]+@uwo\.ca$/i.test(email.trim());

// How far the hero (purple header + logo circle) travels between the
// welcome layout and the compact form layout. The wordmark fades out
// entirely in form mode so the form gets that space. All transform-based so
// the whole move runs on the native driver as one continuous gesture.
const HEADER_SHIFT = -185;
const LOGO_SHIFT = -185;
const LOGO_SCALE = 0.62;
const TITLE_SHIFT = -140;

// Second stage when the keyboard opens: the header tucks up into a slim
// strip, the logo fades away, and the form rises into the freed space so
// the focused field stays visible above the keyboard.
const KB_HEADER_SHIFT = -110;
const KB_LOGO_SHIFT = -80;
const KB_FORM_SHIFT = -175;

/** Filled input with label, focus ring, and optional show/hide for passwords. */
function Field({ label, secure, half, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={[styles.fieldWrap, half && styles.fieldHalf]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, focused && styles.fieldBoxFocused]}>
        <TextInput
          style={styles.fieldInput}
          placeholderTextColor="#A79FB8"
          secureTextEntry={secure && !revealed}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
        />
        {secure && (
          <Pressable onPress={() => setRevealed(!revealed)} hitSlop={8}>
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#8E84A3"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** Two-segment progress bar for the sign-up steps. */
function StepDots({ step }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepSegment, styles.stepSegmentActive]} />
      <View style={[styles.stepSegment, step >= 2 && styles.stepSegmentActive]} />
      <Text style={styles.stepText}>Step {step} of 2</Text>
    </View>
  );
}

export default function AuthFlowScreen({
  email, setEmail,
  password, setPassword,
  firstName, setFirstName,
  lastName, setLastName,
  confirmPassword, setConfirmPassword,
  program, setProgram,
  yearOfStudy, setYearOfStudy,
  socials, setSocials,
  aboutYou, setAboutYou,
  isSigningUp,
  onSignedIn,
  onCompleteSignUp,
}) {
  const { signIn } = useAuthActions();

  // welcome | signin | signup | profileSetup — one screen, so the hero
  // pieces persist and animate between layouts instead of being remounted.
  const [mode, setMode] = useState('welcome');
  const isCompact = mode !== 'welcome';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  // 0 = welcome layout, 1 = compact form layout. The purple header, logo
  // circle, and wordmark all ride this one value, so they move together.
  const hero = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(hero, {
      toValue: isCompact ? 1 : 0,
      duration: 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [isCompact]);

  // 0 = keyboard hidden, 1 = keyboard up. Layers the second-stage shift on
  // top of the hero so typing always has room. iOS fires will* events (so we
  // animate alongside the keyboard); Android only fires did*.
  const kb = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const animateKb = (toValue) =>
      Animated.timing(kb, {
        toValue,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    const showSub = Keyboard.addListener(showEvent, () => animateKb(1));
    const hideSub = Keyboard.addListener(hideEvent, () => animateKb(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const goWelcome = () => {
    setPassword('');
    setConfirmPassword('');
    setMode('welcome');
  };

  const handleSignInSubmit = async () => {
    if (!email.trim()) return showError('Please enter your email address');
    if (!password) return showError('Please enter your password');

    setIsSubmitting(true);
    try {
      // Convex Auth: verifies credentials server-side and stores the session.
      await signIn('password', {
        flow: 'signIn',
        email: email.trim().toLowerCase(),
        password,
      });
      onSignedIn();
    } catch (error) {
      console.error('Sign in error:', error);
      showError('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpContinue = async () => {
    if (!firstName.trim()) return showError('Please enter your first name');
    if (!lastName.trim()) return showError('Please enter your last name');
    if (!email.trim()) return showError('Please enter your email address');
    if (!isValidSchoolEmail(email)) {
      setShowEmailModal(true);
      return;
    }
    if (!password) return showError('Please enter a password');
    // Must match the server rule in convex/auth.ts (Convex Auth's default
    // Password provider requires >= 8 chars).
    if (password.length < 8) return showError('Password must be at least 8 characters long');
    if (password !== confirmPassword) return showError('Passwords do not match');

    setIsSubmitting(true);
    let exists;
    try {
      exists = await convex.query(api.users.emailExists, { email });
    } catch (checkError) {
      console.error('Email check error:', checkError);
      showError('Unable to verify email. Please try again.');
      return;
    } finally {
      setIsSubmitting(false);
    }
    if (exists) {
      return showError('An account with this email already exists. Please sign in instead.');
    }

    setMode('profileSetup');
  };

  const handleProfileContinue = () => {
    if (!program.trim()) return showError('Please enter your program');
    if (!yearOfStudy.trim()) return showError('Please enter your year of study');
    onCompleteSignUp();
  };

  // Hero interpolations — hero drives the welcome ↔ form move, kb layers the
  // keyboard-stage shift on top (Animated.add keeps it all native-driven).
  const headerTranslate = Animated.add(
    hero.interpolate({ inputRange: [0, 1], outputRange: [0, HEADER_SHIFT] }),
    kb.interpolate({ inputRange: [0, 1], outputRange: [0, KB_HEADER_SHIFT] }),
  );
  const logoTranslate = Animated.add(
    hero.interpolate({ inputRange: [0, 1], outputRange: [0, LOGO_SHIFT] }),
    kb.interpolate({ inputRange: [0, 1], outputRange: [0, KB_LOGO_SHIFT] }),
  );
  const logoScale = hero.interpolate({ inputRange: [0, 1], outputRange: [1, LOGO_SCALE] });
  const logoOpacity = kb.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  // The wordmark only belongs to the welcome layout — it fades out as the
  // hero compacts so the form gets its space.
  const titleTranslate = hero.interpolate({ inputRange: [0, 1], outputRange: [0, TITLE_SHIFT] });
  const titleOpacity = hero.interpolate({ inputRange: [0, 0.35], outputRange: [1, 0], extrapolate: 'clamp' });
  const welcomeOpacity = hero.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' });
  const welcomeShift = hero.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const formOpacity = hero.interpolate({ inputRange: [0.45, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const formShift = Animated.add(
    hero.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }),
    kb.interpolate({ inputRange: [0, 1], outputRange: [0, KB_FORM_SHIFT] }),
  );
  const backFabShift = kb.interpolate({ inputRange: [0, 1], outputRange: [0, -26] });

  const submitting = isSubmitting || isSigningUp;

  return (
    <View style={styles.container}>
      {/* Purple header — slides up to its compact height in form modes */}
      <Animated.Image
        source={require('../images/header.png')}
        resizeMode="cover"
        style={[styles.headerImage, { transform: [{ translateY: headerTranslate }] }]}
      />

      {/* Logo circle — rides up with the header, shrinks in form mode, and
          fades away while the keyboard is up */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslate }, { scale: logoScale }],
          },
        ]}
      >
        <Image source={require('../images/grey_circle.png')} style={styles.greyCircle} resizeMode="contain" />
        <Image source={require('../images/logo.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      {/* Wordmark + tagline — welcome layout only; fades out as the hero
          compacts so the form gets its space */}
      <Animated.View
        style={[
          styles.titleBlock,
          { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
        ]}
        pointerEvents="none"
      >
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
      </Animated.View>

      {/* Floating back button over the compact header */}
      <Animated.View
        style={[styles.backFab, { opacity: hero, transform: [{ translateY: backFabShift }] }]}
        pointerEvents={isCompact ? 'auto' : 'none'}
      >
        <PressableScale
          style={styles.backFabButton}
          scaleTo={0.9}
          onPress={mode === 'profileSetup' ? () => setMode('signup') : goWelcome}
          disabled={submitting}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#4b307d" />
        </PressableScale>
      </Animated.View>

      {/* Welcome actions */}
      <Animated.View
        style={[
          styles.welcomeActions,
          { opacity: welcomeOpacity, transform: [{ translateY: welcomeShift }] },
        ]}
        pointerEvents={mode === 'welcome' ? 'auto' : 'none'}
      >
        <PressableScale style={styles.primaryButton} onPress={() => setMode('signin')}>
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </PressableScale>
        <PressableScale style={styles.ghostButton} onPress={() => setMode('signup')}>
          <Text style={styles.ghostButtonText}>Create an account</Text>
        </PressableScale>
      </Animated.View>

      {/* Form area — revealed by the hero sliding up */}
      <Animated.View
        style={[styles.formArea, { opacity: formOpacity, transform: [{ translateY: formShift }] }]}
        pointerEvents={isCompact ? 'auto' : 'none'}
      >
        <KeyboardAvoidingView
          style={styles.formFlex}
          behavior={Platform.OS === 'ios' ? undefined : 'height'}
        >
          <ScrollView
            style={styles.formFlex}
            contentContainerStyle={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            {mode === 'signin' && (
              <FadeInView key="signin">
                <Text style={styles.formTitle}>Welcome back</Text>
                <Text style={styles.formSubtitle}>Sign in to keep shopping and selling</Text>

                <Field
                  label="School email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@uwo.ca"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  secure
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignInSubmit}
                />

                <PressableScale
                  style={[styles.primaryButton, styles.formSubmit, submitting && styles.buttonDisabled]}
                  onPress={handleSignInSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign in</Text>
                  )}
                </PressableScale>

                <Pressable style={styles.switchLink} onPress={() => setMode('signup')} hitSlop={8}>
                  <Text style={styles.switchLinkText}>
                    New here? <Text style={styles.switchLinkAccent}>Create an account</Text>
                  </Text>
                </Pressable>
              </FadeInView>
            )}

            {mode === 'signup' && (
              <FadeInView key="signup">
                <Text style={styles.formTitle}>Create your account</Text>
                <StepDots step={1} />

                <View style={styles.fieldRow}>
                  <Field
                    label="First name"
                    half
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Alex"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  <Field
                    label="Last name"
                    half
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Chen"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
                <Field
                  label="School email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@uwo.ca"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  secure
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                <Field
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your password"
                  secure
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignUpContinue}
                />

                <PressableScale
                  style={[styles.primaryButton, styles.formSubmit, submitting && styles.buttonDisabled]}
                  onPress={handleSignUpContinue}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  )}
                </PressableScale>

                <Pressable style={styles.switchLink} onPress={() => setMode('signin')} hitSlop={8}>
                  <Text style={styles.switchLinkText}>
                    Already have an account? <Text style={styles.switchLinkAccent}>Sign in</Text>
                  </Text>
                </Pressable>
              </FadeInView>
            )}

            {mode === 'profileSetup' && (
              <FadeInView key="profileSetup">
                <Text style={styles.formTitle}>
                  Hi <Text style={styles.formTitleAccent}>{firstName || 'there'}</Text>!
                </Text>
                <StepDots step={2} />
                <Text style={styles.formSubtitle}>
                  Tell other students a bit about yourself
                </Text>

                <View style={styles.fieldRow}>
                  <Field
                    label="Program"
                    half
                    value={program}
                    onChangeText={setProgram}
                    placeholder="e.g. Engineering"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  <Field
                    label="Year of study"
                    half
                    value={yearOfStudy}
                    onChangeText={setYearOfStudy}
                    placeholder="e.g. 2"
                    returnKeyType="next"
                  />
                </View>
                <Field
                  label="Socials (optional)"
                  value={socials}
                  onChangeText={setSocials}
                  placeholder="@instagram, discord..."
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>About you (optional)</Text>
                  <View style={[styles.fieldBox, styles.fieldBoxMultiline]}>
                    <TextInput
                      style={[styles.fieldInput, styles.fieldInputMultiline]}
                      value={aboutYou}
                      onChangeText={setAboutYou}
                      placeholder="What are you into?"
                      placeholderTextColor="#A79FB8"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                <PressableScale
                  style={[styles.primaryButton, styles.formSubmit, submitting && styles.buttonDisabled]}
                  onPress={handleProfileContinue}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Finish &amp; start browsing</Text>
                  )}
                </PressableScale>
              </FadeInView>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      <EmailValidationModal
        visible={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={email}
      />
      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Hold on"
        message={errorMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 380,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  logoContainer: {
    position: 'absolute',
    top: 280,
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
  titleBlock: {
    position: 'absolute',
    top: 508,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 60,
    fontFamily: 'HammersmithOne_400Regular',
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
    marginTop: 2,
    paddingHorizontal: 35,
  },
  taglinePurple: {
    color: '#4b307d',
  },
  taglineBlack: {
    color: '#000000',
  },
  backFab: {
    position: 'absolute',
    top: 58,
    left: 20,
  },
  backFabButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  welcomeActions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4b307d',
    height: 54,
    borderRadius: 27,
    width: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#4b307d',
    width: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: '#4b307d',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  formArea: {
    position: 'absolute',
    top: 260,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  formFlex: {
    flex: 1,
  },
  formScroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 36,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F1B29',
  },
  formTitleAccent: {
    color: '#4b307d',
  },
  formSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#8E84A3',
    marginTop: 2,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 14,
  },
  stepSegment: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E3F1',
  },
  stepSegmentActive: {
    backgroundColor: '#4b307d',
  },
  stepText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#8E84A3',
    marginLeft: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldHalf: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#5C5470',
    marginBottom: 6,
    paddingLeft: 4,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2FA',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 52,
  },
  fieldBoxFocused: {
    borderColor: '#4b307d',
    backgroundColor: '#FFFFFF',
  },
  fieldBoxMultiline: {
    height: 110,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#1F1B29',
    paddingVertical: 0,
  },
  fieldInputMultiline: {
    height: '100%',
  },
  formSubmit: {
    width: '100%',
    marginTop: 8,
    marginBottom: 0,
  },
  switchLink: {
    alignSelf: 'center',
    marginTop: 16,
  },
  switchLinkText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#8E84A3',
  },
  switchLinkAccent: {
    color: '#4b307d',
    fontFamily: 'Poppins_600SemiBold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
