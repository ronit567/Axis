import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Fades + slides its children in on mount. Wrap a screen (style={{flex: 1}})
 * for a soft screen transition, or a section with a `delay` to stagger
 * content reveals. Give it a `key` that changes (e.g. the screen name) to
 * replay the animation on navigation.
 */
export default function FadeInView({ children, style, delay = 0, slideFrom = 14, duration = 280 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [slideFrom, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
