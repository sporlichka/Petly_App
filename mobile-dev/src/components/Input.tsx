import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  secureTextEntry?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  variant = 'outlined',
  size = 'medium',
  secureTextEntry = false,
  style,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.minHeight = 40;
        baseStyle.paddingHorizontal = 12;
        break;
      case 'large':
        baseStyle.minHeight = 56;
        baseStyle.paddingHorizontal = 20;
        break;
      default: // medium
        baseStyle.minHeight = 48;
        baseStyle.paddingHorizontal = 16;
    }

    // Variant styles
    switch (variant) {
      case 'filled':
        baseStyle.backgroundColor = Colors.primaryLight;
        if (isFocused) {
          baseStyle.backgroundColor = Colors.surface;
          baseStyle.borderWidth = 2;
          baseStyle.borderColor = Colors.primary;
        }
        if (error) {
          baseStyle.borderWidth = 2;
          baseStyle.borderColor = Colors.error;
          baseStyle.backgroundColor = Colors.surface;
        }
        break;
      case 'outlined':
        baseStyle.backgroundColor = Colors.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = error ? Colors.error : Colors.border;
        if (isFocused) {
          baseStyle.borderWidth = 2;
          baseStyle.borderColor = error ? Colors.error : Colors.primary;
        }
        break;
      default: // default
        baseStyle.backgroundColor = Colors.surface;
        baseStyle.borderBottomWidth = 2;
        baseStyle.borderBottomColor = error ? Colors.error : Colors.border;
        if (isFocused) {
          baseStyle.borderBottomColor = error ? Colors.error : Colors.primary;
        }
    }

    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle = {
      flex: 1,
      color: Colors.text,
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
    };

    return baseStyle;
  };

  const toggleSecureEntry = () => {
    setIsSecureVisible(!isSecureVisible);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[
          styles.label,
          { color: error ? Colors.error : Colors.text },
          size === 'small' && { fontSize: 12 },
          size === 'large' && { fontSize: 16 }
        ]}>
          {label}
        </Text>
      )}
      
      <View style={[getContainerStyle(), style]}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          {...textInputProps}
          style={[getInputStyle()]}
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={toggleSecureEntry}
            style={styles.iconContainer}
          >
            <Ionicons
              name={isSecureVisible ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
      </View>

      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          { color: error ? Colors.error : Colors.textSecondary },
          size === 'small' && { fontSize: 10 },
          size === 'large' && { fontSize: 14 }
        ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.text,
  },
  iconContainer: {
    marginHorizontal: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 4,
  },
}); 