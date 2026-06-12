import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable with a springy scale-down on touch — makes cards and buttons
 * feel tactile instead of just dimming. A single animated element, so the
 * passed style keeps its layout semantics (flex, margins, shadows).
 */
export default function PressableScale({ children, style, scaleTo = 0.96, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 5,
    }).start();

  return (
    <AnimatedPressable
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      style={[style, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
