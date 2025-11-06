import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Image,
  Linking
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getAttHistoryAsync, getInfoAsync, getSubOrdinateAtt, handlegetattReport, sendRegularisation } from '../services/Actions/employeeAction';
import { useLoading } from '../navigation/LoadingContext';
import ScreenWithBackHandler from '../navigation/ScreenWithBackHandler';
import moment from 'moment';
import RegularisationModal from './RegularisationModal';
import SweetAlert from 'react-native-sweet-alert';


const { width } = Dimensions.get('window');

const AttendanceHistory = ({ navigation }) => {
  const IMG_URL = 'https://chaaruvi.com/hrms/Mobileapp/profile_img'

  const { employee } = useSelector((state) => state.employee);

  const dispatch = useDispatch();
  const { loading, setLoading } = useLoading();

  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState('My Attendance');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [expandedSub, setExpandedSub] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [singleDayAtt, setSingleDayAtt] = useState([])
  const [subOrdinate, setSubOrdinate] = useState([]);
  const [subAttendance, setSubAttendance] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selfMarkedDates, setSelfMarkedDates] = useState({});
  const [subMarkedDates, setSubMarkedDates] = useState({});
  const [showRegularisation, setShowRegularisation] = useState(false);
  const [regularisationData, setRegularisationData] = useState(null);
  const [reload, setReload] = useState(false);

  console.log("attendance", attendance);


  // Function to get background color based on status  
  function getBgColor(status) {
    switch (status) {
      case 'Absent': return '#F56D53';
      case 'Present': return '#28A745';
      case 'Miss Punch': return '#6F42C1';
      case 'Leave': return '#FFC107';
      case 'Outside': return '#90CAF9';
      case 'Holiday': return '#6610F2';
      case 'Halfday':
      case 'HalfDay':
        return '#e83e8c';
      case 'OffDay': return '#DC3545';
      default: return '#ddd';
    }
  }


  function getIcon(status) {
    switch (status) {
      case 'Present':
        return 'account-check-outline'; // 👤✔️ person with check
      case 'Absent':
        return 'account-remove-outline'; // 🚫 missing person
      case 'Miss Punch':
        return 'alert-circle'; // ⚠
      case 'Leave':
        return 'calendar-blank'; // 📅
      case 'Outside':
        return 'account-arrow-right-outline';  // 📍 searching outside location
      case 'Holiday':
        return 'party-popper'; // 🎉 celebration
      case 'Halfday':
        return 'clock-outline'; // 🕒
      case 'Late':
        return 'clock-alert';
      case 'OffDay':
        return 'timer-off'; // ⏰
      default:
        return 'help-circle-outline'; // ❔
    }
  }

  useEffect(() => {
    if (!employee) return;
    setLoading(true);

    dispatch(getAttHistoryAsync(employee.empid))
      .then((res) => {
        console.log("res Attendance", res);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Group data by date
        const groupedData = res?.data?.reduce((acc, curr) => {
          const date = curr.attdate;
          if (!acc[date]) {
            acc[date] = { ...curr, intime: curr.intime || '', outtime: curr.outtime || '' };
          } else {
            if (curr.intime && (!acc[date].intime || curr.intime < acc[date].intime)) {
              acc[date].intime = curr.intime;
            }
            if (curr.outtime && (!acc[date].outtime || curr.outtime > acc[date].outtime)) {
              acc[date].outtime = curr.outtime;
            }
          }
          return acc;
        }, {});

        // Map to array with total time calculation
        const attArray = Object.values(groupedData).map((item) => {
          const date = item.attdate;
          const punchIn = item.intime || '';
          const punchOut = item.outtime || '';
          let total = '';

          if (punchIn && punchOut) {
            const inTime = new Date(`${date}T${punchIn}`);
            const outTime = new Date(`${date}T${punchOut}`);
            const diffMs = outTime - inTime;
            if (diffMs > 0) {
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              total = `${hours}h ${minutes}m`;
            }
          }

          return {
            date,
            day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            punchIn,
            punchOut,
            total,
            arrival_status: item.arrival_status,
            lateby: item.late_by,
            early_by: item.early_by,
            leave_status: item.leave_status,
            hname: item.hname || '',
            status: item.att_status,
            isPast: new Date(date) <= today,
            att_type: item.att_type,
            remark : item.remark || ''
          };
        });

        setAttendance(attArray);
        const marks = {};
        attArray.forEach(item => {
          const d = pad(item.date);

          const color = getBgColor(item.status);

          marks[d] = {
            customStyles: {
              container: { backgroundColor: color, borderRadius: 8 },
              text: { color: '#000', fontWeight: 'bold' }
            }
          };
        });
        setSelfMarkedDates(marks);

        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        console.error("Failed to fetch attendance", err);
      });

    if (employee?.empid) {

      dispatch(getSubOrdinateAtt(employee.empid))
        .then((res) => {
          console.log("res ordinate ", res);

          if (Array.isArray(res)) {
            setSubOrdinate(res);
          } else {
            setSubOrdinate([]);
          }
        })
        .catch((error) => {
          setSubOrdinate([]);
        });
    }
  }, [employee, dispatch, reload]);

  const pad = (s) => {
    if (!s) return "";
    return s
      .split("-")
      .map((v, i) => (i > 0 ? v.padStart(2, "0") : v))
      .join("-");
  };

  // const markedDates = {};

  attendance.forEach(item => {
    const d = pad(item.date);
    const color = getBgColor(item.status);

    markedDates[d] = {
      customStyles: {
        container: { backgroundColor: color, borderRadius: 8 },
        text: { color: '#000', fontWeight: 'bold' }
      }
    };
  });

  if (activeSub) {
    const d = pad(activeSub.date);
    markedDates[d] = {
      customStyles: {
        container: { backgroundColor: '#A5D6A7', borderRadius: 8 },
        text: { color: '#000', fontWeight: 'bold' }
      }
    };
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  const currentMonthAttendance = attendance.filter(item =>
    item.date.startsWith(currentMonth)
  );

  const handleDayPress = (day) => {
    const selectedDate = day.dateString;

    const records = activeSub
      ? subAttendance.filter(r => r.date === selectedDate)
      : attendance.filter(r => r.date === selectedDate);

      console.log("records",attendance);
      
    setSelectedRecord(records.length ? records : [{
      date: selectedDate,
      intime: '00:00',
      outtime: '00:00',
      total: '00:00',
      status: r.status,
      remark: r.remark ,
    }]);
  };

  const handleLeave = (date) => {

    navigation.navigate('Leave', { date: date, id: employee.empid });
  };

  const handleFetchSingleRecAtt = async (date, empid) => {
    try {
      setLoading(true);
      const response = await dispatch(getInfoAsync({ date, empid }));
      const records = response?.Data || [];

      let singleDayData = records.length > 0
        ? records
        : attendance.filter(item => item.date === date);

      // Agar phir bhi empty hai, default to Absent
      if (singleDayData.length === 0) {
        singleDayData = [{
          date,
          intime: '00:00:00',
          outtime: '00:00:00',
          total_time: '00:00 hr',
          status: 'N/A',
          remark: 'N/A',
        }];
      }

      setSingleDayAtt(singleDayData);
      setLoading(false);

      const index = attendance.findIndex(item => item.date === date);
      if (index !== -1) {
        setExpandedSub(index);
      }

      return singleDayData;
    } catch (err) {
      setLoading(false);
      console.error("Failed to fetch single record:", err);
    }
  };

  const handlegetRagularigation = async (date) => {
    console.log("date ", date);

    const employeeAtt = {
      date: date,
      empid: employee.empid,
    };

    setLoading(true);
    try {
      const res = await dispatch(handlegetattReport(employeeAtt));
      if (res.success === true || res.success === "true") {
        setRegularisationData(res);
        setShowRegularisation(true);
      } else {
        SweetAlert.showAlertWithOptions({
          title: "Error",
          subTitle: res.message,
          confirmButtonTitle: "OK",
          style: "error",
          cancellable: true
        });
      }
    } catch (error) {
      console.log("error ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegularisation = (payload) => {
    setLoading(true);
    dispatch(sendRegularisation(payload))
      .then((res) => {
        setLoading(false);
        if (res.success === true || res.success === "true") {
          SweetAlert.showAlertWithOptions({
            title: "Success",
            subTitle: res.message,   // backend ka message
            confirmButtonTitle: "OK",
            style: "success",
            cancellable: true
          });
          setReload(prev => !prev);
          setExpandedSub(null)
          setSelectedRecord(null)
        } else {
          SweetAlert.showAlertWithOptions({
            title: "Error",
            subTitle: res.message || "Something went wrong!",
            confirmButtonTitle: "OK",
            style: "error",
            cancellable: true
          });
        }
      })
      .catch((err) => {
        setLoading(false);
        SweetAlert.showAlertWithOptions({
          title: "Error",
          subTitle: "Request failed! Please try again.",
          confirmButtonTitle: "OK",
          style: "error",
          cancellable: true
        });
      });
  };

console.log("selectedRecord",selectedRecord);


  return (
    <ScreenWithBackHandler onBack={() => navigation.goBack()}>
      <View style={styles.headerTitle}>
        <Text style={styles.title}>{activeTab === 'My Attendance' ? 'My Attendance  Rec' : `Sub-Ordinate's Rec`} </Text>
      </View>
      <SafeAreaView style={styles.container}>
        {!showCalendar && (
          <View style={styles.tabContainer}>
            {['My Attendance', 'Sub-ordinate'].map(tab => (
              <TouchableOpacity key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => {
                  setActiveTab(tab);
                  setActiveSub(null);
                  setExpandedSub(null);
                }}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showCalendar ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.legend}>
              {[
                { col: '#F56D53', label: 'Absent' },
                { col: '#28A745', label: 'Present' },
                { col: '#6F42C1', label: 'M.P' },
                { col: '#FFC107', label: 'Leave' },
                { col: '#90CAF9', label: 'Outside' },
                { col: '#6610F2', label: 'Holiday' },
                { col: '#e83e8c', label: 'Halfday' },
                // { col: '#007BFF', label: 'Early' }
              ].map((l, i) => (
                <View key={i} style={[styles.legendItem, { borderBottomColor: l.col }]}>
                  <Text style={styles.legendText}>{l.label}</Text>
                </View>
              ))}
            </View>

            <Calendar
              current={`${new Date().toISOString().slice(0, 7)}-01`}   // 👈 hamesha current month open
              markingType="custom"
              markedDates={activeSub ? subMarkedDates : selfMarkedDates}
              onDayPress={handleDayPress}
              theme={{
                calendarBackground: "#fff",
                dayTextColor: "#333",
                monthTextColor: "#E53935",
                arrowColor: "#E53935",
                todayTextColor: "#E53935",
                textSectionTitleColor: "black",
              }}
              style={styles.calendar}
            />
            {selectedRecord && (
              <View style={styles.accordionDetail1}>
                <View style={[styles.cardHeader, { backgroundColor: '#E53935' }]}>
                  <Text style={styles.headerText}>{selectedRecord[0]?.date}</Text>
                  <Ionicons name="close" size={20} style={{ color: "white" }} onPress={() => setSelectedRecord(null)} />
                </View>

                <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true}>
                  {selectedRecord.map((att, idx) => (
                    <View key={idx} style={{ elevation: 16, marginBottom: 10, backgroundColor: '#fff', padding: 10 }}>

                      {/* Attendance Details */}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Check In:</Text>
                        <Text style={styles.detailValue}>{att.intime || att.punchIn || '00:00:00'}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Check Out:</Text>
                        <Text style={styles.detailValue}>{att.outtime || att.punchOut || '00:00:00'}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status:</Text>
                        <Text style={styles.detailValue}>{att.att_status || att.status}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Hour:</Text>
                        <Text style={styles.detailValue}>{att.total_time || att.total || '00:00 hr'}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Remarks:</Text>
                        <Text style={styles.detailValue}>{att.remark || 'N/A'}</Text>
                      </View>

                      {/* Footer with Buttons */}
                      {activeTab === "My Attendance" && (
                        <View style={styles.cardFooter}>
                          {
                            new Date(att.date).getTime() > new Date().setHours(0, 0, 0, 0) && (
                              <TouchableOpacity
                                style={[styles.footerBtn, styles.btnLeave]}
                                onPress={() => handleLeave(att.date)}
                              >
                                <Text style={styles.btnText}>Apply Leave</Text>
                              </TouchableOpacity>
                            )
                          }

                          {
                            (
                              (
                                (!singleDayAtt[0]?.intime || !singleDayAtt[0]?.outtime) &&
                                att.status !== "OffDay" && att.status !== "Holiday"
                              ) &&
                              new Date(att.date).getTime() < new Date().setHours(0, 0, 0, 0)
                            ) && (
                              <>
                                <TouchableOpacity
                                  style={[styles.footerBtn, styles.btnReg]}
                                  onPress={() =>
                                    // setShowRegularisation(true)
                                    handlegetRagularigation(att.date)
                                  }
                                >
                                  <Text style={styles.btnText}>Regularisation</Text>
                                </TouchableOpacity>

                                {regularisationData && (
                                  <RegularisationModal
                                    visible={showRegularisation}
                                    onClose={() => setShowRegularisation(false)}
                                    selectedDate={att.date}
                                    handleRegularisation={handleRegularisation}
                                    defaultTimes={regularisationData}
                                  />
                                )}
                              </>
                            )
                          }
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {activeTab === 'My Attendance' ? (
              currentMonthAttendance.map((it, i) => {

                const isWhiteText =
                  it.status === 'Leave' ||
                  it.status === 'Holiday' ||
                  it.status === 'Absent' ||
                  it.day === 'SUN' ||
                  it.punchIn === '';

                return (
                  <View key={i}>
                    <TouchableOpacity
                      style={[styles.subRecordRow, { backgroundColor: '#edf0f0ff' }]}
                      onPress={() =>
                        expandedSub === i
                          ? setExpandedSub(null)
                          : handleFetchSingleRecAtt(it.date, employee.empid)
                      }
                    >

                      <View style={[styles.dateBox, { backgroundColor: getBgColor(it.status) }]}>
                        <Text style={styles.dateText}>{it.date.slice(-2)}</Text>
                        <Text style={styles.dayText}>{it.day}</Text>
                      </View>

                      <View style={styles.subDetails}>
                        {/* Arrival */}
                        <View style={styles.row}>
                          <Text style={[styles.label2, isWhiteText && { color: 'black' }]}>
                            Check In:
                          </Text>
                          {(!it.punchIn && !it.punchOut) ? (
                            <Text style={[styles.value, isWhiteText && { color: 'black' }]}>
                              00:00:00
                            </Text>
                          ) : (
                            <Text
                              style={[
                                styles.value,
                                { color: it.arrival_status === 'Late' ? 'red' : 'green' },
                                isWhiteText && { color: 'black' },
                              ]}
                            >
                              {it.punchIn || '00:00:00'} {it.arrival_status === 'Late' ? `(${it.arrival_status} ${it.lateby})` : ''}

                            </Text>
                          )}
                        </View>

                        {/* Leave */}
                        <View style={styles.row}>
                          <Text style={[styles.label2, isWhiteText && { color: 'black' }]}>
                            Check Out:
                          </Text>
                          <Text style={[styles.value, {
                            color: it.punchOut && it.leave_status == "On Time" ? 'green' : 'red'
                          }, isWhiteText && { color: 'black' },]}>
                            {it.punchOut || '00:00:00'} {it.punchOut ? `${it.leave_status === 'Early' ? `(${it.leave_status} by ${it.early_by})` : ''}` : ''}
                          </Text>
                        </View>


                        {/* Status */}
                        <View style={styles.row}>
                          <Text style={[styles.label2, isWhiteText && { color: 'black' }]}>
                            Status:
                          </Text>
                          <View style={styles.statusRow}>
                            <View style={[styles.statusCircle, { backgroundColor: getBgColor(it.status) }]}>
                              <Text style={styles.circleText}>
                                {/* {it.status ? it.status.charAt(0).toUpperCase() : '-'} */}
                                <MaterialCommunityIcons
                                  name={getIcon(it.status)}
                                  size={20}
                                  color='white'
                                />
                              </Text>

                            </View>
                            <Text style={[styles.value, {
                              color:
                                it.att_type === "Approved" || it.att_type === "Auto"
                                  ? "green"
                                  : it.att_type === "Pending"
                                    ? "orange"
                                    : it.att_type === "Reject"
                                      ? "#E95535"
                                      : "#000", // default black
                            },]}>
                              {`- ${it.status} ${it.hname ? `(${it.hname.substring(0, 3).toUpperCase()}) ` : ''}`}
                            </Text>
                          </View>
                        </View>

                        {/* Working Hour */}
                        <View style={styles.row}>
                          <Text style={[styles.label2, isWhiteText && { color: 'black' }]}>
                            Working Hour:
                          </Text>
                          <Text style={[styles.value, isWhiteText && { color: 'black' }]}>
                            {it.total && ('⏳')} {it.total || '00:00:00'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Accordion Detail Below */}
                    {expandedSub === i && (
                      <View style={styles.accordionDetail}>
                        <View style={styles.AttcardHeader}>
                          <Text style={styles.detailTitle}>Attendance Details</Text>
                          <Text style={[styles.detailValue, { color: '#fff' }]}>{it.date}</Text>
                        </View>

                        <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true}>
                          {singleDayAtt.map((att, idx) => (
                            <View key={idx} style={{ elevation: 16, backgroundColor: '#fff', padding: 10 }}>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Check In:</Text>
                                <Text style={styles.detailValue}>{att.intime || 'N/A'}</Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Check Out:</Text>
                                <Text style={styles.detailValue}>{att.outtime || '00:00:00'}</Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status:</Text>
                                <Text style={styles.detailValue}>{att.status || 'N/A'}</Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Total Hour:</Text>
                                <Text style={styles.detailValue}>{att.total_time || '00:00 hr'}</Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Remarks:</Text>
                                <Text style={styles.detailValue}>{att.remarks || 'N/A'}</Text>
                              </View>
                            </View>
                          ))}
                        </ScrollView>

                        <View style={styles.cardFooter}>
                          {
                            new Date(it.date).getTime() > new Date().setHours(0, 0, 0, 0) && (
                              <TouchableOpacity
                                style={[styles.footerBtn, styles.btnLeave]}
                                onPress={() => handleLeave(it.date)}
                              >
                                <Text style={styles.btnText}>Apply Leave</Text>
                              </TouchableOpacity>
                            )
                          }

                          {
                            (
                              (!singleDayAtt[0]?.intime || !singleDayAtt[0]?.outtime) &&
                              (it.status === "Absent" || it.att_status === "Absent" || it.status === "Miss Punch" || it.att_status === "Miss Punch") &&
                              new Date(it.date).getTime() < new Date().setHours(0, 0, 0, 0)
                            ) && (
                              <>
                                <TouchableOpacity
                                  style={[styles.footerBtn, styles.btnReg]}
                                  onPress={() =>
                                    // setShowRegularisation(true)
                                    handlegetRagularigation(it.date)
                                  }
                                >
                                  <Text style={styles.btnText}>Regularisation</Text>
                                </TouchableOpacity>

                                {regularisationData && (
                                  <RegularisationModal
                                    visible={showRegularisation}
                                    onClose={() => setShowRegularisation(false)}
                                    selectedDate={it.date}
                                    handleRegularisation={handleRegularisation}
                                    defaultTimes={regularisationData}
                                  />
                                )}
                              </>
                            )
                          }

                        </View>
                      </View>
                    )}

                  </View>
                );
              })
            ) : (
              subOrdinate?.length > 0 ?
                subOrdinate?.map((it, i) => (
                  <View key={i}>
                    <TouchableOpacity style={styles.subRecordRow}
                      onPress={() => setExpandedSub(expandedSub === i ? null : i)}>
                      <Image
                        source={
                          it.profile_img && it.profile_img !== '' && it.profile_img !== 'null'
                            ? { uri: `${IMG_URL}/${it.profile_img}` }
                            : require('../assets/images/profile.png')
                        }
                        style={styles.employeePhoto}
                      />
                      <View style={styles.subDetails}>
                        <Text style={styles.nameText}>{it.empname}</Text>
                        <Text style={styles.value}>Date: {moment(it.date).format('DD-MM-YYYY')}</Text>
                        <Text style={styles.value}>In: {it?.attRep[0]?.intime || '00:00'}</Text>
                        <Text style={styles.value}>Out: {it?.attRep[0]?.outtime || '00:00'}</Text>
                        {it.total ? <Text style={styles.value}>Total: {it?.attRep[0]?.total}</Text> : null}
                      </View>
                      <View style={styles.subButtons}>

                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={async () => {
                            try {
                              setLoading(true); // 👈 Start Loading

                              setShowCalendar(true);
                              setActiveSub(it);

                              // subordinate ka record lao
                              const res = await dispatch(getAttHistoryAsync(it.empid));
                              console.log("response attendance", res);

                              if (res?.data) {
                                const attArray = res.data.map(item => ({
                                  date: item.attdate,
                                  intime: item.intime || '',
                                  outtime: item.outtime || '',
                                  total: item.total_time || '',
                                  status: item.att_status
                                }));

                                setSubAttendance(attArray);

                                const marks = {};
                                attArray.forEach(item => {
                                  const d = pad(item.date);
                                  const color = getBgColor(item.status);

                                  marks[d] = {
                                    customStyles: {
                                      container: { backgroundColor: color, borderRadius: 8 },
                                      text: { color: '#000', fontWeight: 'bold' }
                                    }
                                  };
                                });

                                setSubMarkedDates(marks);
                              }
                            } catch (err) {
                              console.error("Error fetching subordinate record:", err);
                            } finally {
                              setLoading(false); // 👈 Stop Loading
                            }
                          }}
                        >

                          <Ionicons name="calendar-outline" size={24} color="#E53935" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => {
                            if (it.attRep[0]?.latitude && it.attRep[0]?.longitude) {
                              const lat = it?.attRep[0]?.latitude;
                              const lng = it?.attRep[0]?.longitude;
                              const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                              Linking.openURL(url);
                            } else {
                              alert("Location not available for this employee");
                            }
                          }}
                        >
                          <Ionicons name="location-outline" size={24} color="#E53935" />
                        </TouchableOpacity>

                      </View>
                    </TouchableOpacity>
                    {expandedSub === i && (
                      <View style={styles.accordionDetail}>
                        <View style={styles.cardheader}>
                          <Text style={styles.detailTitle}>Attendance Details</Text>
                          <View style={{ flexDirection: "row" }}>
                            <Text style={{ color: 'white', fontWeight: 700 }}>Date:</Text>
                            <Text style={[styles.detailValue, { color: 'white' }]}>{it?.attRep[0]?.attdate}</Text>
                          </View>
                        </View>
                        <View style={{ padding: 16 }}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Punch In:</Text>
                            <Text style={styles.detailValue}>{it?.attRep[0]?.intime || '00:00'}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Punch Out:</Text>
                            <Text style={styles.detailValue}>{it?.attRep[0]?.outTime || '00:00'}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Status:</Text>
                            <Text style={styles.detailValue}>{it?.attRep[0]?.att_status}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Total Hour:</Text>
                            <Text style={styles.detailValue}>{it?.attRep[0]?.total || '00:00 hr'}</Text>
                          </View>
                        </View>
                      </View>

                    )}
                  </View>
                ))
                :
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ textAlign: "center", color: "black", fontSize: 16 }}>
                    No subordinate records found
                  </Text>
                </View>
            )}
          </ScrollView>
        )
        }

        {
          activeTab === 'My Attendance' && (
            <TouchableOpacity style={styles.toggleFloating}
              onPress={() => {
                setShowCalendar(v => !v);
                setSelectedRecord(null);
              }}>
              <Ionicons name={showCalendar ? 'list-outline' : 'calendar-number-outline'} size={24} color="#fff" />
            </TouchableOpacity>
          )
        }

        {
          activeTab === 'Sub-ordinate' && showCalendar && (
            <TouchableOpacity
              style={styles.toggleFloating}
              onPress={() => {
                setShowCalendar(false);
                setActiveSub(null);
              }}
            >
              <Ionicons name="list-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )
        }
      </SafeAreaView >
    </ScreenWithBackHandler >
  );
};

export default AttendanceHistory;

const styles = StyleSheet.create({
  headerTitle: { alignItems: 'start', paddingHorizontal: 10, backgroundColor: "#fff", paddingVertical: 2 },
  title: { fontSize: 22, fontWeight: '700', color: '#000' },
  recordContainer: {
    paddingVertical: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // marginBottom: 4,
    elevation: 16,
  },

  label2: {
    fontWeight: '900',
    fontSize: 12,
    color: '#333',
    width: "38%"
  },

  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 14 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  tabContainer: { flexDirection: 'row', marginBottom: 10, gap: 20 },
  tab: { flex: 1, padding: 8, borderWidth: 1, borderColor: '#E53935', borderRadius: 5, alignItems: 'center' },
  activeTab: { backgroundColor: '#E53935' },
  tabText: { color: '#E53935', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
  legendItem: { paddingBottom: 4, marginRight: 10, marginBottom: 8, borderBottomWidth: 4, alignSelf: 'flex-start' },
  legendText: { fontSize: 12, color: '#333' },
  calendar: { borderRadius: 10, marginBottom: 10, elevation: 2 },
  calendarDetailCard: { margin: 10, padding: 12, backgroundColor: '#fff', borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 } },
  scroll: { flexGrow: 1, paddingBottom: 80 },
  recordRow: { flexDirection: 'row', padding: 10, marginBottom: 8, backgroundColor: '#f9f9f9', borderRadius: 8, alignItems: 'center' },
  dateBox: { width: 60, height: 60, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  dateText: { fontSize: 14, fontWeight: 'bold', color: "white" },
  dayText: { fontSize: 10, textAlign: 'center', color: "white" },
  recordDetails: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statusCircle: {
    width: 24,
    height: 24,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
  },
  circleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  value: { fontSize: 12, fontWeight: '600', color: '#333' },
  subRecordRow: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 8, backgroundColor: '#f9f9f9', borderRadius: 8 },
  employeePhoto: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ccc' },
  subDetails: { flex: 1, marginHorizontal: 10 },
  nameText: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  subButtons: { flexDirection: 'row' },
  iconBtn: { marginLeft: 8, padding: 4 },
  AttcardHeader: { borderBottomWidth: 2, backgroundColor: '#E53935', borderBottomColor: '#E53935', flexDirection: "row", justifyContent: "space-between", marginBottom: 10, paddingVertical: 10, paddingHorizontal: 15, borderTopEndRadius: 10, borderTopStartRadius: 10 },
  accordionDetail: {
    backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 8, elevation: 3, shadowColor: '#000', marginBottom: 10,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2
  },
  cardheader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: "#E53935", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopEndRadius: 10, borderTopStartRadius: 10 },
  detailTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 14, color: '#555', fontWeight: '600' },
  detailValue: { fontSize: 14, color: '#222', fontWeight: '600', paddingLeft: 10 },
  toggleFloating: { position: 'absolute', bottom: 70, right: 20, flexDirection: 'row', backgroundColor: '#E53935', padding: 8, borderRadius: 20, elevation: 4 },
  toggleText: { color: '#fff', marginLeft: 5 },
  accordionDetail1: { backgroundColor: '#fff', padding: 0, borderRadius: 10, marginHorizontal: 8, marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardHeader: { paddingVertical: 10, paddingHorizontal: 10, flexDirection: "row", justifyContent: "space-between", width: '100%', alignItems: 'center', backgroundColor: '#E53935', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  headerText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  cardBody: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', flexDirection: 'column', gap: 8, maxHeight: 250 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, color: '#555' },
  cardFooter: { flexDirection: 'column', gap: 5, padding: 10, backgroundColor: '#f9f9f9' },
  footerBtn: { marginHorizontal: 8, paddingVertical: 10, borderRadius: 5, alignItems: 'center' },
  btnLeave: { backgroundColor: 'green' },
  btnReg: { backgroundColor: '#E53935' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' }
});