import React from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, Animated } from 'react-native';

export default function HomeScreen({ fadeAnim, homeTranslateX, onSignIn, onSignUp }) {
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateX: homeTranslateX }] }]}>
      <Image 
        source={require('../images/header.png')}
        style={styles.headerImage}
        resizeMode="cover"
      />
      <View style={styles.logoContainer}>
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
            onPress={onSignIn}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>Sign in  ›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.createAccountButton}
            onPress={onSignUp}
            activeOpacity={0.7}
          >
            <Text style={styles.createAccountText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
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
  homeButtonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
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
    fontFamily: 'Poppins_500Medium',
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
    fontFamily: 'Poppins_500Medium',
  },
});
