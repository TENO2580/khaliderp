import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withSpring,
  interpolateColor,
  FadeIn
} from 'react-native-reanimated';
import * as Network from 'expo-network';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  // Animations
  const passwordShake = useSharedValue(0);
  const passwordBorder = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const logoScale = useSharedValue(0.95);
  const logoGlow = useSharedValue(0);

  const passwordAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: passwordShake.value }],
      borderColor: interpolateColor(
        passwordBorder.value,
        [0, 1],
        ['#1E293B', '#EF4444']
      )
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }]
    };
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
      shadowColor: '#14B8A6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: logoGlow.value,
      shadowRadius: 15,
      elevation: logoGlow.value > 0 ? 15 : 0,
    };
  });

  useEffect(() => {
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      setOffline(true);
      return false;
    }
    setOffline(false);
    return true;
  };

  const triggerShake = () => {
    passwordBorder.value = withTiming(1, { duration: 200 });
    passwordShake.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleLogin = async () => {
    const isOnline = await checkNetwork();
    if (!isOnline) return;

    if (!email || !password) {
      setError('Please enter both email and password');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');
    passwordBorder.value = withTiming(0);
    buttonScale.value = withTiming(0.98, { duration: 100 });

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data.data;
      
      setUserName(user.name || email.split('@')[0]);
      setSuccess(true);
      
      buttonScale.value = withSpring(1);
      logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
      logoGlow.value = withTiming(0.8, { duration: 500 });
      
      setTimeout(async () => {
        await login(user, accessToken, refreshToken);
      }, 700);
      
    } catch (err: any) {
      setLoading(false);
      buttonScale.value = withSpring(1);
      setError(err.response?.data?.error || 'Invalid email or password.');
      triggerShake();
    } 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {offline && (
            <View style={styles.offlineBanner}>
              <Feather name="wifi-off" size={16} color="#fff" />
              <Text style={styles.offlineText}>No Internet Connection</Text>
              <TouchableOpacity onPress={checkNetwork} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Logo Area */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <MaterialCommunityIcons name="cube-outline" size={48} color="#14B8A6" />
            <Text style={styles.logoTitle}>TRPIDIO</Text>
            <Text style={styles.logoSubtitle}>E R P</Text>
          </Animated.View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            {success ? (
              <>
                <Animated.View entering={FadeIn} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                   <Feather name="check-circle" size={28} color="#14B8A6" style={{marginRight: 8}} />
                   <Text style={styles.welcomeTitle}>Welcome back,</Text>
                </Animated.View>
                <Text style={styles.tealText}>{userName}</Text>
              </>
            ) : (
              <>
                <Text style={styles.welcomeTitle}>Welcome <Text style={styles.tealText}>Back!</Text></Text>
                <Text style={styles.welcomeSubtitle}>Sign in to continue to your ERP</Text>
              </>
            )}
          </View>

          {/* Form Card */}
          <View style={styles.formCard} pointerEvents={(loading || success) ? 'none' : 'auto'}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color="#14B8A6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="username@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!loading && !success}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <Animated.View style={[styles.inputWrapper, passwordAnimatedStyle]}>
              <Feather name="lock" size={20} color="#14B8A6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading && !success}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} disabled={loading || success}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#14B8A6" />
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
                disabled={loading || success}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Feather name="check" size={14} color="#0B1120" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={[styles.loginBtnShadow, buttonAnimatedStyle]}>
              <TouchableOpacity 
                onPress={handleLogin}
                disabled={loading || success}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={success ? ['#10B981', '#059669'] : ['#14B8A6', '#0F766E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtn}
                >
                  {success ? (
                    <Text style={styles.loginBtnText}>Authenticated</Text>
                  ) : loading ? (
                    <>
                      <ActivityIndicator color="#fff" style={{marginRight: 8}} />
                      <Text style={styles.loginBtnText}>Signing In...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.loginBtnText}>Sign In</Text>
                      <View style={styles.btnArrow}>
                        <Feather name="arrow-right" size={18} color="#fff" />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.companyBtn} activeOpacity={0.7} disabled={loading || success}>
              <MaterialCommunityIcons name="office-building" size={20} color="#E2E8F0" style={styles.companyIcon} />
              <Text style={styles.companyBtnText}>Sign in with Company</Text>
              <Feather name="chevron-right" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Features Bottom */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Feather name="bar-chart-2" size={20} color="#14B8A6" />
              </View>
              <Text style={styles.featureText}>Smart{'\n'}Analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Feather name="layers" size={20} color="#14B8A6" />
              </View>
              <Text style={styles.featureText}>Powerful{'\n'}Modules</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Feather name="shield" size={20} color="#14B8A6" />
              </View>
              <Text style={styles.featureText}>Secure &{'\n'}Reliable</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Feather name="users" size={20} color="#14B8A6" />
              </View>
              <Text style={styles.featureText}>Built for{'\n'}Growth</Text>
            </View>
          </View>

          <Text style={styles.footerText}>© 2026 <Text style={styles.tealText}>Tripidio ERP</Text>. All rights reserved.</Text>
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  offlineBanner: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginTop: 8,
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#14B8A6',
    fontWeight: 'bold',
    letterSpacing: 6,
    marginTop: 4,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tealText: {
    color: '#14B8A6',
    fontSize: 28,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
  },
  formCard: {
    width: '100%',
    backgroundColor: '#151E2E',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    height: 50,
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#14B8A6',
  },
  rememberText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  loginBtnShadow: {
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  loginBtn: {
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnArrow: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748B',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  companyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
  },
  companyIcon: {
    marginRight: 12,
  },
  companyBtnText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  }
});
