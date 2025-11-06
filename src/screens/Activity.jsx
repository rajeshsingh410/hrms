import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
    Image,
    PermissionsAndroid
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import DatePicker from 'react-native-date-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import SweetAlert from 'react-native-sweet-alert';
import moment from 'moment';
import { SelectList } from 'react-native-dropdown-select-list';
import { Assignby, CreateActivity, GatepassData, GateReport, getoutsideactivity, outsideactivity, UpdateGateReport } from '../services/Actions/employeeAction';
import { useDispatch, useSelector } from 'react-redux';
const { width, height } = Dimensions.get("window");
import Modal from 'react-native-modal';
import Geolocation from '@react-native-community/geolocation';
import { useLoading } from '../navigation/LoadingContext';

const Activity = ({ navigation }) => {
    // ===== States =====
    const [searchText, setSearchText] = useState('');
    const { loading, setLoading } = useLoading();
    const dispatch = useDispatch()
    const { employee } = useSelector(state => state.employee);
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [statusOpen, setStatusOpen] = useState(false);
    const [statusValue, setStatusValue] = useState('all');

    const [isStarted, setIsStarted] = useState(false); // Track Start/Reach
    const [showModal, setShowModal] = useState(false);
    const [open, setOpen] = useState(false);
    const [assignopen, setAssignOpen] = useState(false);
    const [filterAssert, setFilterAssert] = useState(null);
    const [isModalVisibled, setModalVisibled] = useState(false);
    const [isReachModalVisibled, setReachModalVisibled] = useState(false);
    const [isCompleteModalVisibled, setCompleteModalVisibled] = useState(false);
    const [isClosedModalVisibled, setClosedModalVisibled] = useState(false);
    const [activeTab, setActiveTab] = useState('self');
    const [isDeleteModalVisibled, setDeleteModalVisibled] = useState(false);

    const [selectedUserId, setSelectedId] = useState(null);
    const [assignby, setAssignby] = useState([]);
    const [location, setLocation] = useState(null);

    const formatDate = (d) => {
        const day = d.getDate().toString().padStart(2, "0");
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };
    // ===== Sample Leave Data =====
    const [data, setdata] = React.useState({
        date: formatDate(new Date()),
        purpose: '',
        desc: '',
        assignid: '',
        act_location: '',
        time: '',
        details: '',
        status: '',
        postdate: '',
        posttime: '',
    })


    const purpose1 = [
        { label: "Official", value: "Official" },
        { label: "Personal", value: "Personal" },
    ];
    const status1 = [
        { label: "Meeting Success", value: "meeting Success" },
        { label: "Meeting Declined", value: "meeting_declined" },
        { label: "Postpone", value: "Postpone" },
    ];

    const [isModalVisibleuser, setModalVisibleuser] = useState(false);
    const toggleModaluser = () => {
        setModalVisibleuser(!isModalVisibleuser);
    };




    const handleClearFilter = () => {
        // setFilterValue(null);
        setShowFromPicker(false);
        setShowToPicker(false);
        setFromDate(new Date());
        setToDate(new Date());

        setStatusOpen(false);
        // setFilterOpen(false);
    };



    const [date, setDate] = useState("");
    const [postdate, setPostDate] = useState("");
    const [purpose, setPurpose] = useState("");
    const [showassign, setshowAssign] = useState("");
    const [reason, setReason] = useState("");

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isPostDatePickerVisible, setPostDatePickerVisibility] = useState(false);

    const handleConfirmDate = (selectedDate) => {
        const formatted = formatDate(selectedDate);
        setDate(formatted);
        setdata((prev) => ({ ...prev, date: formatted })); // ✅ also save inside data
        setDatePickerVisibility(false);
    };
    const handleConfirmPostDate = (selectedDate) => {
        const formatted = formatDate(selectedDate);
        setPostDate(formatted);
        setdata((prev) => ({ ...prev, postdate: formatted })); // ✅ also save inside data
        setPostDatePickerVisibility(false);
    };

    // activity submit hoga
    const handleSubmit = () => {
        const save = {
            fromDate: data.date,
            purpose: data.purpose,
            resion: data.desc,
            empid: employee.empid,
            location: data.act_location,
            assignid: data.assignid,
        };

        console.log("filterData", save);

        dispatch(CreateActivity(save))
            .then((res) => {
                // Optional: show SweetAlert if needed
                const isSuccess = res.success === true;
                const title = isSuccess ? "Success" : "Error";
                const message = res.message || "Something went wrong";

                if (isSuccess) {
                    // Fetch updated activity data
                    dispatch(getoutsideactivity(employee.empid)).then((res) => {
                        const rawData = res.data || [];
                        const outsideactivityReport = rawData.map((item) => ({
                            outid: item.outid,
                            key_status: item.key_status,
                            actdate: item.actdate,
                            act_res: item.act_res,
                            location: item.location,
                            act_type: item.act_type,
                            iscomplete: item.iscomplete,
                            assign: item.assignname,
                            is_postpone: item.is_postpone
                        }));
                        setFilterAssert(outsideactivityReport);
                    });

                    // Reset form
                    setShowModal(false);
                    setdata({ date: data.date, purpose: "", desc: "", location: "" });
                    setshowAssign('');
                    setPurpose('');

                    // Show alert
                    SweetAlert.showAlertWithOptions({
                        title,
                        subTitle: message,
                        confirmButtonTitle: 'OK',
                        confirmButtonColor: '#4CAF50',
                        style: 'success',
                    });
                } else {
                    SweetAlert.showAlertWithOptions({
                        title,
                        subTitle: message,
                        confirmButtonTitle: 'OK',
                        confirmButtonColor: '#E53935',
                        style: 'error',
                    });
                }
            })
            .catch((error) => {
                console.log("error in CreateActivity", error);
                SweetAlert.showAlertWithOptions({
                    title: "Error",
                    subTitle: "Request failed",
                    confirmButtonTitle: 'OK',
                    confirmButtonColor: '#E53935',
                    style: 'error',
                });
            });
    };


    useEffect(() => {
        setLoading(true);
        dispatch(getoutsideactivity(employee.empid))
            .then((res) => {
                setLoading(false);
                const rawData = res.data || [];
                console.log("get outside activity data", rawData)
                const outsideactivityReport = rawData.map((item) => ({
                    outid: item.outid,
                    key_status: item.key_status,
                    actdate: item.actdate,
                    act_res: item.act_res,
                    location: item.location,
                    act_type: item.act_type,
                    iscomplete: item.iscomplete,
                    assign: item.assignname,
                    is_postpone: item.is_postpone
                }));
                console.log("assetdata", outsideactivityReport);
                setFilterAssert(outsideactivityReport);
            })

            .catch((error) => {
                console.log(error)
                setLoading(false);
            })

    }, [dispatch, employee.empid]);






    const openModal = (outid) => {
        console.log("outid id", outid);
        setSelectedId(outid);
        setModalVisibled(true);
    };

    const openModal1 = (outid) => {
        console.log("outid id", outid);
        setSelectedId(outid);
        setReachModalVisibled(true);
    };

    const openModal2 = (outid) => {
        console.log("outid id", outid);
        setSelectedId(outid);
        setCompleteModalVisibled(true);
    };
    const openModal3 = (outid) => {
        console.log("outid id", outid);
        setSelectedId(outid);
        setClosedModalVisibled(true);
    };
    const openModal4 = (outid) => {
        console.log("outid id", outid);
        setSelectedId(outid);
        setDeleteModalVisibled(true);
    };

    useEffect(() => {
        // if (!employees.empid) return; // screen focus check
        let watchId;
        let isActive = true;

        const init = async () => {
            try {
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

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    // ✅ loader start only after permission granted
                    // setLoading(true);

                    Geolocation.getCurrentPosition(
                        pos => isActive && setLocation(pos.coords),
                        err => console.warn("Snapshot error:", err),
                        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5000 }
                    );
                    watchId = Geolocation.watchPosition(
                        pos => isActive && setLocation(pos.coords),
                        err => console.warn("Watch error:", err.message),
                        { enableHighAccuracy: false, distanceFilter: 5, interval: 5000, fastestInterval: 2000 }
                    );
                    // setLoading(false);
                }
            } catch (err) {
                console.error("Error during focus effect:", err);
                // setLoading(false);
            }
        };

        init();

        return () => {
            isActive = false;
            if (watchId != null) {
                Geolocation.clearWatch(watchId);
            }
        };
    }, [employee.empid, dispatch]);

    useEffect(() => {
        if (isStarted) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, "0");
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const currentTime = `${hours}:${minutes}`;

            setdata(prev => ({
                ...prev,               // preserve other fields
                time: currentTime,
                posttime: currentTime,    // update only time
                date: formatDate(now)  // also update date if needed
            }));

            setDate(formatDate(now)); // if you have separate date state
        }
    }, [isStarted]);

    useEffect(() => {
        dispatch(Assignby(employee.empid))
            .then((res) => {
                const rawData = res.data || [];
                console.log("row data", rawData);

                const Assignby = rawData.map((item) => ({
                    value: item.empid,
                    label: item.empname,

                }));
                console.log("Assignby", Assignby);
                setAssignby(Assignby);
            })
    }, [dispatch])


    const handleActivitySubmit = (tag) => {
        console.log("selectedUserId", tag);
        const save = {
            fromDate: data.date,
            time: data.time,
            latitude: location.latitude.toFixed(4),
            longitute: location.longitude.toFixed(4),
            empid: employee.empid,
            key_status: tag,
            details: data.details,
            status: data.status,
            postdate: data.postdate,
            posttime: data.posttime,
            outid: selectedUserId,
        };

        console.log("filterData", save);

        dispatch(outsideactivity(save))
            .then((res) => {
                const isSuccess = res.success === true;
                const title = isSuccess ? "Success" : "Error";
                const message = res.message || "Something went wrong";

                if (isSuccess) {
                    setModalVisibled(false);
                    setReachModalVisibled(false);
                    setCompleteModalVisibled(false);
                    setClosedModalVisibled(false);
                    setDeleteModalVisibled(false);
                }

                SweetAlert.showAlertWithOptions({
                    title,
                    subTitle: message,
                    confirmButtonTitle: 'OK',
                    confirmButtonColor: isSuccess ? '#4CAF50' : '#E53935',
                    style: isSuccess ? 'success' : 'error',
                });

                dispatch(getoutsideactivity(employee.empid))
                    .then((res) => {
                        const rawData = res.data || [];
                        const outsideactivityReport = rawData.map((item) => ({
                            outid: item.outid,
                            key_status: item.key_status,
                            actdate: item.actdate,
                            act_res: item.act_res,
                            location: item.location,
                            act_type: item.act_type,
                            iscomplete: item.iscomplete,
                            assign: item.assignname,
                            is_postpone: item.is_postpone
                        }));
                        setFilterAssert(outsideactivityReport);
                    });
            })
            .catch((error) => {
                console.log("error in leave availability", error);
                SweetAlert.showAlertWithOptions({
                    title: "Error",
                    subTitle: "Request failed",
                    confirmButtonTitle: 'OK',
                    confirmButtonColor: '#E53935',
                    style: 'error',
                });
            });

        setdata({ date: data.date, purpose: "", desc: "" });
    };

    return (
        <View style={{ flex: 1, padding: 10 }}>

            {/* <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === "self" && styles.activeTab]}
                    onPress={() => setActiveTab("self")}
                >
                    <Text style={activeTab === "self" ? styles.activeTabText : styles.tabText}>
                        Self
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === "sub" && styles.activeTab]}
                    onPress={() => setActiveTab("sub")}
                >
                    <Text style={activeTab === "sub" ? styles.activeTabText : styles.tabText}>
                        Sub-ordinate
                    </Text>
                </TouchableOpacity>
            </View> */}
            <FlatList
                data={filterAssert}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>

                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.type} Activity</Text>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                {item.iscomplete === '1' && item.is_postpone === '0' ? (
                                    <Ionicons name="checkmark-circle" size={28} color="green" />
                                ) : item.iscomplete === '1' && item.is_postpone === '1' ? (
                                    <Text style={[styles.cardStatus, { backgroundColor: 'green' }]}>Postpone</Text>
                                ) : (
                                    <Text style={[styles.cardStatus, { backgroundColor: 'orange' }]}>Pending</Text>)}
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => openModal4(item.outid)}>
                                    <Ionicons name="trash" size={22} color="#E53935" />
                                </TouchableOpacity>
                            </View>
                        </View>


                        <View style={styles.cardRow}>
                            <Ionicons name="calendar" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}> Activity Date:</Text>
                            <Text style={styles.cardText}>
                                {item.actdate}
                            </Text>
                        </View>


                        <View style={styles.cardRow}>
                            <Ionicons name="people" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Assign By:</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>

                                <View style={styles.approverBadge}>
                                    <Text style={styles.approverText}>
                                        {item.assign}

                                    </Text>
                                </View>

                            </View>
                        </View>



                        <View style={styles.cardRow}>
                            <Ionicons name="chatbubble" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Purpose:</Text>
                            <Text style={styles.cardText}>{item.act_type}</Text>
                        </View>
                        <View style={styles.cardRow}>
                            <Ionicons name="chatbubble" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Description:</Text>
                            <Text style={styles.cardText}>{item.act_res}</Text>
                        </View>
                        <View style={styles.cardRow1}>
                            <View style={styles.cardRow}>
                                <Ionicons name="chatbubble" size={18} color="#444" style={{ marginRight: 6 }} />
                                <Text style={styles.cardLabel}>location:</Text>
                                <Text style={styles.cardText}>{item.location}</Text>
                            </View>
                            {(item.key_status === '' || item.key_status === null) && (
                                <TouchableOpacity style={styles.button} onPress={() => {
                                    openModal(item.outid);
                                    setIsStarted(true);
                                }} >
                                    <Text style={styles.buttonText}>Start</Text>
                                </TouchableOpacity>
                            )}
                            {item.key_status === 'start' && (
                                <TouchableOpacity style={styles.button} onPress={() => {
                                    openModal1(item.outid);
                                    setIsStarted(true);
                                }} >
                                    <Text style={styles.buttonText}>React</Text>
                                </TouchableOpacity>
                            )}
                            {item.key_status === 'reach' && (
                                <TouchableOpacity style={styles.button} onPress={() => {
                                    openModal2(item.outid);
                                    setIsStarted(true);
                                }} >
                                    <Text style={styles.buttonText}>Complete</Text>
                                </TouchableOpacity>
                            )}
                            {item.key_status === 'complete' && (
                                <TouchableOpacity style={styles.button} onPress={() => {
                                    openModal3(item.outid);
                                    setIsStarted(true);
                                }} >
                                    <Text style={styles.buttonText}>Closed</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 20 }}>
                        No records found
                    </Text>
                }
            />


            <Modal
                visible={showModal} transparent={true} animationType="slide" onRequestClose={() => setShowModal(false)}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <View style={{ width: "90%", padding: 20, backgroundColor: "#fff", borderRadius: 12 }}>
                        {/* <View style={{backgroundColor:'red'}}> */}
                        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}>Create Activity</Text>
                        {/* </View> */}
                        {/* Date Field */}
                        <TouchableOpacity
                            onPress={() => setDatePickerVisibility(true)}
                            style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 12 }}
                        >
                            <Text>{date ? date : data.date}</Text>
                            <DateTimePickerModal
                                isVisible={isDatePickerVisible}
                                mode="date"
                                onConfirm={handleConfirmDate}
                                onCancel={() => setDatePickerVisibility(false)}
                            />
                        </TouchableOpacity>


                        {/* Purpose Field */}
                        <DropDownPicker
                            open={open}
                            value={purpose}
                            items={purpose1}
                            setOpen={setOpen}
                            setValue={(callback) => {
                                const newValue = callback(purpose); // get updated value
                                setPurpose(newValue);
                                setdata((prev) => ({ ...prev, purpose: newValue }));
                            }}
                            setItems={() => { }}
                            placeholder="Select Type"
                            style={{ borderColor: "#ccc" }}
                            dropDownContainerStyle={{ borderColor: "#ccc" }}
                        />

                        <TextInput
                            placeholder="Enter Resion"
                            placeholderTextColor="gray"
                            // 👈 bind state here
                            value={data.desc}
                            onChangeText={(val) => setdata((prev) => ({ ...prev, desc: val }))}
                            style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                padding: 10,
                                borderRadius: 8,
                                marginBottom: 20,
                                height: 80,
                                marginTop: 10
                            }}
                        />

                        <DropDownPicker
                            open={assignopen}
                            value={showassign}
                            items={assignby}
                            setOpen={setAssignOpen}
                            setValue={(callback) => {
                                const newValue = callback(assignby); // get updated value
                                setshowAssign(newValue);
                                setdata((prev) => ({ ...prev, assignid: newValue }));
                            }}
                            setItems={setAssignby}
                            placeholder="Assign By"
                            style={{ borderColor: "#ccc" }}
                            dropDownContainerStyle={{ borderColor: "#ccc" }}
                        />

                        <TextInput
                            placeholder="Enter Location"
                            placeholderTextColor="gray"
                            // 👈 bind state here
                            value={data.act_location}
                            onChangeText={(val) => setdata((prev) => ({ ...prev, act_location: val }))}
                            style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                padding: 10,
                                borderRadius: 8,
                                marginBottom: 20,
                                marginTop: 10
                            }}
                        />

                        {/* Reason Field */}

                        {/* Buttons */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <TouchableOpacity
                                style={{ backgroundColor: "#E53935", padding: 12, borderRadius: 8, flex: 1, marginRight: 10 }}
                                onPress={() => {
                                    setShowModal(false);
                                    setdata({ date: data.date, purpose: "", desc: "" });  // ✅ clear data
                                    setPurpose(null);  // ✅ clear dropdown
                                    setDate("");       // ✅ clear date text
                                }}
                            >
                                <Text style={{ color: "#fff", textAlign: "center" }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, flex: 1 }}
                                onPress={handleSubmit}
                            >
                                <Text style={{ color: "#fff", textAlign: "center" }}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal animationIn="slideInUp" isVisible={isModalVisibled}>
                <View style={styles.formBox}>
                    <Text style={styles.heading}>
                        Start Meeting
                    </Text>

                    {/* Date Field */}
                    <TouchableOpacity
                        onPress={() => setDatePickerVisibility(true)}
                        style={styles.inputBox}
                    >
                        <Text>{date || data.date}</Text>
                    </TouchableOpacity>
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirmDate}
                        onCancel={() => setDatePickerVisibility(false)}
                    />

                    {/* Time Field */}
                    <TextInput
                        placeholder="Enter Time"
                        placeholderTextColor="gray"
                        value={data.time}
                        onChangeText={(val) => setdata((prev) => ({ ...prev, time: val }))}
                        style={styles.inputBox}
                    />

                    <TextInput
                        placeholder="Enter Location"
                        placeholderTextColor="gray"
                        value={location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : ""}
                        editable={false}
                        onChangeText={(val) => setdata((prev) => ({ ...prev, location: val }))}  // ✅ make it read-only, user can’t change GPS coords
                        style={styles.inputBox}
                    />
                    {/* Buttons */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: "#E53935" }]}
                            onPress={() => {
                                setModalVisibled(false); // hide form on cancel
                            }}
                        >
                            <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: "#4CAF50" }]}
                            onPress={() => {
                                handleActivitySubmit("start")
                            }}
                        >
                            <Text style={styles.btnText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal animationIn="slideInUp" isVisible={isReachModalVisibled}>
                <View style={styles.formBox}>
                    <Text style={styles.heading}>
                        Reach  Meeting
                    </Text>

                    {/* Date Field */}
                    <TouchableOpacity
                        onPress={() => setDatePickerVisibility(true)}
                        style={styles.inputBox}
                    >
                        <Text>{date || data.date}</Text>
                    </TouchableOpacity>
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirmDate}
                        onCancel={() => setDatePickerVisibility(false)}
                    />

                    {/* Time Field */}
                    <TextInput
                        placeholder="Enter Time"
                        placeholderTextColor="gray"
                        value={data.time}
                        onChangeText={(val) => setdata((prev) => ({ ...prev, time: val }))}
                        style={styles.inputBox}
                    />

                    <TextInput
                        placeholder="Enter Location"
                        placeholderTextColor="gray"
                        value={location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : ""}
                        editable={false}
                        onChangeText={(val) => setdata((prev) => ({ ...prev, location: val }))}  // ✅ make it read-only, user can’t change GPS coords
                        style={styles.inputBox}
                    />
                    {/* Buttons */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: "#E53935" }]}
                            onPress={() => {
                                setReachModalVisibled(false); // hide form on cancel


                            }}
                        >
                            <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: "#4CAF50" }]}
                            onPress={() => {
                                handleActivitySubmit("reach")
                            }}
                        >
                            <Text style={styles.btnText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal animationIn="slideInUp" isVisible={isCompleteModalVisibled}>
                <View style={styles.formBox}>
                    <Text style={styles.heading}>
                        Complete  Meeting
                    </Text>

                    {/* Date Field */}
                    <TouchableOpacity
                        onPress={() => setDatePickerVisibility(true)}
                        style={styles.inputBox}
                    >
                        <Text>{date || data.date}</Text>
                    </TouchableOpacity>
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirmDate}
                        onCancel={() => setDatePickerVisibility(false)}
                    />

                    {/* Time Field */}
                    <TextInput
                        placeholder="Enter Time"
                        placeholderTextColor="gray"
                        value={data.time}
                        onChangeText={(val) => setdata((prev) => ({ ...prev, time: val }))}
                        style={styles.inputBox}
                    />

                    <TextInput
                        placeholder="Enter Location"
                        placeholderTextColor="gray"
                        value={location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : ""}
                        editable={false}
                        onChangeText={(val) => setdata((prev) => ({ ...prev, location: val }))}  // ✅ make it read-only, user can’t change GPS coords
                        style={styles.inputBox}
                    />

                    <TextInput
                        placeholder="Enter Details"
                        placeholderTextColor="gray"
                        value={data.details}
                        onChangeText={(val) => setdata((prev) => ({ ...prev, details: val }))}  // ✅ make it read-only, user can’t change GPS coords
                        style={styles.inputBox}
                    />

                    <DropDownPicker
                        open={open}
                        value={statusValue}
                        items={status1}
                        setOpen={setOpen}
                        setValue={(callback) => {
                            const newValue = callback(purpose); // get updated value
                            setStatusValue(newValue);
                            setdata((prev) => ({ ...prev, status: newValue }));
                        }}
                        setItems={() => { }}
                        placeholder="Select Type"
                        style={{ borderColor: "#ccc", marginBottom: 15 }}
                        dropDownContainerStyle={{ borderColor: "#ccc", marginBottom: 20 }}
                    />
                    {data.status === 'Postpone' && (
                        <View>

                            <TouchableOpacity
                                onPress={() => setPostDatePickerVisibility(true)}
                                style={styles.inputBox}
                            >
                                <Text style={styles.dateText}>{postdate || data.postdate || 'Select Date'}</Text>
                                <Ionicons name="calendar-outline" size={20} color="#555" style={{ marginRight: 8 }} />
                            </TouchableOpacity>

                            <DateTimePickerModal
                                isVisible={isPostDatePickerVisible}
                                mode="date"
                                onConfirm={handleConfirmPostDate}
                                onCancel={() => setPostDatePickerVisibility(false)}
                            />


                            <TextInput
                                placeholder="Enter Postpone Time"
                                placeholderTextColor="gray"
                                value={data.posttime}
                                onChangeText={(val) =>
                                    setdata((prev) => ({ ...prev, posttime: val }))
                                }
                                style={styles.inputBox}
                            />
                        </View>
                    )}

                    {/* Buttons */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: "#E53935" }]}
                            onPress={() => {
                                setCompleteModalVisibled(false);
                            }}
                        >
                            <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: "#4CAF50" }]}
                            onPress={() => {
                                handleActivitySubmit("complete")
                            }}
                        >
                            <Text style={styles.btnText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal animationIn="slideInUp" isVisible={isClosedModalVisibled}>
                <View style={styles.formBox}>
                    <Text style={styles.heading}>
                        Closed  Meeting
                    </Text>

                    {/* Date Field */}
                    <TouchableOpacity
                        onPress={() => setDatePickerVisibility(true)}
                        style={styles.inputBox}
                    >
                        <Text>{date || data.date}</Text>
                    </TouchableOpacity>
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirmDate}
                        onCancel={() => setDatePickerVisibility(false)}
                    />

                    {/* Time Field */}
                    <TextInput
                        placeholder="Enter Time"
                        placeholderTextColor="gray"
                        value={data.time}
                        onChangeText={(val) => setdata((prev) => ({ ...prev, time: val }))}
                        style={styles.inputBox}
                    />

                    <TextInput
                        placeholder="Enter Location"
                        placeholderTextColor="gray"
                        value={location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : ""}
                        editable={false}
                        onChangeText={(val) => setdata((prev) => ({ ...prev, location: val }))}  // ✅ make it read-only, user can’t change GPS coords
                        style={styles.inputBox}
                    />
                    {/* Buttons */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: "#E53935" }]}
                            onPress={() => {
                                setClosedModalVisibled(false); // hide form on cancel


                            }}
                        >
                            <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: "#4CAF50" }]}
                            onPress={() => {
                                handleActivitySubmit("closed")
                            }}
                        >
                            <Text style={styles.btnText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal animationIn="slideInUp" isVisible={isDeleteModalVisibled}>
                <View style={styles.deleteModel}>
                    <View style={styles.modelContent}>
                        <View style={styles.cancelview}>
                            <Ionicons name="close" size={24} color="#FF0000" />
                        </View>
                        <Text style={styles.deletecontent}>Do You want to Delete this record ?</Text>

                        <View flexDirection='row' style={styles.projectbtn}>
                            <TouchableOpacity style={styles.headcancel} onPress={() => handleActivitySubmit("delete")}>
                                <Text style={styles.canceltext}>OK</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.addheadbtn} onPress={() => setDeleteModalVisibled(false)}>
                                <Text style={styles.canceltext}>cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity style={styles.fabBtn} onPress={() => setShowModal(true)}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default Activity;

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    dropdown: { flexDirection: "row", justifyContent: "space-between", width: '100%' },
    filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
    filterBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, elevation: 4, zIndex: 1000 },
    filterTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 10, color: '#333' },
    searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginRight: 10, height: 40 },
    dateInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginRight: 10, alignItems: 'center' },
    tabRow: { flexDirection: 'row', marginVertical: 10 },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ccc' },
    activeTab: { borderBottomColor: '#E53935' },
    tabText: { color: '#000' },
    activeTabText: { color: '#E53935', fontWeight: 'bold' },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 14,
        paddingBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
        overflow: "hidden", // header curve ke liye
    },

    cardHeader: {
        backgroundColor: "#918e8e",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },

    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#222",
    },

    cardStatus: {
        fontSize: 12,
        fontWeight: "bold",
        color: "black",
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 20,
        marginRight: 10,
        textTransform: "capitalize",
        overflow: "hidden",

    },

    // deleteBtn: {
    //     padding: 6,
    //     borderRadius: 20,
    // },

    cardRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 3,
    },
    cardRow1: {

        flexDirection: 'row',
        justifyContent: 'space-between',  // 🔥 Pushes button to right
        alignItems: 'center',

    },

    // paddingHorizontal: 16,
    // paddingVertical: 5,

    cardLabel: {
        fontWeight: "600",
        marginRight: 8,
        fontSize: 14,
        color: "#333",
    },

    cardText: {
        fontSize: 14,
        color: "#444",
    },

    approverBadge: {
        // backgroundColor: "#F0F0F0",
        paddingHorizontal: 1,
        paddingVertical: 1,
        borderRadius: 20,
        marginRight: 6,
        marginBottom: 6,
        fontWeight: 'bold'
    },

    approverText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#333",
        marginTop: 5
    },

    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        marginTop: 6,
    },

    footerText: {
        fontSize: 12,
        color: "#666",
    },

    applyBtn: {
        flex: 1,
        backgroundColor: "#2874F0",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginRight: 8
    },
    clearBtn: {
        flex: 1,
        backgroundColor: "#E53935",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginLeft: 8
    },
    fabBtn: {
        position: "absolute",
        bottom: height * 0.07,  // ✅ screen height ka 3% margin
        right: width * 0.05,    // ✅ screen width ka 5% margin
        backgroundColor: "#E53935",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 6, // shadow Android
        shadowColor: "#000", // shadow iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    deleteModel: {
        width: '100%',
        height: 'auto',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelview: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        borderRadius: '50%',
        borderColor: 'red'
    },
    cancelimg: {
        width: 50,
        height: 50
    },
    modelContent: {
        width: '85%',
        padding: 22,
        borderRadius: 10,
        backgroundColor: 'white',

        //borderBottomRightRadius: 20,
        // padding: 4,
        //alignItems: "center",
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    deletecontent: {
        fontWeight: 'bold',
        fontSize: 15,
        color: 'gray',
        textTransform: 'capitalize',
        textAlign: 'center',
        marginBottom: 15
    },
    projectbtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 4
    },
    headcancel: {
        width: '48%',
        backgroundColor: '#222222',
        borderRadius: 40,
        padding: 10,
    },
    addheadbtn: {
        width: '48%',
        backgroundColor: '#f2704c',
        borderRadius: 40,
        padding: 10,
    },
    canceltext: {
        fontSize: 15,
        color: 'white',
        textTransform: 'capitalize',
        textAlign: 'center',
    },
    companybtn: {
        width: '49%',
    },
    sessiondate: {
        color: 'gray',
        fontWeight: 'bold',
        fontSize: 15,
        textTransform: 'capitalize',
        marginBottom: 5
    },
    formcombo: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    button: {
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 10
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    formBox: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        elevation: 3,
        marginTop: 20
    },
    heading: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
    inputBox: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
    },
    row: { flexDirection: "row", justifyContent: "space-between" },
    btn: {
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
    },
    btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
    buttonRow: {
        flexDirection: "row",   // 👈 make row
        justifyContent: "space-between", // space out buttons
        alignItems: "center",
        marginTop: 20,
    },

    buttonWrapper: {
        flex: 1,                // 👈 take equal space
        marginHorizontal: 5,    // spacing between buttons
    },
    inputBox: {
        flexDirection: 'row',       // horizontal layout
        alignItems: 'center',       // vertical alignment
        justifyContent: 'space-between', // or 'flex-start' if you want text and icon close
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: '#fff',
        marginBottom: 15,
    },

    dateText: {
        fontSize: 16,
        color: '#333',
    },

    calendarIcon: {
        marginLeft: 10, // spacing between text and icon
    },

});
