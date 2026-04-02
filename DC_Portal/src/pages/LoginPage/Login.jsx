import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import LinearGradient from 'react-native-linear-gradient';
import styles from './StylesLogin';
import { API_URL } from '../../utils/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

// Loading dots animation
const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <View style={styles.loadingDotsContainer}>
      <Animated.View style={[styles.loadingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.loadingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.loadingDot, { opacity: dot3 }]} />
    </View>
  );
};

const Login = ({ navigation }) => {
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Input refs for form navigation
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    // Configure Google sign-in
    GoogleSignin. configure({
      webClientId:  GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:  1,
        duration: 1200,
        useNativeDriver:  true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction:  7,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation - Continuous loop
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000, // 10 seconds for one full rotation
        useNativeDriver:  true,
        easing: (t) => t, // Linear easing for smooth rotation
      })
    ).start();
  }, []);

  // Create smooth 360-degree rotation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange:  ['0deg', '360deg'],
  });

  const handleLogin = async () => {
    if (!emailId.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Email and Password are required.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        emailId,
        password,
      });

      if (response.data.token) {
        const { token, user_id, user_name, role_id, email_id, year } = response.data;
        
        if (role_id === 1 && year) {
          await AsyncStorage. setItem('year', String(year));
        } else {
          await AsyncStorage.removeItem('year');
        }
        
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user_id', String(user_id));
        await AsyncStorage.setItem('email_id', String(email_id));
        await AsyncStorage.setItem('user_name', user_name);
        await AsyncStorage.setItem('role_id', String(role_id));
      
        
        if (role_id == 1) {
          navigation. navigate('StudentLayout');
        } else if (role_id == 2) {
          navigation.navigate('FacultyLayout');
        } else if (role_id == 3) {
          navigation.navigate('AdminLayout');
        }
      } else {
        Alert.alert('Login Failed', 'An unexpected error occurred.');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('Login Failed', 'Invalid email or password.');
        } else if (error.response.status === 403) {
          Alert.alert('Not Registered', 'No such email found.  Please contact admin.');
        } else {
          Alert.alert('Login Error', error.response.data?. message || 'An error occurred.');
        }
      } else {
        Alert.alert('Login Error', 'Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        console.log('No previous session to sign out');
      }

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      const response = await axios. post(
        `${API_URL}/api/auth/google`,
        { idToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const data = response.data;
      
      if (data.success) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user_id', String(data.user_id));
        await AsyncStorage.setItem('user_name', data.user_name);
        await AsyncStorage.setItem('email_id', data.email_id);
        await AsyncStorage.setItem('role_id', String(data.role_id));
        
        if (data.role_id === 1 && data.year) {
          await AsyncStorage.setItem('year', String(data.year));
        } else {
          await AsyncStorage.removeItem('year');
        }

        if (data.role_id == 1) {
          navigation. navigate('StudentLayout');
        } else if (data.role_id == 2) {
          navigation.navigate('FacultyLayout');
        } else if (data. role_id == 3) {
          navigation.navigate('AdminLayout');
        }
      } else {
        Alert.alert('Google Sign-In Failed', 'Unauthorized access.');
      }
      
    } catch (error) {
      console.log('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled Google sign-in');
      } else if (error.code === statusCodes. IN_PROGRESS) {
        Alert.alert('In Progress', 'Sign-in is already in progress');
      } else if (error. code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available or outdated');
      } else if (error.response) {
        if (error.response.status === 403) {
          Alert.alert('Not Registered', 'No such email found. Please contact admin.');
        } else {
          Alert. alert('Error', error.response.data?.message || 'Server error during sign-in');
        }
      } else {
        Alert. alert('Error', 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver:  true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent"
        translucent={true}
      />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y:  0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Floating circles decoration */}
        <View style={styles.decorationCircle1} />
        <View style={styles.decorationCircle2} />
        <View style={styles. decorationCircle3} />

        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
          >
            {/* Header Section */}
            <Animated.View 
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Rotating Graduation Cap Logo */}
              <Animated. View 
                style={[
                  styles.logoContainer,
                  { transform: [{ rotate: spin }] }
                ]}
              >
                <LinearGradient
                  colors={['#ffffff', 'rgba(255,255,255,0.8)']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="school" size={40} color="#667eea" />
                </LinearGradient>
              </Animated.View>
              
              <Text style={styles. appTitle}>DC Portal</Text>
              <Text style={styles.subtitle}>
                Empowering Education Through Technology
              </Text>
            </Animated.View>

            {/* Login Form */}
            <Animated.View 
              style={[
                styles.loginBox,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              {/* Glassmorphism effect */}
              <View style={styles.glassEffect}>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.welcomeSubtext}>Sign in to continue</Text>

                {/* Email Input */}
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'email' && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={focusedInput === 'email' ? '#667eea' :  '#999'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#999"
                    onChangeText={setEmailId}
                    value={emailId}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>

                {/* Password Input */}
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'password' && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={focusedInput === 'password' ? '#667eea' : '#999'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    onChangeText={setPassword}
                    value={password}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={() => {
                      animateButton();
                      handleLogin();
                    }}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity 
                  onPress={() => {
                    animateButton();
                    handleLogin();
                  }}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y:  0 }}
                    end={{ x: 1, y:  0 }}
                    style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <LoadingDots />
                        <Text style={styles.loginButtonText}>Signing in...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>SIGN IN</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.divider} />
                </View>

                {/* Google Button */}
                <TouchableOpacity 
                  style={[
                    styles.googleButton,
                    isGoogleLoading && styles.googleButtonDisabled
                  ]}
                  onPress={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  activeOpacity={0.9}
                >
                  {isGoogleLoading ? (
                    <View style={styles. googleLoadingContainer}>
                      <ActivityIndicator size="small" color="#667eea" />
                      <Text style={styles.googleButtonText}>Connecting...</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.googleIconContainer}>
                        <Ionicons name="logo-google" size={20} color="#667eea" />
                      </View>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

export default Login;