import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
    Image
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import DatePicker from 'react-native-date-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from 'moment';
import { SelectList } from 'react-native-dropdown-select-list';
import { GatepassData, GateReport, UpdateGateReport } from '../services/Actions/employeeAction';
import { useDispatch, useSelector } from 'react-redux';
const { width, height } = Dimensions.get("window");
import Modal from 'react-native-modal';

const GatePass = ({ navigation }) => {
    // ===== States =====
    const [searchText, setSearchText] = useState('');
    const dispatch = useDispatch()
    const { employee } = useSelector(state => state.employee);
    // const [filterOpen, setFilterOpen] = useState(false);
    // const [filterValue, setFilterValue] = useState(null);
    const [showFilterBox, setShowFilterBox] = useState(false);

    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [statusOpen, setStatusOpen] = useState(false);
    const [statusValue, setStatusValue] = useState('all');

    const [activeTab, setActiveTab] = useState('self');
    const [showModal, setShowModal] = useState(false);
    const [open, setOpen] = useState(false);
    const [filterAssert, setFilterAssert] = useState(null);
    const [isModalVisibled, setModalVisibled] = useState(false);
    const [selectedUserId, setSelectedId] = useState(null);

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
        desc: ''
    })


    const purpose1 = [
        { label: "Official", value: "Official" },
        { label: "Personal", value: "Personal" },
    ];

    const [isModalVisibleuser, setModalVisibleuser] = useState(false);
    const toggleModaluser = () => {
        setModalVisibleuser(!isModalVisibleuser);
    };
    const leaveData = [
        {
            id: '1',
            type: 'Unpaid',
            status: 'Pending',
            fromDate: '20/08/2025',
            toDate: '22/08/2025',
            approvers: [{ name: 'Bikram', status: 'Pending' }],
            remark: 'Family function',
            applyDate: '20/08/2025',
            applyTime: '11:07 AM',
        },
        {
            id: '2',
            type: 'Paid',
            status: 'Approval',
            fromDate: '10/08/2025',
            toDate: '12/08/2025',
            approvers: [
                { name: 'Bikram', status: 'Approved' },
                { name: 'Manager', status: 'Pending' },
            ],
            remark: 'Vacation',
            applyDate: '09/08/2025',
            applyTime: '10:00 AM',
        },
    ];

    const self = [
        {
            id: '1',
            type: 'Unpaid',
            status: 'Pending',
            fromDate: '20/08/2025',
            toDate: '22/08/2025',
            approvers: [{ name: 'Bikram', status: 'Pending' }],
            remark: 'Family function',
            applyDate: '20/08/2025',
            applyTime: '11:07 AM',
        },

    ];

    const handleClearFilter = () => {
        // setFilterValue(null);
        setShowFromPicker(false);
        setShowToPicker(false);
        setFromDate(new Date());
        setToDate(new Date());
        setStatusValue('all');
        setStatusOpen(false);
        // setFilterOpen(false);
    };

    const filteredLeave = leaveData.filter(item =>
        statusValue === 'all' ? true : item.status.toLowerCase() === statusValue
    );

    const Self = self.filter(item =>
        statusValue === 'all' ? true : item.status.toLowerCase() === statusValue
    );

    const [date, setDate] = useState("");
    const [purpose, setPurpose] = useState("");
    const [reason, setReason] = useState("");

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const handleConfirmDate = (selectedDate) => {
        const formatted = formatDate(selectedDate);
        setDate(formatted);
        setdata((prev) => ({ ...prev, date: formatted })); // ✅ also save inside data
        setDatePickerVisibility(false);
    };

    const handleSubmit = () => {
        const save = {
            fromDate: data.date,
            purpose: data.purpose,
            resion: data.desc,
            empid: employee.empid,
        };
        console.log("filterData", save);

        dispatch(GatepassData(save))
            .then(() => {

                dispatch(GateReport(employee.empid))
                    .then((res) => {
                        const rawData = res.data || [];
                        const AssetReport = rawData.map((item) => ({
                            id: item.gateid,
                            purpose: item.purpose,
                            applydate: item.applydate,
                            reason: item.reason,
                            approveby: item.approveby,
                            status: item.status,
                            empid: item.empid,
                            empname: item.empname,
                            approvedname: item.approvedname,
                        }));
                        console.log("assetdata", AssetReport);
                        setFilterAssert(AssetReport);
                    });
            })
            .catch((error) => console.log("error in leave avilaty", error));

        setShowModal(false);
        setdata({ date: data.date, purpose: "", desc: "" });
    };


    useEffect(() => {
        dispatch(GateReport(employee.empid))
            .then((res) => {
                const rawData = res.data || [];

                const AssetReport = rawData.map((item) => ({
                    id: item.gateid,
                    purpose: item.purpose,
                    applydate: item.applydate,
                    reason: item.reason,
                    approveby: item.approveby,
                    status: item.status,
                    empid: item.empid,
                    empname: item.empname,
                    approvedname: item.approvedname,
                    subempid: item.subempid,
                    gateid: item.gateid,
                }));
                console.log("assetdata", AssetReport);
                setFilterAssert(AssetReport);
            })
    }, [dispatch])

    const filteredData =
        activeTab === "self"
            ? (filterAssert || []).filter(item => item.empid === employee.empid)
            : (filterAssert || []).filter(item => item.empid == item.subempid);

    const openModal = (gateid) => {
        console.log("gate id", gateid);
        setSelectedId(gateid);

        setModalVisibled(true);
    };

    const openModal1 = (gateid) => {
        console.log("gate id", gateid);
        setSelectedId(gateid);

        setModalVisibled(true);
    };
    console.log("selected gate id", selectedUserId);

    const Deleterecord = (action) => {
        const deletedata = {
            deleteid: selectedUserId,
            empid: employee.empid,
            tag: action
        };
        console.log("filterData", deletedata);

        dispatch(UpdateGateReport(deletedata))
            .then((res) => {
                console.log("delete response", res);
                if (res.success) {
                    alert("Record Deleted Successfully");
                }

                dispatch(GateReport(employee.empid))
                    .then((res) => {
                        const rawData = res.data || [];
                        const AssetReport = rawData.map((item) => ({
                            id: item.gateid,
                            purpose: item.purpose,
                            applydate: item.applydate,
                            reason: item.reason,
                            approveby: item.approveby,
                            status: item.status,
                            empid: item.empid,
                            empname: item.empname,
                            approvedname: item.approvedname,
                            gateid: item.gateid,
                        }));
                        console.log("assetdata", AssetReport);
                        setFilterAssert(AssetReport);
                    });
                setModalVisibled(false);
            })
            .catch((error) => console.log("error in leave avilaty", error));


        setdata({ date: data.date, purpose: "", desc: "" });

    };

    return (
        <View style={{ flex: 1, padding: 10 }}>
            {/* ===== Tabs ===== */}
            <View style={styles.tabRow}>
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
            </View>

            {/* ===== Leave Cards ===== */}

            <FlatList
                data={filteredData}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>

                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.type} Gate Pass</Text>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <TouchableOpacity  onPress={() => openModal(item.gateid)}>
                                <Text
                                    style={[
                                        styles.cardStatus,
                                        item.status === "pending" && { backgroundColor: "#FFC107" },
                                        item.status === "Approval" && { backgroundColor: "#4CAF50" },
                                        item.status === "Reject" && { backgroundColor: "#E53935" },
                                    ]}
                                >
                                    {item.status}
                                </Text>
                              </TouchableOpacity>

                                {item.empid === employee.empid && (
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => openModal(item.gateid)}>
                                        <Ionicons name="trash" size={22} color="#E53935" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>


                        <View style={styles.cardRow}>
                            <Ionicons name="calendar" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}> Apply Date:</Text>
                            <Text style={styles.cardText}>
                                {item.applydate}
                            </Text>
                        </View>

                        {item.empid != item.subempid ? (
                            <View style={styles.cardRow}>
                                <Ionicons name="people" size={18} color="#444" style={{ marginRight: 6 }} />
                                <Text style={styles.cardLabel}>Approver:</Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>

                                    <View style={styles.approverBadge}>
                                        <Text style={styles.approverText}>
                                            {item.approvedname}

                                        </Text>
                                    </View>

                                </View>
                            </View>
                        ) : (
                            <View style={styles.cardRow}>
                                <Ionicons name="people" size={18} color="#444" style={{ marginRight: 6 }} />
                                <Text style={styles.cardLabel}>Employee Name:</Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>

                                    <View style={styles.approverBadge}>
                                        <Text style={styles.approverText}>
                                            {item.empname}
                                        </Text>
                                    </View>

                                </View>
                            </View>
                        )}

                        <View style={styles.cardRow}>
                            <Ionicons name="chatbubble" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Purpose:</Text>
                            <Text style={styles.cardText}>{item.purpose}</Text>
                        </View>
                        <View style={styles.cardRow}>
                            <Ionicons name="chatbubble" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Description:</Text>
                            <Text style={styles.cardText}>{item.reason}</Text>
                        </View>


                        <View style={styles.cardFooter}>
                            <Ionicons name="time" size={16} color="#666" style={{ marginRight: 6 }} />
                            <Text style={styles.footerText}>
                                Applied on {item.applydate}
                            </Text>
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
                visible={showModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <View style={{ width: "90%", padding: 20, backgroundColor: "#fff", borderRadius: 12 }}>
                        {/* <View style={{backgroundColor:'red'}}> */}
                        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}> Apply Gate Pass</Text>
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
                            placeholder="Select Purpose"
                            style={{ borderColor: "#ccc" }}
                            dropDownContainerStyle={{ borderColor: "#ccc" }}
                        />

                        {/* Reason Field */}
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
                <View style={styles.deleteModel}>
                    <View style={styles.modelContent}>
                        {/* <View style={styles.cancelview}>
                            <Image source={require('../assets/images/cancel_card.png')} style={styles.cancelimg} />
                        </View> */}
                        <Text style={styles.deletecontent}>Do You want to Delete this record ?</Text>

                        <View flexDirection='row' style={styles.projectbtn}>
                            <TouchableOpacity style={styles.headcancel} onPress={() => Deleterecord("delete")}>
                                <Text style={styles.canceltext}>OK</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.addheadbtn} onPress={() => setModalVisibled(false)}>
                                <Text style={styles.canceltext}>cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal animationIn="slideInUp" isVisible={isModalVisibled}>
                <View style={styles.deleteModel}>
                    <View style={styles.modelContent}>
                        {/* <View style={styles.cancelview}>
                            <Image source={require('../assets/images/cancel_card.png')} style={styles.cancelimg} />
                        </View> */}
                        <Text style={styles.deletecontent}>Do You want to Approve this record ?</Text>

                        <View flexDirection='row' style={styles.projectbtn}>
                            <TouchableOpacity style={styles.headcancel} onPress={() => Deleterecord("update")}>
                                <Text style={styles.canceltext}>OK</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.addheadbtn} onPress={() => setModalVisibled(false)}>
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

export default GatePass;

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
        backgroundColor: "#d3d1d1ff",
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
        color: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 5,
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
        paddingVertical: 5,
    },

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
});
