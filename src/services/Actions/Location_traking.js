import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import axios from 'axios';

// const BASE_URL = 'http://10.0.2.2:80/HRMS/controller';
const BASE_URL = 'https://chaaruvi.com/hrms/Mobileapp/';
let trackingInterval = null;

// ✅ Single Permission Checker
export const requestLocationPermission = async () => {
    let permissionStatus;

    if (Platform.OS === 'android') {
        permissionStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

        if (permissionStatus === RESULTS.DENIED) {
            permissionStatus = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        }
    } else if (Platform.OS === 'ios') {
        permissionStatus = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

        if (permissionStatus === RESULTS.DENIED) {
            permissionStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        }
    }

    if (permissionStatus !== RESULTS.GRANTED) {
        Alert.alert(
            'Location Permission Required',
            'Please enable GPS to track your activity.',
            [
                { text: 'Go to Settings', onPress: () => openSettings() },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
        return false;
    }

    return true;
};

// ✅ Start Tracking
export async function startTracking(outid, empid) {
    console.log('Starting location tracking for:', outid, empid);

    const hasPermission = await requestLocationPermission();
    console.log('Location permission granted:', hasPermission);

    if (!hasPermission) return;
    console.log(">>>>.1",hasPermission);
    
    trackingInterval = setInterval(() => {
        console.log(">>>>.2");
        Geolocation.getCurrentPosition(
            async (position) => {
                console.log(">>>>.3");
                const { latitude, longitude, accuracy } = position.coords;
                console.log(`Location fetched: ${latitude}, ${longitude} (Accuracy: ${accuracy}m)`);
                const tracked_at = new Date().toISOString();

                try {
                    const res = await axios.post(`${BASE_URL}/trackLocation.php`, {
                        action: 'trackLocation',
                        outid,
                        empid,
                        latitude,
                        longitude,
                        accuracy,
                        tracked_at
                    });

                    console.log('Location sent successfully:', res.data);
                } catch (err) {
                    console.log('Error sending location:', err.message);
                }
            },
            (error) => console.log('Geolocation error:', error),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    }, 60000); // 1 minute interval
}

// ✅ Stop Tracking
export function stopTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
}
