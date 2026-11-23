import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Post } from "../services/postsService";
import { Avatar, colorFor } from "./Avatar";
import { Confetti } from "./Confetti";
import { GiftBox } from "./GiftBox";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface GiftCardProps {
  post: Post;
  size: number;
  /** Un autre cadeau est en cours d'ouverture : celui-ci est bloqué */
  disabled?: boolean;
  /** Afficher les confettis (premier cadeau du jour) */
  celebrate?: boolean;
  /** Enregistre l'ouverture côté serveur. Renvoie false en cas d'échec. */
  onOpen: (post: Post) => Promise<boolean>;
  /** Appelé à la fin de l'animation */
  onRevealed: (post: Post) => void;
}

export function GiftCard({
  post,
  size,
  disabled,
  celebrate,
  onOpen,
  onRevealed,
}: GiftCardProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // --- Valeurs animées ---
  // Cadeau : tremblement, léger grossissement, disparition
  const shake = useSharedValue(0);
  const pop = useSharedValue(1);
  const giftOpacity = useSharedValue(1);
  // Couvercle : montée, rotation, disparition
  const lidY = useSharedValue(0);
  const lidRotate = useSharedValue(0);
  const lidOpacity = useSharedValue(1);
  // Photo : déjà visible si le cadeau était ouvert avant
  const photoScale = useSharedValue(post.openedByMe ? 1 : 0.2);
  const photoOpacity = useSharedValue(post.openedByMe ? 1 : 0);

  const giftStyle = useAnimatedStyle(() => ({
    opacity: giftOpacity.value,
    transform: [{ rotate: `${shake.value}deg` }, { scale: pop.value }],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    opacity: lidOpacity.value,
    transform: [
      { translateY: lidY.value },
      { rotate: `${lidRotate.value}deg` },
    ],
  }));

  const photoStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
    transform: [{ scale: photoScale.value }],
  }));

  /** Remet le cadeau fermé (en cas d'échec du serveur) */
  function reset() {
    shake.value = withTiming(0, { duration: 100 });
    pop.value = withTiming(1, { duration: 150 });
  }

  async function handlePress() {
    if (isOpening || disabled || post.openedByMe) return;
    setIsOpening(true);

    const serverCall = onOpen(post);

    // 1. Le cadeau grossit un peu et tremble (≈ 0,7 s)
    pop.value = withTiming(1.06, { duration: 150 });
    shake.value = withSequence(
      withTiming(-8, { duration: 70 }),
      withRepeat(
        withSequence(
          withTiming(8, { duration: 140 }),
          withTiming(-8, { duration: 140 }),
        ),
        2,
      ),
      withTiming(0, { duration: 70 }),
    );
    await wait(720);

    const ok = await serverCall;
    if (!ok) {
      reset();
      setIsOpening(false);
      return;
    }

    // 2. Le couvercle saute
    lidY.value = withTiming(-size * 0.6, {
      duration: 380,
      easing: Easing.out(Easing.quad),
    });
    lidRotate.value = withTiming(-35, { duration: 380 });
    lidOpacity.value = withDelay(180, withTiming(0, { duration: 200 }));
    if (celebrate) setShowConfetti(true);

    // 3. La boîte s'efface, la photo apparaît en grandissant avec un rebond
    giftOpacity.value = withDelay(250, withTiming(0, { duration: 250 }));
    photoOpacity.value = withDelay(250, withTiming(1, { duration: 200 }));
    photoScale.value = withDelay(
      250,
      withSpring(1, { damping: 12, stiffness: 140 }),
    );

    await wait(950);
    setIsOpening(false);
    onRevealed(post);
  }

  const showPhoto = post.openedByMe || isOpening;
  const showGift = !post.openedByMe;

  return (
    <View style={{ width: size }}>
      <Pressable
        onPress={handlePress}
        disabled={post.openedByMe || isOpening || disabled}
        accessibilityRole="button"
        accessibilityLabel={
          post.openedByMe
            ? `Photo de ${post.user.pseudo}`
            : `Ouvrir le cadeau de ${post.user.pseudo}`
        }
        style={{ width: size, height: size }}
      >
        {/* Photo (dessous) */}
        {showPhoto && (
          <Animated.Image
            source={{ uri: post.photoUrl }}
            style={[
              styles.layer,
              styles.photo,
              { width: size, height: size },
              photoStyle,
            ]}
          />
        )}

        {/* Cadeau (dessus) */}
        {showGift && (
          <Animated.View
            style={[
              styles.layer,
              styles.giftTile,
              { width: size, height: size },
              giftStyle,
            ]}
          >
            <GiftBox
              size={size * 0.85}
              color={colorFor(post.user.id)}
              lidStyle={lidStyle}
            />
          </Animated.View>
        )}
      </Pressable>

      {showConfetti && (
        <Confetti size={size} onDone={() => setShowConfetti(false)} />
      )}

      <View style={styles.author}>
        <Avatar
          uri={post.user.avatarUrl}
          pseudo={post.user.pseudo}
          seed={post.user.id}
          size={22}
        />
        <Text style={styles.pseudo} numberOfLines={1}>
          {post.isMine ? "Moi" : post.user.pseudo}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0 },
  photo: { borderRadius: 10, backgroundColor: "#eee" },
  giftTile: {
    borderRadius: 10,
    backgroundColor: "#fdf2f0",
    alignItems: "center",
    justifyContent: "center",
  },
  author: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    justifyContent: "center",
  },
  pseudo: { fontSize: 13, color: "#666", flexShrink: 1 },
});
