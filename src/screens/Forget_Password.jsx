import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { loginUserWithOtp, requestOtpAsync, resetPasswordAsync } from '../services/Actions/employeeAction';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Forget_Password = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { message } = useSelector(state => state.employee);

  const [input, setInput] = useState({ phone: '' });
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [resetPassword, setResetPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState({ password: '', con_password: '' });

  const animEmail = useRef(new Animated.Value(0)).current;
  const animPass = useRef(new Animated.Value(0)).current;
  const animConfirm = useRef(new Animated.Value(0)).current;

  const animate = (anim, toValue) => {
    Animated.timing(anim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const labelStyle = anim => ({
    position: 'absolute',
    left: 45,
    top: anim.interpolate({ inputRange: [0,1], outputRange: [15, -10] }),
    fontSize: anim.interpolate({ inputRange: [0,1], outputRange: [16, 12] }),
    color: anim.interpolate({ inputRange: [0,1], outputRange: ['#aaa', '#E91E63'] }),
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    zIndex: 2,
  });

  const handleGetOtp = () => {
    dispatch(requestOtpAsync(input));
    setShowOtpInput(true);
  };

  const handleChakOtp = () => {
    const data = { ...input, otp };
    dispatch(loginUserWithOtp(data));
    setResetPassword(true);
  };

  const handleResetPassword = () => {
    if (passwordInput.password !== passwordInput.con_password) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    dispatch(resetPasswordAsync({ phone: input.phone, otp, password: passwordInput.password }));
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedData = await AsyncStorage.getItem('user');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (parsed.status === "200") {
            Alert.alert("SUCCESS", message);
            navigation.replace('MainTabs');
          } else if (message) {
            Alert.alert("FAILED", message);
          }
        }
      } catch (err) {
        console.error('Failed to load user from AsyncStorage', err);
      }
    };
    checkLoginStatus();
  }, [message]);

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnAbsolute}>
        <MaterialCommunityIcons name="chevron-left" size={30} color="#000" />
        <Text style={{ fontWeight: '700', fontSize: 16 }}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.card}>
            <Text style={styles.heading}>Forget Password using OTP</Text>
            <Text style={styles.paragraph}>
              Please enter your phone number to receive an OTP for forgetting password.
            </Text>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="phone" size={24} color="#E91E63" style={styles.icon} />
              <Animated.Text style={labelStyle(animEmail)}>Phone</Animated.Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={input.phone}
                onChangeText={t => setInput({ ...input, phone: t })}
                onFocus={() => animate(animEmail, 1)}
                onBlur={() => { if (!input.phone) animate(animEmail, 0); }}
              />
            </View>

            {!showOtpInput && (
              <TouchableOpacity style={styles.btn} onPress={handleGetOtp}>
                <Text style={styles.btnText}>Get OTP</Text>
              </TouchableOpacity>
            )}

            {showOtpInput && !resetPassword && (
              <>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="shield-key" size={24} color="#E91E63" style={styles.icon} />
                  <TextInput
                    placeholder="Enter OTP"
                    style={styles.input}
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                  />
                </View>
                <TouchableOpacity style={styles.btn} onPress={handleChakOtp}>
                  <Text style={styles.btnText}>Verify OTP</Text>
                </TouchableOpacity>
              </>
            )}

            {resetPassword && (
              <>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock" size={24} color="#E91E63" style={styles.icon} />
                  <Animated.Text style={labelStyle(animPass)}>Password</Animated.Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={passwordInput.password}
                    onChangeText={t => setPasswordInput({ ...passwordInput, password: t })}
                    onFocus={() => animate(animPass, 1)}
                    onBlur={() => { if (!passwordInput.password) animate(animPass, 0); }}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-check" size={24} color="#E91E63" style={styles.icon} />
                  <Animated.Text style={labelStyle(animConfirm)}>Confirm Password</Animated.Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={passwordInput.con_password}
                    onChangeText={t => setPasswordInput({ ...passwordInput, con_password: t })}
                    onFocus={() => animate(animConfirm, 1)}
                    onBlur={() => { if (!passwordInput.con_password) animate(animConfirm, 0); }}
                  />
                </View>

                <TouchableOpacity style={styles.btn} onPress={handleResetPassword}>
                  <Text style={styles.btnText}>Reset Password</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
};

export default Forget_Password;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30, paddingTop: 60 },
  card: { backgroundColor: '#fff', width: '90%', padding: 25, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  heading: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#E91E63', marginBottom: 10 },
  paragraph: { textAlign: 'center', color: '#777', fontSize: 14, marginBottom: 20 },
  inputWrapper: { marginVertical: 15, position: 'relative', zIndex: 1, justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingLeft: 45, paddingVertical: 12, fontSize: 16, color: '#000', backgroundColor: '#fff' },
  icon: { position: 'absolute', top: 12, left: 10, zIndex: 2 },
  btn: { backgroundColor: '#e53935', paddingVertical: 14, borderRadius: 10, marginTop: 10, shadowColor: '#e53935', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  btnText: { textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtnAbsolute: { position: 'absolute', top: 10, left: 10, zIndex: 10, padding: 5, flexDirection: 'row', alignItems: 'center' }
});
