import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/**
 * Standard mobile screen transitions, following platform conventions
 * (Material motion patterns / iOS HIG):
 *
 * - 'push'  — drill into a child screen: slides in from the right.
 * - 'pop'   — back to a parent screen: slides in from the left.
 * - 'modal' — compose/task flow: slides up from the bottom like a sheet.
 * - 'tab'   — peer destinations (bottom nav): fade-through in place
 *             (fade in + slight scale-up, no lateral motion).
 * - 'none'  — render in place with no animation.
 *
 * Key the wrapper per screen so remounting replays the transition.
 */
const TRANSITIONS = {
  push: { translateX: SCREEN_W, translateY: 0, fade: false, scaleFrom: 1, duration: 300 },
  pop: { translateX: -SCREEN_W, translateY: 0, fade: false, scaleFrom: 1, duration: 300 },
  modal: { translateX: 0, translateY: SCREEN_H, fade: false, scaleFrom: 1, duration: 320 },
  tab: { translateX: 0, translateY: 0, fade: true, scaleFrom: 0.96, duration: 220 },
};

export default function ScreenTransition({ children, style, type = 'none' }) {
  const config = TRANSITIONS[type];
  const anim = useRef(new Animated.Value(config ? 0 : 1)).current;

  useEffect(() => {
    if (!config) return;
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: config.duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, []);

  if (!config) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  const transform = [];
  if (config.translateX !== 0) {
    transform.push({
      translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [config.translateX, 0] }),
    });
  }
  if (config.translateY !== 0) {
    transform.push({
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [config.translateY, 0] }),
    });
  }
  if (config.scaleFrom !== 1) {
    transform.push({
      scale: anim.interpolate({ inputRange: [0, 1], outputRange: [config.scaleFrom, 1] }),
    });
  }

  return (
    <Animated.View style={[style, { opacity: config.fade ? anim : 1, transform }]}>
      {children}
    </Animated.View>
  );
}
