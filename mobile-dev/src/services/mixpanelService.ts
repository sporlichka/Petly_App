import { Mixpanel } from "mixpanel-react-native";
import { Platform } from 'react-native';

// Set up an instance of Mixpanel
const trackAutomaticEvents = false;
export const mixpanel = new Mixpanel("4f18fd06a5bbd2a7c6328b8b6d41aa12", trackAutomaticEvents);

// Initialize Mixpanel with error handling
mixpanel.init().then(() => {
  console.log('🎯 Mixpanel initialized successfully');
  
  // Send test event to verify tracking works
  mixpanel.track("App Launched", {
    "Platform": Platform.OS,
    "Version": "1.0.0"
  });
  console.log('✅ Test event sent to Mixpanel');
}).catch((error) => {
  console.error('❌ Mixpanel initialization failed:', error);
});

// Helper functions for common tracking events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  console.log('🎯 Tracking event:', eventName, properties);
  mixpanel.track(eventName, properties);
  console.log('✅ Event tracked in Mixpanel');
};

export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  mixpanel.identify(userId);
  if (userProperties) {
    mixpanel.getPeople().set(userProperties);
  }
};

export const setUserProperty = (property: string, value: any) => {
  mixpanel.getPeople().set(property, value);
};

export const resetUser = () => {
  mixpanel.reset();
}; 