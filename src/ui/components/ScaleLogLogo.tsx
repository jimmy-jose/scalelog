import { Image, StyleSheet, View } from "react-native";

const logoSource = require("../../../assets/scalelog-app-icon.png");

export function ScaleLogLogo({ size = 32 }: { size?: number }) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={[styles.frame, { width: size, height: size, borderRadius: Math.round(size * 0.22) }]}
    >
      <Image source={logoSource} resizeMode="contain" style={styles.image} accessible={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
});
