// navigation/StackNavigater.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

// Screens & Components
import TabNavigater from './TabNavigater';
import AttendanceHistory from '../screens/AttendanceHistory';
import LoginUser from '../screens/LoginUser';
import LeaveReqScreen from '../screens/LeaveReqScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CustomHeader from '../components/CustomHeader';
import SplashScreen from '../screens/SplashScreen';
import LoginWithOtp from '../screens/LoginWithOtp';
import Forget_Password from '../screens/Forget_Password';
import Attendance_rec from '../screens/Attendance_rec';
import WallPostForm from '../screens/WallPostForm';
import PollScreen from '../screens/PollScreen';
// import WallPost from '../screens/WallPost';
import CameraScreen from '../screens/CameraScreen';
import LeaveList from '../screens/LeaveList';
import Assets from '../screens/Assets';
import GatePass from '../screens/GatePass';
import Notices from '../screens/Notices';
import Expenses from '../screens/Expenses';
import Activity from '../screens/Activity';
import Holiday from '../screens/Holiday';
import My_Task from '../screens/My_Task';
import TaskHistory from '../screens/TaskModules/TaskHistory';

// import PaySlip from '../screens/Finances/PaySlip';
// import Mypay from '../screens/Finances/Mypay';

const Stack = createStackNavigator();

// Function to get current tab title from route
function getTabTitle(route) {
  return getFocusedRouteNameFromRoute(route) ?? 'Home';
}

const StackNavigater = () => {
  // ✅ useSelector hook must be inside the component
  const { employee } = useSelector((state) => state.employee);
  const COMPANY_NAME = employee?.branch_name || "Company";

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: ({ back, options }) => (
          <CustomHeader
            companyName={COMPANY_NAME}
            title={
              route.name === 'MainTabs'
                ? getTabTitle(route)
                : options.title || route.name
            }
            canGoBack={!back}
            navigation={navigation}
          // onLogout={() => navigation.replace('Login')}
          />
        ),
        headerStyle: { height: 70 }
      })}
    >
      {/* Screens */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Login"
        component={LoginUser}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ForgetPassword"
        component={Forget_Password}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="LoginOtp"
        component={LoginWithOtp}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="MainTabs"
        component={TabNavigater}
      />

      <Stack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Attendance_rec"
        component={Attendance_rec}
        options={{ title: 'Attendance_rec' }}
      />

      <Stack.Screen
        name="Attendance"
        component={AttendanceHistory}
        options={{ title: '' }}
      />

      <Stack.Screen
        name="Leave"
        component={LeaveReqScreen}
        options={{ title: 'Leave Request' }}
      />

      <Stack.Screen
        name="LeaveList"
        component={LeaveList}
        options={{ title: 'Leave List' }}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />

      <Stack.Screen
        name="CreatePost"
        component={WallPostForm}
        options={{ title: 'Create Post' }}
      />

      <Stack.Screen
        name="PullScreen"
        component={PollScreen}
        options={{ title: 'Create Poll' }}
      />

      <Stack.Screen
        name="AssetReport"
        component={Assets}
        options={{ title: 'Create Poll' }}
      />

      <Stack.Screen
        name="GatePass"
        component={GatePass}
        options={{ title: 'Create Poll' }}
      />

      <Stack.Screen
        name="Notices"
        component={Notices}
        options={{ title: 'Notices' }}
      />

      {/* finances */}

      <Stack.Screen
        name='ExpensesScreen'
        component={Expenses}
      />

      {/* outSide actiovity screen   */}
      <Stack.Screen
        name="Activity"
        component={Activity}
        options={{ title: 'Create Poll' }}
      />

      {/* holoday List screen  */}
      <Stack.Screen
        name="Holiday"
        component={Holiday}
        options={{ title: 'Create Poll' }}
      />
    {/*task screens  */}

      <Stack.Screen
        name="My_Task"
        component={My_Task}
        options={{ title: 'My Task' }}
      />

      <Stack.Screen 
        name="TaskHistory"
        component={TaskHistory}
        options={{title : 'Task History'}}
      />
    </Stack.Navigator>
  );
};

export default StackNavigater;
