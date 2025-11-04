import React from 'react';
import { StyleSheet, View, Image, ScrollView, Animated } from 'react-native';

export default function MainHomeScreen({ fadeAnim, slideTranslateX }) {
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateX: slideTranslateX }] }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Image 
          source={require('../images/homepage_header.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
        
        <View style={styles.contentContainer}>
          {/* Content will be added here later */}
        </View>
      </ScrollView>
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
  headerImage: {
    width: '100%',
    height: 250,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
  },
});
