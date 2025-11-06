// navigation/TabNavigator.js
import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Text,
  BackHandler,
  ToastAndroid,
  Alert,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  useNavigation,
  useNavigationState,
  useFocusEffect,
} from '@react-navigation/native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import WallPost from '../screens/WallPost';
import AboutMe from '../screens/AboutMe';
import MyTeam from '../screens/MyTeam';
import AllScreen from '../screens/AllScreen';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconMap = {
          Home: 'home-outline',
          Wall: 'albums-outline',
          Me: 'person-outline',
          'My Team': 'people-outline',
          Manu: 'apps-outline',
        };
        const iconName = iconMap[route.name] || 'ellipse-outline';

        return (
          <TouchableOpacity
            key={route.name}
            onPress={() => {
              if (route.name === 'My Team') {
                Alert.alert('Upcoming!', 'This feature will be available soon.');
              } else {
                navigation.navigate(route.name);
              }
            }}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            <View
              style={[styles.iconCircle, isFocused && styles.iconCircleFocused]}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? '#fff' : 'gray'}
              />
            </View>
            <Text
              style={[styles.label, isFocused ? styles.labelFocused : null]}
            >
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const TabNavigator = () => {
  const navigation = useNavigation();
  const navState = useNavigationState((state) => state);
  const currentTab =
    navState?.routes?.[navState.index]?.state?.routes?.[
      navState?.routes?.[navState.index]?.state?.index
    ]?.name ?? 'Home';

  useFocusEffect(
    React.useCallback(() => {
      let backPressedOnce = false;

      const handleBackPress = () => {
        if (currentTab === 'Home') {
          if (backPressedOnce) {
            BackHandler.exitApp();
          } else {
            backPressedOnce = true;
            ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
            setTimeout(() => {
              backPressedOnce = false;
            }, 2000);
            return true;
          }
        } else {
          // Go to Home tab using nested navigation
          navigation.navigate('MainTabs', { screen: 'Home' });
          return true;
        }
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );

      return () => backHandler.remove();
    }, [currentTab, navigation])
  );

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Wall" component={WallPost} />
          <Tab.Screen name="Me" component={AboutMe} />
          <Tab.Screen name="My Team" component={MyTeam} />
          <Tab.Screen name="Manu" component={AllScreen} />
        </Tab.Navigator>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 15,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleFocused: {
    backgroundColor: '#D9534F',
    borderRadius: 22,
  },
  label: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
  labelFocused: {
    color: '#D9534F',
    fontWeight: '600',
  },
});
