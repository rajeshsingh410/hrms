import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const AllScreen = ({ navigation }) => {
  const menuItems = [
    { title: 'Attendance', icon: 'calendar-outline', screen: 'Attendance' },
    { title: 'LeaveList', icon: 'airplane-outline', screen: 'LeaveList' },
    { title: 'Task', icon: 'book-outline' , screen : 'My_Task'},
    { title: 'Timesheet', icon: 'time-outline' },
    { title: 'Finance', icon: 'document-text-outline' }, // renamed Payslip
    { title: 'Notices', icon: 'notifications-outline', screen : 'Notices'}, // renamed Notice Board
    { title: 'Holidays', icon: 'sparkles-outline' , screen : 'Holiday'},
    { title: 'Asset', icon: 'cube-outline' , screen : 'AssetReport'},
    { title: 'Assessments', icon: 'clipboard-outline' },
    { title: 'Announcement', icon: 'megaphone-outline' },
    { title: 'Complain/Suggestion', icon: 'chatbubble-ellipses-outline' },
    { title: 'Outside Activity', icon: 'walk-outline' , screen : 'Activity'},
    { title: 'Gate Pass', icon: 'exit-outline' , screen : 'GatePass'},
  ];

  const handlePress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      alert(`${item.title} page not linked yet.`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={styles.container}>
        {/* <Text style={styles.heading}>Manu</Text> */}

        <ScrollView contentContainerStyle={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => handlePress(item)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={36} color="#E53935" />
              </View>
              <Text style={styles.cardText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </View>
    </KeyboardAvoidingView>
  );
};

export default AllScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
    textAlign: 'start',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width / 2) - 24,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    padding: 15,
    borderRadius: 50,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});
