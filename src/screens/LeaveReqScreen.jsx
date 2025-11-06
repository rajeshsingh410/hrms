import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, SafeAreaView, KeyboardAvoidingView,
  Platform, TextInput, Image
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import DropDownPicker from 'react-native-dropdown-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SweetAlert from 'react-native-sweet-alert';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import ImageResizer from 'react-native-image-resizer';
import { getChackLeaveAvility, getLeaveAsync, LeaveRequestAsync } from '../services/Actions/employeeAction';
import { useLoading } from '../navigation/LoadingContext';

const LeaveReqScreen = ({ route }) => {
  const { date, id } = route.params || {};

  const { employee } = useSelector(state => state.employee);

  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [leaveType, setLeaveType] = useState(null);
  const [items, setItems] = useState([]);
  const [reason, setReason] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [days, setDays] = useState(0);
  const [showCal, setShowCal] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Contact list states
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);

  const [isAvilabelLeave, setIsAvilableLeave] = useState({
    available_leave: '',
    message: ''
  })

  const { loading, setLoading } = useLoading();

  useEffect(() => {
    if (date) {
      setFromDate(date);
      setStart(date);
      setToDate(date)
      setSelectedDates([{ date: date, mode: 'full', halfType: null }]);
      setDays(1);
    }
  }, [date]);

  const onDayPress = (day) => {
    if (!start || (start && end)) {
      setStart(day.dateString);
      setEnd('');
      setFromDate(day.dateString);
      setToDate('');
      setDays(1);
      setSelectedDates([{ date: day.dateString, mode: 'full', halfType: null }]);
    } else {
      setEnd(day.dateString);
      setToDate(day.dateString);
      const d1 = new Date(start);
      const d2 = new Date(day.dateString);
      const diff = (d2 - d1) / (1000 * 3600 * 24) + 1;
      setDays(diff > 0 ? diff : 1);
      setShowCal(false);

      const temp = [];
      const tempDate = new Date(start);
      while (tempDate <= d2) {
        const formatted = tempDate.toISOString().split('T')[0];
        temp.push({ date: formatted, mode: 'full', halfType: null });
        tempDate.setDate(tempDate.getDate() + 1);
      }
      setSelectedDates(temp);
    }
  };

  const marked = {};
  if (start) marked[start] = { startingDay: true, color: '#E53935', textColor: '#fff' };
  if (end) {
    let cur = new Date(start);
    const last = new Date(end);
    while (cur <= last) {
      const ds = cur.toISOString().split('T')[0];
      marked[ds] = {
        color: ds === start ? '#E53935' : ds === end ? '#E53935' : '#FFCDD2',
        textColor: '#000',
        startingDay: ds === start,
        endingDay: ds === end,
      };
      cur.setDate(cur.getDate() + 1);
    }
  }

  const handlePickFileOrImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo', // ✅ sirf image
        includeBase64: false,
        selectionLimit: 1,
        includeExtra: true,
      },
      async (response) => {
        if (response.didCancel) {
          console.log('User cancelled picker');
        } else if (response.errorCode) {
          console.log('Picker Error: ', response.errorMessage);
        } else {
          try {
            setLoading(true); // ✅ loader start

            const asset = response.assets[0];

            // ✅ Resize image (sirf resize, rotation nahi hoga)
            const resizedImage = await ImageResizer.createResizedImage(
              asset.uri,
              800,
              800,
              'JPEG',
              80,
              0
            );

            setAttachment({
              uri: resizedImage.uri,
              name: asset.fileName || `resized_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
            });

          } catch (err) {
            console.log("Image resize error:", err);
          } finally {
            setLoading(false); // ✅ loader stop
          }
        }
      }
    );
  };


  const calculateTotalDays = () => {
    let total = 0;
    selectedDates.forEach(item => {
      total += item.mode === 'half' ? 0.5 : 1;
    });
    return total;
  };

  //get Leave types from Backend 
  useEffect(() => {
    dispatch(getLeaveAsync())
      .then((res) => {
        const leaveArray = res?.leaveTypes || [];
        const employeeArray = res?.employees || [];

        // Leave types for dropdown
        const formattedLeaves = leaveArray.map((item) => ({
          label: item?.leave_type || "N/A",
          value: item?.leaveid || 0
        }));

        setItems(formattedLeaves);

        // Employees for notify list
        const formattedEmployees = employeeArray.map((emp) => ({
          id: emp.empid?.toString() || Math.random().toString(),
          name: emp.empname || "Unknown",
          selected: false
        }));
        setContacts(formattedEmployees);
      })
      .catch((err) => {
        console.log("Error fetching leave data:", err);
        setItems([]);
        setContacts([]);
      });
  }, [dispatch]);


  const toggleContactSelection = (id) => {

    const updated = contacts.map((c) =>
      c.id === id ? { ...c, selected: !c.selected } : c
    );
    setContacts(updated);
    setSelectedContacts(updated.filter(c => c.selected).map(c => c.id));
  };

  // chack Avilablety by Leave at the date 
  const handleChackLeaveAvility = (selectedLeave) => {
    const payload = {
      leaveType: selectedLeave,
      empid: employee.empid
    }

    dispatch(getChackLeaveAvility(payload))
      .then((res) => {
        setIsAvilableLeave({
          available_leave: res?.available_leave,
          message: res?.message
        })
      })
      .catch((error) => {
        console.log("error in leave avilaty", error);

      })
  };

  //leave Request
  const handleSubmit = () => {
    const totalDay = calculateTotalDays();
    const today = new Date();

    const selectedLeave = items.find(item => item.value === leaveType);
    const leaveLabel = selectedLeave?.label || "";

    // ✅ Condition check
    if (
      (leaveLabel !== "Unpaid Leave" && isAvilabelLeave?.available_leave === 0)
    ) {
      SweetAlert.showAlertWithOptions({
        title: "Error",
        subTitle: `${leaveLabel} not available`,
        confirmButtonTitle: 'OK',
        confirmButtonColor: "#FFA000",
        style: 'error'
      });

    } else {

      if (!leaveType || !reason || !fromDate || !toDate || totalDay <= 0) {
        SweetAlert.showAlertWithOptions({
          title: "Error",
          subTitle: "Please complete all fields correctly",
          confirmButtonTitle: 'OK',
          confirmButtonColor: "#FFA000",
          style: 'error'
        });
        return;
      }

      const payload = {
        empid: employee.empid,
        leaveType,
        reason,
        fromDate,
        toDate,
        days: totalDay,
        selectedDates,
        selectedContacts,
        attachment,  //image or file (pdf)
      };

      setLoading(true); // ✅ loader start

      dispatch(LeaveRequestAsync(payload))
        .then((res) => {
          SweetAlert.showAlertWithOptions({
            title: res.success ? "Success" : "Error",
            subTitle: res.message,
            confirmButtonTitle: 'OK',
            confirmButtonColor: res.success ? "#28a745" : "#FF0000",
            style: res.success ? 'success' : 'error'
          }, () => {
            if (res.success) {
              handleClear();
            }
          });
        })
        .catch((err) => {
          console.error("Leave request error:", err);
          SweetAlert.showAlertWithOptions({
            title: "Error",
            subTitle: "Something went wrong",
            confirmButtonTitle: 'OK',
            confirmButtonColor: "#FF0000",
            style: 'error'
          });
        })
        .finally(() => {
          setLoading(false); // ✅ loader stop
        });
    }
  };

  console.log("leave type", items);



  const handleClear = () => {
    setLeaveType(null);
    setReason('');
    setFromDate('');
    setToDate('');
    setDays(0);
    setSelectedContacts([]);
    setAttachment(null);
    setSelectedDates([]);
  }

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}><Text style={styles.title}>Apply Leave</Text></View>

          <View style={styles.card}>
            {/* Dates */}
            <View style={styles.datesRow}>
              {['Start Date', 'End Date'].map((label, idx) => {
                const dateValue = idx === 0 ? fromDate : toDate;
                return (
                  <TouchableOpacity key={label} style={styles.datePicker} onPress={() => setShowCal(!showCal)}>
                    <Ionicons name="calendar-outline" size={20} color="#E53935" />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.subTitle}>{label}</Text>
                      <Text style={styles.dateText}>{dateValue}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showCal && <Calendar markingType={'period'} markedDates={marked} onDayPress={onDayPress} style={{ marginTop: 10 }} />}

            {/* Leave Type */}
            <Text style={styles.subTitle}>Leave Type</Text>
            <DropDownPicker
              open={open}
              value={leaveType}
              items={items}
              setOpen={setOpen}
              setValue={setLeaveType}
              setItems={setItems}
              listMode="SCROLLVIEW"
              placeholder="Unpaid Leave"
              style={styles.dropdown}
              searchable={true}
              searchPlaceholder="Search..."
              searchContainerStyle={{
                borderBottomColor: '#ccc',
              }}
              searchTextInputStyle={{
                color: '#000',
              }}
              onChangeValue={(value) => {
                setLeaveType(value);
                handleChackLeaveAvility(value);
              }}
            />
            <Text style={styles.availability}>
              {(() => {
                const selectedLeave = items.find(item => item.value === leaveType);
                const leaveLabel = selectedLeave?.label || "";

                if (leaveLabel === "Unpaid Leave") {
                  // ✅ Always green, even if 0
                  return <Text style={{ color: "green" }}> Available :{" "}</Text>;
                } else {
                  // ✅ Normal condition
                  return isAvilabelLeave?.available_leave > 0 ? (
                    <Text style={{ color: "green" }}> Available :{" "} {isAvilabelLeave?.available_leave}</Text>
                  ) : (
                    <Text style={{ color: "red" }}> Available :{" "}  {isAvilabelLeave?.available_leave}</Text>
                  );
                }
              })()}
            </Text>


            {/* Selected Dates */}
            {selectedDates.length > 0 && leaveType && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.subTitle, { fontWeight: 'bold' }]}>Selected Dates:</Text>
                {selectedDates.map((item, index) => (
                  <View key={index} style={styles.dateRow}>
                    <Text style={styles.dateRowText}>{item.date} - {item.mode === 'full' ? 'Full Day' : 'Half Day'}{item.mode === 'half' ? ` - ${item.halfType === 'first' ? 'First Shift' : 'Second Shift'}` : ''}</Text>
                    <View style={{ flexDirection: "row", width: "100%" }}>
                      <TouchableOpacity style={[styles.radioBtn, { backgroundColor: item.mode === 'full' ? '#E53935' : '#ccc' }]} onPress={() => { const updated = [...selectedDates]; updated[index].mode = 'full'; updated[index].halfType = null; setSelectedDates(updated); }}><Text style={styles.radioText}>Full Day</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.radioBtn, { backgroundColor: item.mode === 'half' ? '#E53935' : '#ccc' }]} onPress={() => { const updated = [...selectedDates]; updated[index].mode = 'half'; updated[index].halfType = 'first'; setSelectedDates(updated); }}><Text style={styles.radioText}>Half Day</Text></TouchableOpacity>
                      {item.mode === 'half' && (
                        <>
                          <TouchableOpacity style={[styles.halfBtn, { backgroundColor: item.halfType === 'first' ? '#E53935' : '#ccc' }]} onPress={() => { const updated = [...selectedDates]; updated[index].halfType = 'first'; setSelectedDates(updated); }}><Text style={styles.radioText}>1st Half</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.halfBtn, { backgroundColor: item.halfType === 'second' ? '#E53935' : '#ccc' }]} onPress={() => { const updated = [...selectedDates]; updated[index].halfType = 'second'; setSelectedDates(updated); }}><Text style={styles.radioText}>2nd Half</Text></TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Note */}
            <Text style={styles.subTitle}>Resion Of Leave *</Text>
            <TextInput style={styles.inputNote} placeholder="Ex: Need to attend a family function." placeholderTextColor="#999" multiline numberOfLines={4} value={reason} onChangeText={setReason} />

            {/* Notify Contacts */}
            <Text style={styles.subTitle}>Notify your teammates</Text>

            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
              {/* Icon Button */}
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowContacts(!showContacts)}
              >
                <Ionicons name="person-add-outline" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Message Box */}
              <View
                style={{
                  marginLeft: 10,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  paddingVertical: 15,
                  paddingHorizontal: 12,
                  backgroundColor: "#f9f9f9",
                  flex: 1,
                }}
              >
                <Text style={{ fontSize: 14, color: "#333" }}>
                  You have notify to {contacts.filter(c => c.selected).length} members
                </Text>
              </View>
            </View>

            {showContacts && (
              <View style={{ marginTop: 10 }}>
                {/* Search Input */}
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search contacts..."
                  placeholderTextColor="#000"
                  value={searchText}
                  onChangeText={setSearchText}
                />

                {/* Contact List */}
                <ScrollView
                  style={[styles.contactList, { maxHeight: 200 }]}
                  nestedScrollEnabled={true}
                >
                  {contacts
                    .filter(contact =>
                      contact.name.toLowerCase().includes(searchText.toLowerCase())
                    )
                    .map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.contactRow}
                        onPress={() => toggleContactSelection(item.id)}
                      >
                        <Ionicons
                          name={item.selected ? "checkbox-outline" : "square-outline"}
                          size={20}
                          color={item.selected ? "#E53935" : "#000"}
                        />
                        <Text style={styles.contactName}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            {/* Attach File */}
            <Text style={[styles.subTitle, { marginTop: 20 }]}>Attach Image / Document</Text>
            <TouchableOpacity style={styles.attachBtn} onPress={handlePickFileOrImage}>
              <Ionicons name="attach-outline" size={20} color="#fff" />
              <Text style={styles.attachText}>Attach File</Text>
            </TouchableOpacity>

            {attachment && (
              <View style={{ marginTop: 10 }}>
                {attachment.type?.startsWith('image') || attachment.uri?.match(/\.(jpg|jpeg|png)$/i) ? (
                  <Image source={{ uri: attachment.uri }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                ) : (
                  <Text style={styles.fileName}>Attached: {attachment.name || attachment.uri?.split('/').pop()}</Text>
                )}
              </View>
            )}

            {/* Footer */}
            <Text style={styles.footer}>Leave request is for <Text style={{ fontWeight: 'bold' }}>{calculateTotalDays()} Day(s)</Text></Text>
            {

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}><Text style={styles.submitText}>Request Leave</Text></TouchableOpacity>
            }

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LeaveReqScreen;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  header: { alignItems: 'start', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#000' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  subTitle: { fontSize: 14, color: '#000' },
  dateText: { color: '#000', fontSize: 16, marginBottom: 8 },
  availability: { color: '#000', marginTop: 10 },
  inputNote: { backgroundColor: '#fff', borderColor: '#E53935', borderWidth: 1, borderRadius: 8, padding: 10, color: '#000', marginTop: 10 },
  footer: { color: '#000', textAlign: 'center', marginVertical: 10 },
  submitBtn: { backgroundColor: '#E53935', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: '600' },
  dropdown: { backgroundColor: '#fff', borderColor: '#E53935', marginTop: 8 },
  dropdownContainer: { backgroundColor: '#fff', borderColor: '#E53935' },
  radioBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, marginLeft: 8 },
  halfBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, marginLeft: 8 },
  radioText: { color: '#fff', fontWeight: '500' },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  datePicker: { flexDirection: 'row', alignItems: 'flex-start', width: '48%', paddingVertical: 10 },
  dateRowText: { color: '#000', fontWeight: '600', marginRight: 10 },
  attachBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginTop: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935', justifyContent: "center", borderRadius: 50, marginTop: 10, width: 50, height: 50 },
  attachText: { color: '#fff', marginLeft: 6, fontWeight: '500' },
  fileName: { marginTop: 8, color: '#000', fontStyle: 'italic' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  contactName: { marginLeft: 10, fontSize: 16, color: '#000' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },

  contactList: {
    maxHeight: 200, // ✅ fixed height
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 5,
  },

});
