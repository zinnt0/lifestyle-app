import React from "react";
import { View, StyleSheet } from "react-native";

interface PaginationDotsProps {
  total: number;
  current: number;
  color?: string;
  inactiveColor?: string;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({
  total,
  current,
  color = "#4A90E2",
  inactiveColor = "#E0E0E0",
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === current ? color : inactiveColor,
              width: index === current ? 10 : 8,
              height: index === current ? 10 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    borderRadius: 5,
  },
});
