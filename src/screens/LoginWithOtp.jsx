import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SweetAlert from 'react-native-sweet-alert';

import { loginUserWithOtp, requestOtpAsync } from '../services/Actions/employeeAction';
import { useLoading } from '../navigation/LoadingContext';

const LoginWithOtp = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { loading, setLoading } = useLoading();

  const [input, setInput] = useState({ phone: '' });
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(80);
  const [canResend, setCanResend] = useState(false);
  const animEmail = useRef(new Animated.Value(0)).current;

  const animate = (anim, toVal) => Animated.timing(anim, {
    toValue: toVal, duration: 200, useNativeDriver: false
  }).start();

  const showAlert = (title, message, type = 'success') => {
    SweetAlert.showAlertWithOptions({
      title,
      subTitle: message,
      confirmButtonTitle: 'OK',
      confirmButtonColor: type === 'success' ? '#4CAF50' : '#E53935',
      style: type
    });
  };

  const handleGetOtp = () => {
    setLoading(true);
    dispatch(requestOtpAsync(input))
      .then((res) => {
        if (res.status == "200") {
          setShowOtpInput(true);
          setCanResend(false);
          setTimer(80);
          showAlert("OTP Sent", res.message, "success");
        } else {
          showAlert("Failed", res.message, "error");
        }
      })
      .catch((err) => {
        showAlert("Error", err.message || "Something went wrong", "error");
      })
      .finally(() => setLoading(false));
  };

  const handleCheckOtp = () => {
    setLoading(true);
    dispatch(loginUserWithOtp({ ...input, otp }))
      .then((res) => {
        if (res.status == "200") {
          showAlert("Login Successful", res.message, "success");
          navigation.replace('MainTabs');
        } else {
          showAlert("Login Failed", res.message, "error");
        }
      })
      .catch((err) => {
        showAlert("Error", err.message || "Something went wrong", "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let interval;
    if (showOtpInput && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOtpInput, timer]);

  const formatTimer = () => `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
        {loading && <View style={styles.fullscreenOverlay}><ActivityIndicator size="large" color="#E53935" /></View>}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnAbsolute}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#000" />
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
          <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.card}>
              <Text style={styles.heading}>Login With OTP</Text>
              <Text style={styles.paragraph}>Enter your phone to receive OTP.</Text>

              <View style={styles.inputWrapper}>
                <Animated.Text style={[labelStyle(animEmail)]} pointerEvents="none">Mobile</Animated.Text>
                <TextInput
                  style={[styles.input]}
                  keyboardType="phone-pad"
                  placeholder="Enter your mobile number"
                  value={input.phone}
                  maxLength={10}
                  onChangeText={t => {
                    const numeric = t.replace(/[^0-9]/g, '');
                    setInput({ ...input, phone: numeric });
                    if (numeric.length > 0) animate(animEmail, 1);
                    else animate(animEmail, 0);
                  }}
                  onFocus={() => animate(animEmail, 1)}
                  onBlur={() => !input.phone && animate(animEmail, 0)}
                />
                <MaterialCommunityIcons name="phone" size={22} color="#E91E63" style={styles.iconRight} />
              </View>

              {!showOtpInput ? (
                <TouchableOpacity
                  style={[styles.btn, (input.phone.length !== 10 || loading) && { opacity: 0.6 }]}
                  onPress={handleGetOtp}
                  disabled={loading || input.phone.length !== 10}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextInput}>Get OTP</Text>}
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="shield-key" size={24} color="#E91E63" style={styles.iconLeft} />
                    <TextInput
                      placeholder="Enter OTP"
                      style={[styles.input, { paddingLeft: 45 }]}
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                  <Text style={{ color: '#777', textAlign: 'center', marginTop: 10 }}>
                    OTP expires in <Text style={{ fontWeight: 'bold' }}>{formatTimer()}</Text>
                  </Text>
                  {canResend && (
                    <TouchableOpacity onPress={handleGetOtp} style={{ marginTop: 10 }}>
                      <Text style={{ color: '#E91E63', fontWeight: 'bold', textAlign: 'center' }}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.btn} onPress={handleCheckOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextInput}>Login</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const labelStyle = anim => ({
  position: 'absolute',
  left: 15,
  top: anim.interpolate({ inputRange: [0, 1], outputRange: [15, -10] }),
  fontSize: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] }),
  color: anim.interpolate({ inputRange: [0, 1], outputRange: ['#aaa', '#E91E63'] }),
  backgroundColor: '#fff',
  paddingHorizontal: 4,
  zIndex: 1
});

const styles = StyleSheet.create({
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingVertical: 30
  },
  card: {
    backgroundColor: '#fff',
    width: '90%',
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E91E63',
    marginBottom: 10
  },
  paragraph: {
    textAlign: 'center',
    color: '#777',
    fontSize: 14,
    marginBottom: 20
  },
  inputWrapper: {
    marginVertical: 15,
    position: 'relative',
    justifyContent: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingLeft: 15,
    paddingRight: 45,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff'
  },
  iconRight: {
    position: 'absolute',
    right: 10,
    top: 12,
    zIndex: 2
  },
  iconLeft: {
    position: 'absolute',
    left: 10,
    top: 12,
    zIndex: 2
  },
  btn: {
    backgroundColor: '#e53935',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    elevation: 5,
    justifyContent: 'center',
    flexDirection: 'row'
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  btnTextInput: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  backBtnAbsolute: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center'
  }
});

export default LoginWithOtp;
