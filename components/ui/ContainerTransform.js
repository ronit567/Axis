import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const ENTER_DURATION = 340;
const EXIT_DURATION = 260;

/**
 * Overlay transition that handles BOTH the open and the close, so drill-in
 * screens animate in and back out instead of popping off instantly.
 *
 * Types:
 * - 'expand' — container transform: the screen grows out of the tapped
 *              element's on-screen rect (`origin`) and collapses back into it
 *              on close. This is what makes tapping a listing card / message
 *              row feel like the thing itself is opening. Falls back to 'push'
 *              when no `origin` was measured.
 * - 'modal'  — compose/task sheet: slides up from the bottom, slides back down.
 * - 'push'   — generic drill-in: slides in from the right, back out to the right.
 *
 * Lifecycle: mounts → plays the enter animation. When the parent flips
 * `closing` to true, it plays the reverse and calls `onClosed` so the parent
 * can finally swap navigation state and unmount us. Key the element per screen
 * so a new screen remounts and replays the enter.
 */
export default function ContainerTransform({
  children,
  style,
  type = 'none',
  origin = null,
  closing = false,
  onClosed,
}) {
  // Capture the entry config once. While closing, the parent may change its
  // nav state (and thus these props); freezing them keeps the exit animating
  // from the same geometry it entered with, never flipping direction mid-flight.
  const cfg = useRef({ type, origin }).current;
  const progress = useRef(new Animated.Value(cfg.type === 'none' ? 1 : 0)).current;

  useEffect(() => {
    if (cfg.type === 'none') return;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: ENTER_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    if (!closing || cfg.type === 'none') {
      if (closing && cfg.type === 'none') onClosed && onClosed();
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: EXIT_DURATION,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(() => onClosed && onClosed());
    return () => anim.stop();
  }, [closing]);

  if (cfg.type === 'none') {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  const expanding = cfg.type === 'expand' && cfg.origin;
  let transform = [];
  let opacity = 1;

  if (expanding) {
    const { x, y, width, height } = cfg.origin;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    // Scale is about the view's own centre, so translating the centre onto the
    // origin rect's centre lines the shrunken screen up exactly over the card.
    transform = [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [centerX - SCREEN_W / 2, 0],
        }),
      },
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [centerY - SCREEN_H / 2, 0],
        }),
      },
      {
        scaleX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [Math.max(width / SCREEN_W, 0.01), 1],
        }),
      },
      {
        scaleY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [Math.max(height / SCREEN_H, 0.01), 1],
        }),
      },
    ];
    // Content fades in over the first third of the growth (and back out at the
    // tail of the collapse) so the squished-then-stretched frames never read.
    opacity = progress.interpolate({
      inputRange: [0, 0.32, 1],
      outputRange: [0, 1, 1],
    });
  } else if (cfg.type === 'modal') {
    transform = [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [SCREEN_H, 0],
        }),
      },
    ];
  } else {
    // push, or expand with no measured origin
    transform = [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [SCREEN_W, 0],
        }),
      },
    ];
  }

  return <Animated.View style={[style, { opacity, transform }]}>{children}</Animated.View>;
}
