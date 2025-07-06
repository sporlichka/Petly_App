import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, getActivityColor } from '../constants/Colors';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'medium',
  ...touchableProps
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: Colors.cardBackground,
      borderRadius: 16,
    };

    // Padding styles
    switch (padding) {
      case 'none':
        break;
      case 'small':
        baseStyle.padding = 12;
        break;
      case 'large':
        baseStyle.padding = 24;
        break;
      default: // medium
        baseStyle.padding = 16;
    }

    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle.shadowColor = Colors.shadow;
        baseStyle.shadowOffset = {
          width: 0,
          height: 4,
        };
        baseStyle.shadowOpacity = 0.15;
        baseStyle.shadowRadius = 12;
        baseStyle.elevation = 8;
        break;
      case 'outlined':
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = Colors.border;
        baseStyle.shadowColor = Colors.shadow;
        baseStyle.shadowOffset = {
          width: 0,
          height: 1,
        };
        baseStyle.shadowOpacity = 0.05;
        baseStyle.shadowRadius = 4;
        baseStyle.elevation = 2;
        break;
      default: // default
        baseStyle.shadowColor = Colors.shadow;
        baseStyle.shadowOffset = {
          width: 0,
          height: 2,
        };
        baseStyle.shadowOpacity = 0.1;
        baseStyle.shadowRadius = 8;
        baseStyle.elevation = 4;
    }

    return baseStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[getCardStyle(), style]}
        activeOpacity={0.95}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

// Specialized card components
export const PetCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}> = ({ children, onPress, style }) => {
  const petCardStyle: ViewStyle = {
    ...styles.petCard,
    ...style
  };

  return (
  <Card
    variant="elevated"
    padding="medium"
    onPress={onPress}
      style={petCardStyle}
  >
    {children}
  </Card>
);
};

export const ActivityCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  category?: string;
}> = ({ children, onPress, style, category }) => {
  const getBorderColor = () => {
    if (!category) return Colors.primary;
    return getActivityColor(category);
  };

  const activityCardStyle: ViewStyle = {
    ...styles.activityCard,
    borderLeftColor: getBorderColor(),
    ...style
  };

  return (
  <Card
    variant="default"
    padding="medium"
    onPress={onPress}
      style={activityCardStyle}
  >
    {children}
  </Card>
);
};

const styles = StyleSheet.create({
  petCard: {
    marginBottom: 16,
  },
  activityCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
}); 