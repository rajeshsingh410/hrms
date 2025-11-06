import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../services/Actions/employeeAction';

const CustomHeader = ({
  companyName,
  employeeName,
  navigation,
}) => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser(navigation));
  };

  return (
    <>
      <StatusBar hidden={true} />
      <View style={styles.container}>
        <View style={styles.topRow}>
          {/* 🏢 Company Icon + Name on left */}
          <View style={styles.leftSection}>
            <Ionicons name="business-outline" size={28} color="white" style={styles.companyIcon} />
            <Text numberOfLines={1} style={styles.companyName}>{companyName}</Text>
          </View>

          {/* 🔒 Logout icon on right */}
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E53935',
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIcon: {
    marginRight: 8,
  },
  companyName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
  },
  iconButton: {
    paddingVertical: 8,
  },
});
