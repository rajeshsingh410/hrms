import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const CameraScreen = ({ route }) => {
    const cameraRef = useRef(null);
    const { mode } = route.params || {};
    const navigation = useNavigation();
    const devices = useCameraDevices();

    const [selectedDevice, setSelectedDevice] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    // Permission request function
    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Camera Permission",
                        message: "App ko camera use karne ki permission chahiye",
                        buttonPositive: "OK",
                        buttonNegative: "Cancel",
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        } else {
            // iOS handled via Info.plist
            return true;
        }
    };

    // Set device after permission granted and devices loaded
    useEffect(() => {
        const setupCamera = async () => {
            if (devices.length === 0) return; // wait until devices load
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
                Alert.alert("Permission Denied", "Camera access allow kare bina photo nahi li ja sakti");
                return;
            }

            const front = devices.find(d => d.position === 'front');
            const back = devices.find(d => d.position === 'back');

            const device = isFrontCamera ? front : back;
            if (device) {
                setSelectedDevice(device);
                setIsCameraReady(true);
            }
        };

        setupCamera();
    }, [devices, isFrontCamera]);

    const toggleCamera = () => {
        setIsFrontCamera(prev => !prev);
    };

    const takePicture = async () => {
        if (isCapturing || !cameraRef.current) return;

        try {
            setIsCapturing(true);
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
                qualityPrioritization: 'balanced',
                photoCodec: 'jpeg',
                skipMetadata: false,
            });

            const capturedImage = {
                uri: `file://${photo.path}`,
                name: mode === 'attendance' ? 'selfie.jpg' : 'profile.jpg',
                type: 'image/jpeg',
                shouldUpload: true,
            };

            if (mode === 'attendance') {
                navigation.navigate('MainTabs', { screen: 'Home', params: { capturedImage } });
            } else if (mode === 'profile_img') {
                navigation.navigate('Profile', { capturedImage });
            } else {
                navigation.navigate('CreatePost', { capturedImage });
            }

        } catch (error) {
            console.error('Error capturing photo:', error);
            Alert.alert('Error', 'Failed to capture photo.');
        } finally {
            setIsCapturing(false);
        }
    };

    if (!selectedDevice || !isCameraReady) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: 'white', fontSize: 16 }}>Loading Camera...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={selectedDevice}
                isActive={true}
                photo={true}
            />

            <View style={styles.controls}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={35} color="red" />
                </TouchableOpacity>

                {mode !== 'attendance' && (
                    <TouchableOpacity onPress={toggleCamera} style={styles.switchBtn}>
                        <Ionicons name="camera-reverse-outline" size={35} color="white" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={takePicture} style={styles.captureBtn}>
                    <Ionicons name="camera-outline" size={28} color="black" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    controls: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureBtn: {
        width: 70,
        height: 70,
        borderRadius: 40,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        position: 'absolute',
        left: 35,
        top: 20,
        backgroundColor: 'rgba(147, 146, 146, 0.9)',
        borderRadius: 40,
        padding: 5,
    },
    switchBtn: {
        position: 'absolute',
        right: 30,
        top: 20,
    },
});

export default CameraScreen;
