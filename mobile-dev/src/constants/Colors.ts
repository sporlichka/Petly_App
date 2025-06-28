export const Colors = {
  // Primary yellow theme
  primary: '#FFD54F',
  primaryDark: '#FFC107',
  primaryLight: '#FFF9C4',
  
  // Secondary warm colors
  secondary: '#FF8A65',
  secondaryLight: '#FFCCBC',
  
  // Background colors
  background: '#FAFAFA',
  surface: '#FFFFFF',
  cardBackground: '#FFFFFF',
  
  // Text colors
  text: '#2E2E2E',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  
  // Activity category colors
  feeding: '#FF8A65',      // Warm orange
  health: '#81C784',       // Soft green
  activity: '#64B5F6',     // Light blue
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // UI elements
  border: '#E0E0E0',
  borderLight: '#F5F5F5',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  
  // States
  disabled: '#BDBDBD',
  placeholder: '#BDBDBD',
  
  // Gradients
  gradient: {
    primary: ['#FFD54F', '#FFC107'],
    secondary: ['#FF8A65', '#FF7043'],
    background: ['#FFF9C4', '#FFFFFF'],
  }
};

export const ActivityColors = {
  feeding: Colors.feeding,
  health: Colors.health,
  activity: Colors.activity,
};

export const getActivityColor = (category: string): string => {
  return ActivityColors[category as keyof typeof ActivityColors] || Colors.primary;
}; 