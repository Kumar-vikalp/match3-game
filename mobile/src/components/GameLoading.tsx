import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

interface Props {
  width: number;
  height: number;
}

export default function GameLoading({ width, height }: Props) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.linear }),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate.value * 360}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={[styles.container, { width, height }]}>
      <Animated.View style={[styles.gemWrap, animStyle]}>
        <Image
          source={require("../../assets/gems/purple.png")}
          style={styles.gem}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.label}>LOADING</Text>
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} delay={i * 250} />
        ))}
      </View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style, { marginLeft: delay > 0 ? 6 : 0 }]} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a0b2e",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  gemWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  gem: { width: 64, height: 64 },
  label: {
    color: "rgba(167, 139, 250, 0.8)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 4,
    marginTop: 18,
  },
  dotsRow: { flexDirection: "row", marginTop: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#a855f7",
  },
});
