import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, SafeAreaView, Image, ScrollView,
    Platform, PermissionsAndroid, StyleSheet, TextInput,
    TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard,
    Alert
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SweetAlert from 'react-native-sweet-alert';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useIsFocused, useRoute } from '@react-navigation/native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Geolocation from '@react-native-community/geolocation';
import { attendanceDataAsunc, getInfoAsync, getMyAbout } from '../services/Actions/employeeAction';
import { useLoading } from '../navigation/LoadingContext';
import ImageResizer from 'react-native-image-resizer';
import { startOfWeek, endOfWeek, } from 'date-fns';
import NetInfo from "@react-native-community/netinfo";

// import axios from 'axios';
// import messaging from '@react-native-firebase/messaging';
// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import moment from 'moment';


const HomeScreen = ({ navigation }) => {

    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const route = useRoute();
    const cameraRef = useRef(null);

    const { attResponse, employee, } = useSelector(state => state.employee);

    const [employees, setEmployees] = useState({});
    const [remark, setRemark] = useState("");
    const [showPunchCard, setShowPunchCard] = useState(false);
    const [capturedImage, setCapturedImage] = useState({});
    const [location, setLocation] = useState(null);
    const [isPunchedIn, setIsPunchedIn] = useState({
        status: '', active: '', message: '',
        time: "--:--:--", selfi: '', outtime: "--:--:--", mobatt: ''
    });
    const [punchInTime, setPunchInTime] = useState(null);
    const [totalHours, setTotalHours] = useState('--:--:--');
    const [currentTime, setCurrentTime] = useState('');
    const [ismobatt, setIsmobatt] = useState('0');
    const [birthdays, setBirthdays] = useState([]);
    const [leavePersion, setLeavePersion] = useState([])
    const [holidayList, setHolidayList] = useState([])
    const [aboutInfo, setAboutInfo] = useState(null);
    const [latestPost, setLatestPost] = useState(null);
    const { loading, setLoading } = useLoading();
    const [address, setAddress] = useState("");
    const [isConnected, setIsConnected] = useState(true);
    // week calculate 
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const requestAllPermissions = async () => {
        const cameraPermission = await Camera.requestCameraPermission();
        console.log("Camera Permission:", cameraPermission); // usually "granted" or "denied"

        const micPermission = await Camera.requestMicrophonePermission();
        console.log("Mic Permission:", micPermission); // usually "granted" or "denied"

        const allGranted =
            cameraPermission === 'granted' &&
            micPermission === 'granted';

        console.log("Final Granted Status:", allGranted);
        return allGranted;
    };

    const showCustomAlert = (title, message, isSuccess = false) => {
        SweetAlert.showAlertWithOptions({
            title,
            subTitle: message,
            confirmButtonTitle: 'OK',
            confirmButtonColor: isSuccess ? '#4CAF50' : '#E53935',
            style: isSuccess ? 'success' : 'error'
        });
    };

    const scrollRef = useRef(null);
    const [scrollX, setScrollX] = useState(0);

    //check internet connectivity

    useEffect(() => {
        const checkConnection = () => {
            NetInfo.fetch().then((state) => {
                if (!state.isConnected) {
                    showRetryAlert(); // keep showing until connected
                } else {
                    console.log("Internet Connected ✅");
                    setIsConnected(true);
                }
            });
        };

        const showRetryAlert = () => {
            Alert.alert(
                "No Internet Connection",
                "Please check your network and try again.",
                [
                    {
                        text: "Retry",
                        onPress: () => {
                            console.log("Retrying connection...");
                            checkConnection(); // Recheck connection again
                        },
                    },
                ],
                { cancelable: false }
            );
        };

        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected);

            if (!state.isConnected) {
                showRetryAlert();
            } else {
                console.log("Internet Connected ✅");
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (holidayList?.length > 0) {
            const interval = setInterval(() => {
                setScrollX(prev => {
                    const newX = prev + 200; // how much it scrolls each time
                    if (scrollRef.current) {
                        scrollRef.current.scrollTo({ x: newX, animated: true });
                    }
                    return newX;
                });
            }, 3000); // every 3 sec
            return () => clearInterval(interval);
        }
    }, [holidayList]);

    useEffect(() => {
        if (route.params?.capturedImage) {
            setCapturedImage(route.params.capturedImage);
            setShowPunchCard(true);  // Punch card dikhana
        }
    }, [route.params]);

    useEffect(() => { if (employee) setEmployees(employee); }, [employee]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            setCurrentTime(formattedTime);
            if (isPunchedIn && punchInTime) updateTotalHours(now);
        }, 1000);
        return () => clearInterval(timer);
    }, [isPunchedIn, punchInTime]);

    useEffect(() => {
        if (attResponse) {
            setIsPunchedIn({
                status: attResponse.status,
                message: attResponse.message,
                active: attResponse.active,
                selfi: attResponse.selfi,
            });
        }
    }, [attResponse]);

    const updateTotalHours = (now) => {
        const diffMs = now - punchInTime;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMin = Math.floor((diffMs % 3600000) / 60000);
        const diffSec = Math.floor((diffMs % 60000) / 1000);
        setTotalHours(`${diffHrs.toString().padStart(2, '0')}:${diffMin.toString().padStart(2, '0')}:${diffSec.toString().padStart(2, '0')}`);
    };

    const handlePunch = async () => {
        const granted = await requestAllPermissions();
        console.log("Permissions granted?", granted);

        if (!granted) {
            showCustomAlert('Permission Denied', 'Camera access is required.', false);
            return;
        }

        // CameraScreen open karo (ko function bhejne ki jagah sirf screen pe jao)
        navigation.navigate('CameraScreen', { mode: 'attendance' });
    };

    const resetPunchStatus = () => {
        setIsPunchedIn({
            status: '',
            active: '',
            message: '',
            time: '--:--:--',
            selfi: '',
            outtime: '--:--:--'
        });
    };

    const handleAttandance = async () => {

        if (!isConnected) {
            SweetAlert.showAlertWithOptions({
                title: 'Offline Mode',
                subTitle: 'You are not connected to the internet.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#E53935',
                style: 'error',
            });
            return;
        }

        setLoading(true);
        let coords = null;

        try {
            coords = await new Promise((resolve, reject) => {
                Geolocation.getCurrentPosition(
                    pos => resolve(pos.coords),
                    err => {
                        console.warn('Location Error:', err.message);
                        reject(err);
                    },
                    { enableHighAccuracy: false, timeout: 15000, maximumAge: 5000 }
                );
            });
        } catch (error) {
            if (location) {
                coords = location;
            } else {
                setLoading(false);
                return showCustomAlert('Location Error', 'Unable to fetch location.', false);
            }
        }

        if (!capturedImage?.uri) {
            setLoading(false);
            return showCustomAlert('Error', 'Please take a selfie before submitting.', false);
        }

        let finalUri = capturedImage.uri;
        try {
            const resized = await ImageResizer.createResizedImage(
                capturedImage.uri,
                800,
                800,
                'JPEG',
                70,
                0 // rotation handle karega EXIF
            );
            finalUri = resized.uri;
        } catch (err) {
            console.warn("Image resize error:", err);
        }


        const empid = employees.empid;
        const time = new Date();
        const formattedTime = time.toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        const formattedDate = time.toLocaleDateString('en-CA');

        const formData = new FormData();
        formData.append('empid', empid);
        formData.append('attdate', formattedDate);
        formData.append('intime', formattedTime);
        formData.append('lati', coords.latitude.toString());
        formData.append('longi', coords.longitude.toString());
        formData.append('remark', remark);

        if (capturedImage?.uri) {
            formData.append('fileName', {
                uri: finalUri,
                name: capturedImage.name,
                type: capturedImage.type,
            });
        }
        console.log("Attendance data", formData);

        dispatch(attendanceDataAsunc(formData))
            .then((res) => {
                console.log("res", res);
                showCustomAlert(
                    res.status === '200' || res.status === '201' ? 'Success' : 'Error',
                    res.message || 'Server not responding, please check your internet connection',
                    res.status === '200' || res.status === '201'
                );

                const now = new Date();
                const date = now.toLocaleDateString('en-CA');
                const empid = employees.empid;
                dispatch(getInfoAsync({ empid, date }))
                    .then((res) => {
                        setLoading(false);
                        setShowPunchCard(false);
                        setCapturedImage(null);
                        setRemark('');
                        setLocation(null);
                        if (res?.status === "200" && res?.Data?.length > 0) {
                            const lastData = res.Data[res.Data.length - 1];
                            setIsPunchedIn({
                                status: lastData.att_status || '',
                                active: lastData.active || '',
                                message: '',
                                time: lastData.intime || '--:--:--',
                                selfi: lastData.selfie || '',
                                outtime: lastData.outtime || '--:--:--'
                            });
                        } else {
                            resetPunchStatus();
                        }
                    }).catch((err) => {
                        setLoading(false);
                        console.error("Error fetching data:", err);
                        resetPunchStatus();
                    });
            })
            .catch((err) => {
                setLoading(false);
                // Network error handling
                if (!isConnected || err.message?.toLowerCase().includes("network")) {
                    Alert.alert(
                        "No Internet Connection",
                        "Cannot reach server. Please check your internet and try again.",
                        [{ text: "Retry", onPress: () => handleAttandance() }],
                        { cancelable: false }
                    );
                }
            });

    };

    const handleProfile = () => navigation.navigate('Profile');

    const handleInfo = (empid) => {
        const time = new Date();
        const date = time.toLocaleDateString('en-CA')
        const empname = employees.empname
        navigation.navigate('Attendance_rec', { empid, date, empname });
    };

    const getCurrentMonthBirthdays = (data) => {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;

        return data.filter(emp => {
            if (!emp.dob) return false;

            const [year, month] = emp.dob.split('-').map(Number);
            return month === currentMonth;
        });
    };

    useFocusEffect(
        useCallback(() => {
            if (!employees.empid) return;

            let watchId;
            let isActive = true;

            const fetchData = async (showLoader = false) => {
                try {
                    if (showLoader) setLoading(true);

                    // ✅ Location permission
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        {
                            title: 'Location Permission',
                            message: 'App needs access to your location.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );

                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        console.warn("Location permission denied");
                        if (showLoader) setLoading(false);
                        return;
                    }

                    Geolocation.getCurrentPosition(
                        pos => isActive && setLocation(pos.coords),
                        err => console.warn("Snapshot error:", err),
                        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5000 }
                    );

                    // 📍 Watch location changes
                    watchId = Geolocation.watchPosition(
                        pos => isActive && setLocation(pos.coords),
                        err => console.warn("Watch error:", err.message),
                        { enableHighAccuracy: false, distanceFilter: 5, interval: 5000, fastestInterval: 2000 }
                    );

                    // ✅ Fetch backend data
                    const today = new Date().toLocaleDateString('en-CA');
                    const res = await dispatch(getInfoAsync({ date: today, empid: employees.empid }));
                    console.log("res get info", res);

                    if (!isActive) return;

                    // Attendance logic
                    if (res?.status === '200' && res.Data?.length > 0) {
                        const lastData = res.Data[res.Data.length - 1];
                        console.log("lastData", lastData);

                        setIsPunchedIn({
                            status: lastData.att_status || '',
                            active: lastData.active || '',
                            message: '',
                            time: lastData.intime || '--:--:--',
                            selfi: lastData.selfie || '',
                            outtime: lastData.outtime || '--:--:--',
                            // mobatt : res?.emp?.mobatt ,
                        });
                    } else {
                        resetPunchStatus();
                    }

                    // Employees, leaves & holidays
                    const employeesList = res.emp || [];
                    const leavesWithName = (res.leaves || []).map(leave => {
                        const emp = employeesList.find(e => e.empid === leave.applyby);
                        return {
                            ...leave,
                            applyby_name: emp ? emp.empname : "Unknown",
                        };
                    });
                    const empMobAtt = employeesList.find(e => e?.empid === employees?.empid);

                    setIsmobatt(empMobAtt?.mobatt);
                    setBirthdays(getCurrentMonthBirthdays(employeesList));
                    setLeavePersion(leavesWithName);
                    setHolidayList(res.holidayList);
                    if (res?.latestContent) {
                        setLatestPost(res.latestContent);
                    } else {
                        setLatestPost(null);
                    }
                    // About info
                    const resAbout = await dispatch(getMyAbout(employees.empid));
                    console.log("resAbout", resAbout);

                    if (resAbout) {
                        setAboutInfo(resAbout?.data);
                    }

                    if (showLoader) setLoading(false);

                } catch (err) {
                    console.error("Error in focus effect:", err);
                    if (showLoader) setLoading(false);
                }
            };

            // ✅ First fetch with loader
            fetchData(true);

            // ✅ Interval fetch without loader
            const intervalId = setInterval(() => {
                if (isActive) fetchData(false);
            }, 15000);

            return () => {
                isActive = false;
                if (watchId) Geolocation.clearWatch(watchId);
                clearInterval(intervalId);
            };

        }, [employees.empid, dispatch])
    );


    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', flexWrap: 'wrap', elevation: 16, paddingHorizontal: 10, rowGap: 10 }}>

                {/* 👤 Profile & Employee Info */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleProfile}>
                        <Image
                            source={
                                aboutInfo?.profile_img_url
                                    ? { uri: aboutInfo.profile_img_url }
                                    : require("../assets/images/profile.png") // fallback local image
                            }
                            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#c5c5c5ff" }}
                        />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', textTransform: "capitalize" }}>{employees.empname ?? 'Loading...'}</Text>
                        <View style={{ flexDirection: "row" }}>
                            <View style={styles.dot} />
                            <Text style={{ fontSize: 12, color: 'gray' }}>{employees.empcode ?? ''}</Text>
                        </View>
                    </View>
                </View>

                {/* ⏱ Check In/Out Button */}
                <View style={{ padding: 16, backgroundColor: '#fff', flex: 1, alignItems: 'flex-end' }}>
                    {isPunchedIn.active != 1 && isPunchedIn ? (
                        ismobatt == '1' ? (
                            <TouchableOpacity
                                style={{ width: 100, height: 50, borderColor: '#E53935', borderRadius: 75, justifyContent: 'cenetr', alignItems: 'flex-end', alignSelf: 'center', padding: 10 }}
                                onPress={() => {
                                    setShowPunchCard(true);
                                    Geolocation.getCurrentPosition(
                                        pos => setLocation(pos.coords),
                                        err => console.warn("Checkout location error:", err.message),
                                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 5000 }
                                    );
                                    // getAddress(location);
                                }}>
                                <MaterialIcons name="fingerprint" size={30} color="green" />
                                <Text style={{ fontWeight: 'bold', fontSize: 12, color: 'green' }}>Check In</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={{ width: "80%", height: 45, borderColor: '#E53935', borderRadius: 75, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', padding: 10 }} onPress={() => showCustomAlert('FAILED', "Mobile punching not allowed", false)}>
                                <MaterialIcons name="fingerprint" size={30} color="#AAA" />
                                <Text style={{ fontWeight: 'bold', fontSize: 12, color: '#AAAAAA' }}>Check In</Text>
                            </TouchableOpacity>
                        )
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around' }}>
                            <TouchableOpacity
                                style={{ width: 100, height: 50, borderColor: '#E53935', borderRadius: 75, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', padding: 10 }}
                                onPress={() => {
                                    setShowPunchCard(true);
                                    Geolocation.getCurrentPosition(
                                        pos => setLocation(pos.coords),
                                        err => console.warn("Checkout location error:", err.message),
                                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 5000 }
                                    );

                                }}>
                                <MaterialIcons name="fingerprint" size={30} color="#E53935" />
                                <Text style={{ color: "#E53935" }}>Check Out</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ℹ️ Info & Timing */}
                <View style={{ flexDirection: "row", backgroundColor: "white", justifyContent: "space-between", paddingLeft: 10, width: "100%" }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: "45%" }}>
                        <Ionicons name="ellipse-outline" size={10} style={{ backgroundColor: "green", borderRadius: 40, color: "green", marginTop: 6, marginRight: 5 }} />
                        <Text style={{ fontSize: 16, color: '#333' }}>In : {isPunchedIn.time || "--:--:--"}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: "45%" }}>
                        <Ionicons name="ellipse-outline" size={10} style={{ backgroundColor: "#E53935", borderRadius: 40, color: "#E53935", marginTop: 6, marginRight: 5 }} />
                        <Text style={{ fontSize: 16, color: '#E53935' }}>out : {isPunchedIn.outtime || "--:--:--"}</Text>
                    </View>
                    <View style={{ width: "10%" }}>
                        <Ionicons name="information-circle-outline" size={24} color="#E53935" onPress={() => handleInfo(employees.empid)} />
                    </View>
                </View>
            </View>

            {/* 📸 Punch Card View */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={80}>
                    <View style={{ padding: 16, backgroundColor: '#fff', flexDirection: 'row' }}>
                        {showPunchCard && (
                            <ScrollView>
                                <View style={{ marginVertical: 20, backgroundColor: '#fff', padding: 15, borderRadius: 12, elevation: 8, alignItems: 'center', width: '95%', alignSelf: 'center' }}>
                                    <View style={{ backgroundColor: '#E53935', padding: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12, width: '100%', borderBottomWidth: 1, borderBottomColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{new Date().toDateString()}</Text>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', flex: 1 }}>Attendance</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setCapturedImage(null);   // image reset
                                                setLocation(null);        // location reset
                                                setRemark("");            // remark reset
                                                setShowPunchCard(false);  // card close
                                            }}
                                        >
                                            <Ionicons name="close" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, width: '100%' }}>
                                        {capturedImage?.uri && (
                                            <View style={{ width: 80, height: 80, backgroundColor: '#fff', borderRadius: 40, justifyContent: 'flex-start', alignItems: 'center', marginLeft: 10, overflow: 'hidden', elevation: 4 }}>
                                                <Image source={{ uri: capturedImage.uri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                                            </View>
                                        )}

                                        <TouchableOpacity style={{ backgroundColor: '#E53935', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 10, elevation: 4 }} onPress={handlePunch}>
                                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 }}>{!capturedImage?.uri ? ("📷 Take Selfie") : ("📷 Take Again")}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={{ color: '#E53935', fontSize: 14, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#ddd', width: '100%', paddingBottom: 8, textAlign: 'center' }}>
                                        {!location
                                            ? 'Please wait, trying to fetch location...'
                                            : `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                                    </Text>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, marginTop: 10 }}>
                                        <View style={{ flex: 1, marginRight: 10 }}>
                                            <TextInput style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, backgroundColor: '#f9f9f9', color: '#000' }}
                                                placeholder="Enter Remark" placeholderTextColor="#888" multiline numberOfLines={4} value={remark} onChangeText={(text) => setRemark(text)} />
                                        </View>
                                        {
                                            location && (
                                                <TouchableOpacity style={{ backgroundColor: '#e53935', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 }} onPress={handleAttandance}>
                                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit</Text>
                                                </TouchableOpacity>
                                            )
                                        }

                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>

            {
                !showPunchCard && (
                    <ScrollView contentContainerStyle={styles.newSections} showsVerticalScrollIndicator={false}>
                        {/* Top to bottom sections */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Leave this week</Text>

                            <ScrollView>
                                {
                                    // Filtered leaves of this week
                                    (leavePersion
                                        ?.filter(p => {
                                            // Exclude notifyIds
                                            const notifyIds = p.notify?.split(",") || [];
                                            if (notifyIds.includes(String(employee?.empid))) return false;

                                            // Parse leave dates
                                            const leaveFrom = new Date(p.fdate);
                                            const leaveTo = new Date(p.tdate);

                                            return (
                                                (leaveFrom >= thisWeekStart && leaveFrom <= thisWeekEnd) ||
                                                (leaveTo >= thisWeekStart && leaveTo <= thisWeekEnd) ||
                                                (leaveFrom <= thisWeekStart && leaveTo >= thisWeekEnd)
                                            );
                                        }) ?? []
                                    ).length > 0 ? (

                                        leavePersion
                                            .filter(p => {
                                                const notifyIds = p.notify?.split(",") || [];
                                                if (notifyIds.includes(String(employee?.empid))) return false;

                                                const leaveFrom = new Date(p.fdate);
                                                const leaveTo = new Date(p.tdate);

                                                return (
                                                    (leaveFrom >= thisWeekStart && leaveFrom <= thisWeekEnd) ||
                                                    (leaveTo >= thisWeekStart && leaveTo <= thisWeekEnd) ||
                                                    (leaveFrom <= thisWeekStart && leaveTo >= thisWeekEnd)
                                                );
                                            })
                                            .map((p, index) => (
                                                <View key={index} style={styles.rowWithIcon}>
                                                    <Ionicons
                                                        name="person-outline"
                                                        size={20}
                                                        color="#E53935"
                                                        style={styles.iconLeft}
                                                    />
                                                    <Text style={[styles.bdayName, { fontSize: 12 }]}>
                                                        {p.applyby_name} ({p.fdate} - {p.tdate}) -
                                                        <Text
                                                            style={{
                                                                color:
                                                                    p.status == 0
                                                                        ? '#FFC107'
                                                                        : p.status == 1
                                                                            ? 'green'
                                                                            : 'red'
                                                            }}
                                                        >
                                                            {p.status == 0 ? 'P' : p.status == 1 ? 'A' : 'R'}
                                                        </Text>
                                                    </Text>
                                                </View>
                                            ))
                                    ) : (

                                        <Text style={{ textAlign: 'center', marginTop: 10, color: 'gray' }}>
                                            No leaves this week
                                        </Text>
                                    )
                                }
                            </ScrollView>
                        </View>

                        {/* Wish them section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Wish them</Text>
                            {birthdays.length === 0 ? (
                                <View style={{ paddingVertical: 10 }}>
                                    <Text style={{ fontSize: 14, color: 'gray' }}>No birthdays this month.</Text>
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {birthdays.map((person, index) => {
                                        const name = person.empname;
                                        const [year, month, day] = person.dob.split("-");
                                        const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
                                        const displayDate = `${day} ${new Date(person.dob).toLocaleString('default', { month: 'short' })}`;

                                        const today = new Date();
                                        const birthdayDate = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
                                        const isUpcoming = birthdayDate >= new Date(today.setHours(0, 0, 0, 0));

                                        return (
                                            <View key={index} style={{ alignItems: 'center', marginRight: 15 }}>
                                                <View style={[
                                                    styles.birthdayIcon,
                                                    {
                                                        backgroundColor: isUpcoming ? '#4CAF50' : '#BDBDBD' // Green for upcoming, Grey for past
                                                    }
                                                ]}>
                                                    <Text style={{ color: '#fff' }}>{initials}</Text>
                                                </View>
                                                <View>
                                                    <Text style={[
                                                        styles.bdayName,
                                                        { color: isUpcoming ? '#333' : '#888' } // grey text if birthday is past
                                                    ]}>
                                                        {name}
                                                    </Text>
                                                    <Text style={[
                                                        styles.bdayDate,
                                                        { color: isUpcoming ? '#333' : '#aaa' }
                                                    ]}>
                                                        {displayDate}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        {/* Announcements */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Announcements</Text>
                            <ScrollView>
                                <Text style={styles.sectionSub}>No announcements for now</Text>
                            </ScrollView>
                        </View>

                        {/* Wall Section */}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Wall</Text>

                            {latestPost ? (
                                <TouchableOpacity
                                    style={styles.wallCard}
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate('Wall', { post: latestPost })}
                                >
                                    {/* User Image */}
                                    <Image
                                        source={
                                            latestPost?.profile_img
                                                ? { uri: `https://chaaruvi.com/hrms/Mobileapp/profile_img/${latestPost.profile_img}` }
                                                : require('../assets/images/profile.png') // fallback image
                                        }
                                        style={styles.wallAvatar}
                                    />

                                    <View style={{ flex: 1 }}>
                                        {/* Name + Post Text */}
                                        <Text style={styles.wallName}>{latestPost?.empname}</Text>
                                        <Text style={styles.wallText}>{latestPost?.post_text}</Text>
                                        <Text style={styles.wallDate}>
                                            {new Date(latestPost?.created_at).toLocaleString()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <Text style={styles.sectionSub}>There are no posts here</Text>
                                    <TouchableOpacity
                                        style={styles.postBtn}
                                        onPress={() => navigation.navigate('CreatePost')}
                                    >
                                        <Text style={styles.postBtnText}>Create first post</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {/* holiday Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Upcoming holidays</Text>

                            {holidayList?.filter(holiday => {
                                const today = new Date();
                                const holidayDate = new Date(holiday.fdate); // fdate = YYYY-MM-DD
                                return holidayDate >= new Date(today.setHours(0, 0, 0, 0));
                            }).length === 0 ? (
                                // ✅ Show message if no holidays
                                <Text style={{ color: "#888", marginTop: 10, fontStyle: "italic" }}>
                                    No upcoming holidays 🎉
                                </Text>
                            ) : (
                                // ✅ Otherwise show holidays
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ref={scrollRef}
                                >
                                    {holidayList
                                        ?.filter(holiday => {
                                            const today = new Date();
                                            const holidayDate = new Date(holiday.fdate);
                                            return holidayDate >= new Date(today.setHours(0, 0, 0, 0));
                                        })
                                        .map((holiday, index) => {
                                            const today = new Date();
                                            const holidayDate = new Date(holiday.fdate);
                                            const isUpcoming = holidayDate >= new Date(today.setHours(0, 0, 0, 0));

                                            return (
                                                <View
                                                    key={index}
                                                    style={[
                                                        styles.holidayCard,
                                                        {
                                                            backgroundColor: isUpcoming ? "#f0e9e9ff" : "#F5F5F5",
                                                            opacity: isUpcoming ? 1 : 0.6
                                                        }
                                                    ]}
                                                >
                                                    <Ionicons
                                                        name="calendar-outline"
                                                        size={16}
                                                        color={isUpcoming ? "#E53935" : "#BDBDBD"}
                                                        style={{ marginRight: 5 }}
                                                    />
                                                    <View>
                                                        <Text
                                                            style={[
                                                                styles.holidayTitle,
                                                                { color: isUpcoming ? "#333" : "#888" }
                                                            ]}
                                                        >
                                                            {holiday.hname}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.holidayDate,
                                                                { color: isUpcoming ? "#333" : "#aaa" }
                                                            ]}
                                                        >
                                                            {moment(holiday.fdate).format("DD MMM, YYYY")}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                </ScrollView>
                            )}
                        </View>
                    </ScrollView>
                )
            }
        </SafeAreaView >
    );
};
export default HomeScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' }, // Main screen background
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', flexWrap: "wrap", elevation: 16, paddingHorizontal: 10 }, // Top header
    headerLeft: { flexDirection: 'row', alignItems: 'center' }, // Left section in header
    profilePic: { width: 40, height: 40, borderRadius: 20 }, // Profile picture
    heyText: { fontSize: 16, fontWeight: 'bold' }, // "Hey" text
    empCode: { fontSize: 12, color: 'gray' }, // Employee code
    dot:{
    backgroundColor: '#4ade80',
    width: 15,
    height: 15,
    borderRadius: 10,
    borderWidth:3,
    borderColor:'#f7f8fc',
    },
    punchCard: { marginVertical: 20, backgroundColor: '#fff', padding: 15, borderRadius: 12, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3, alignItems: 'center', width: '95%', alignSelf: 'center' }, // Punch in/out card
    cardHeader: { backgroundColor: '#E53935', padding: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12, width: '100%', borderBottomWidth: 1, borderBottomColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, // Card header
    cardHeaderText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }, // Card header text
    cardHeaderTitle: { textAlign: 'center', flex: 1 }, // Card title center align

    userInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, width: '100%' }, // User info row
    userInfoText: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#ddd', marginLeft: 15 }, // User name/id container
    userName: { fontSize: 16, fontWeight: 'bold' }, // User name text
    userId: { fontSize: 14, color: 'gray' }, // User ID text
    userImageWrapper: { width: 80, height: 80, backgroundColor: '#fff', borderRadius: 40, justifyContent: 'flex-start', alignItems: 'center', marginLeft: 10, overflow: 'hidden', elevation: 4 }, // Profile image container
    userImage: { width: 80, height: 80, borderRadius: 40 }, // Profile image

    selfieBtn: { backgroundColor: '#E53935', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 }, // Take selfie button
    selfieBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 }, // Selfie button text

    locationText: { color: '#E53935', fontSize: 14, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#ddd', width: '100%', paddingBottom: 8, textAlign: 'center' }, // Location text

    footerRow: { flexDirection: 'row', alignItems: 'center', padding: 10, marginTop: 10 }, // Footer row
    inputWrapper: { flex: 1, marginRight: 10 }, // Input wrapper
    remarkInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, backgroundColor: '#f9f9f9', color: '#000' }, // Remark input field

    submitBtn: { marginTop: 5, backgroundColor: '#E53935', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 }, // Submit button
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }, // Submit button text

    cardTimeText: { color: '#000', fontSize: 14, marginBottom: 8 }, // Time text inside card

    statusCard: { backgroundColor: '#f2f7fd', padding: 12, marginVertical: 10, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#007AFF', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 }, // Status card
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 }, // Status row
    statusText: { fontSize: 14, marginLeft: 8, color: '#333' }, // Status label

    punchContainer: { padding: 16, backgroundColor: '#fff', flexDirection: "row" }, // Punch container row
    time: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' }, // Punch time
    date: { fontSize: 14, color: 'gray', marginBottom: 10, textAlign: 'center' }, // Punch date

    circle: { width: 100, height: 50, borderColor: '#E53935', borderRadius: 75, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', padding: 10 }, // Punch in circle button
    punchText: { fontWeight: 'bold', fontSize: 12, color: 'green' }, // Punch in text
    punchOutRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around' }, // Punch out row
    dotBullet: { fontSize: 50, color: '#E53935', alignSelf: "flex-start" }, // Dot for in-time
    timeText: { fontSize: 16, color: '#333' }, // Time value

    dotBulletOut: { fontSize: 50, alignSelf: "flex-start" }, // Dot for out-time
    timeTextOut: { fontSize: 16, color: '#E53935' }, // Out-time text
    punchOutBtn: { width: 100, height: 50, borderColor: '#E53935', borderRadius: 75, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', padding: 10 }, // Punch out button

    disabledCircle: { backgroundColor: '#EFEFEF' }, // Disabled circle background
    disabledText: { color: '#AAAAAA' }, // Disabled text color

    section: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 15, borderRadius: 8, marginTop: 10, width: '100%' }, // Generic section container
    sectionTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 20 }, // Section heading
    sectionSub: { fontSize: 12, color: '#777', textAlign: 'center' }, // Section subtext

    birthdayRow: { flexDirection: 'column', alignItems: 'flex-start' }, // Birthday list vertical
    birthdayIcon: { width: 35, height: 35, borderRadius: 18, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center', marginRight: 8 }, // Birthday icon container
    rowWithIcon: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 }, // Row with icon
    iconLeft: { marginRight: 8 }, // Space beside icon
    bdayName: { fontWeight: 'bold' }, // Birthday name
    birthdayItem: { alignItems: 'center', marginRight: 10 }, // Individual birthday item

    postBtn: { backgroundColor: '#E53935', padding: 6, borderRadius: 5, alignSelf: 'center', marginTop: 5 }, // Post button
    postBtnText: { color: '#fff', fontSize: 12 }, // Post button text

    holidayCard: {
        backgroundColor: '#f0e9e9',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        elevation: 4,                 // shadow for Android
        shadowColor: "#000",          // shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        minWidth: 180,
        marginBottom: 10
    },

    holidayTitle: { fontWeight: 'bold' }, // Holiday title
    holidayDate: { fontSize: 12, color: '#555' }, // Holiday date

    newSections: { padding: 16 }, // Section padding

    wallCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 2,
    },
    wallAvatar: {
        width: 50,
        height: 50,
        borderRadius: 24,
        marginRight: 10,
        backgroundColor: "#cdcdcdff"
    },
    wallName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 3,
    },
    wallText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    wallDate: {
        fontSize: 11,
        color: 'gray',
    },

});


