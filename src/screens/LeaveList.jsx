import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import DatePicker from 'react-native-date-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLeaveRec, getApplyedSubordinate, getApplyLeaveStatus, getLeaveAsync, searchLeaves } from '../services/Actions/employeeAction';
import moment from 'moment';
import { useLoading } from '../navigation/LoadingContext';
import SweetAlert from 'react-native-sweet-alert';
import { useFocusEffect } from '@react-navigation/native';
const { width, height } = Dimensions.get("window");

const LeaveList = ({ navigation }) => {
    const { employee } = useSelector(state => state.employee);
    const dispatch = useDispatch();
    const { loading, setLoading } = useLoading();

    const [searchText, setSearchText] = useState('');
    const [showFilterBox, setShowFilterBox] = useState(false);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [statusOpen, setStatusOpen] = useState(false);
    const [statusValue, setStatusValue] = useState('all');

    const [activeTab, setActiveTab] = useState('self');

    const [leaveTypeOpen, setLeaveTypeOpen] = useState(false);
    const [leaveTypeValue, setLeaveTypeValue] = useState(null);
    const [leaveTypeItems, setLeaveTypeItems] = useState([]);

    const [selfLeaves, setSelfLeaves] = useState([]);
    const [subLeaves, setSubLeaves] = useState([]);

    // ===== Store original fetched data =====
    const [originalSelfLeaves, setOriginalSelfLeaves] = useState([]);
    const [originalSubLeaves, setOriginalSubLeaves] = useState([]);

    const [fileType, setFileType] = useState(null);
    const [fileUri, setFileUri] = useState(null);
    const [visible, setVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!employee?.empid) return;
            let isMounted = true;
            setLoading(true);

            const fetchData = async () => {
                try {
                    const [leaveTypesRes, selfLeavesRes, subLeavesRes] = await Promise.all([
                        dispatch(getLeaveAsync()),
                        dispatch(getApplyLeaveStatus(employee.empid)),
                        dispatch(getApplyedSubordinate(employee.empid)),
                    ]);

                    if (!isMounted) return;

                    // Leave Types
                    if (leaveTypesRes.leaveTypes && leaveTypesRes.leaveTypes.length > 0) {
                        const mappedLeaveTypes = leaveTypesRes.leaveTypes.map(item => ({
                            label: item.leave_type,
                            value: item.leaveid,
                        }));
                        setLeaveTypeItems(mappedLeaveTypes);
                    }

                    // Self Leaves
                    const leaves = selfLeavesRes.appledLeave || [];
                    setSelfLeaves(leaves);
                    setOriginalSelfLeaves(leaves);

                    // Subordinate Leaves
                    const subLeavesData = subLeavesRes.flatMap(emp =>
                        emp.attRep.map(leave => ({
                            ...leave,
                            empname: emp.empname,
                            empid: emp.empid,
                        }))
                    );
                    setSubLeaves(subLeavesData);
                    setOriginalSubLeaves(subLeavesData);

                } catch (err) {
                    if (!isMounted) return;
                    setSelfLeaves([]);
                    setOriginalSelfLeaves([]);
                    setSubLeaves([]);
                    setOriginalSubLeaves([]);
                    console.error('fetchData error:', err);
                } finally {
                    if (isMounted) setLoading(false);
                }
            };

            fetchData();

            return () => {
                isMounted = false;
                setLoading(false); // screen blur ya unmount hone pe loader false
            };
        }, [dispatch, employee?.empid])
    );

    // search logic here 
    useEffect(() => {
        if (!searchText) {
            // If search text empty, restore original data
            if (activeTab === 'self') {
                setSelfLeaves(originalSelfLeaves);
            } else {
                setSubLeaves(originalSubLeaves);
            }
            return;
        }

        const text = searchText.toLowerCase();

        if (activeTab === 'self') {
            const filtered = originalSelfLeaves.filter(item =>
                (item.empname && item.empname.toLowerCase().includes(text)) ||
                (item.leave_type && item.leave_type.toLowerCase().includes(text)) ||
                (item.status !== undefined &&
                    (item.status === "0" && "pending".includes(text) ||
                        item.status === "1" && "approved".includes(text) ||
                        item.status === "2" && "rejected".includes(text)))
            );
            setSelfLeaves(filtered);
        } else {
            const filtered = originalSubLeaves.filter(item =>
                (item.empname && item.empname.toLowerCase().includes(text)) ||
                (item.leave_type && item.leave_type.toLowerCase().includes(text)) ||
                (item.status !== undefined &&
                    (item.status === "0" && "pending".includes(text) ||
                        item.status === "1" && "approved".includes(text) ||
                        item.status === "2" && "rejected".includes(text)))
            );
            setSubLeaves(filtered);
        }
    }, [searchText, activeTab, originalSelfLeaves, originalSubLeaves]);

    const applyFilter = () => {
        const filterData = {
            fromDate: fromDate ? moment(fromDate).format("YYYY-MM-DD") : "",
            toDate: toDate ? moment(toDate).format("YYYY-MM-DD") : "",
            status: statusValue === "pending" ? 0 : statusValue === "approval" ? 1 : statusValue === "reject" ? 2 : "all",
            leaveid: leaveTypeValue || "",
            empid: employee.empid
        };

        // ✅ If All & no other filter, return original data
        if (filterData.status === "all" && !filterData.leaveid && !filterData.fromDate && !filterData.toDate) {
            if (activeTab === "self") {
                setSelfLeaves(originalSelfLeaves);
            } else {
                setSubLeaves(originalSubLeaves);
            }
            return;
        }

        // 🔹 Normal filter
        dispatch(searchLeaves(filterData)).then((res) => {
            if (activeTab === "self") {
                setSelfLeaves(res.data || []);
            } else {
                setSubLeaves(res.data || []);
            }
        });
    };

    const handleClearFilter = () => {
        setShowFromPicker(false);
        setShowToPicker(false);
        setFromDate(null);
        setToDate(null);
        setStatusValue('all');
        setStatusOpen(false);
        setLeaveTypeValue(null);
    };

    const handleDelete = (id) => {
        dispatch(deleteLeaveRec(id))
            .then((res) => {
                if (res.success) {
                    // Show success alert first
                    SweetAlert.showAlertWithOptions({
                        title: "Deleted!",
                        subTitle: res.message,
                        confirmButtonTitle: 'OK',
                        confirmButtonColor: "#FF0000",
                        style: 'success'
                    }, () => {
                        // ✅ Update local state after user confirms
                        if (activeTab === 'self') {
                            const updatedSelf = selfLeaves.filter(item => item.lreqid !== id);
                            setSelfLeaves(updatedSelf);
                            setOriginalSelfLeaves(updatedSelf);
                        } else {
                            const updatedSub = subLeaves.filter(item => item.lreqid !== id);
                            setSubLeaves(updatedSub);
                            setOriginalSubLeaves(updatedSub);
                        }

                        // Optionally, fetch fresh data from server again
                        dispatch(getApplyLeaveStatus(employee.empid));
                    });

                } else {
                    SweetAlert.showAlertWithOptions({
                        title: "Error!",
                        subTitle: res.message,
                        confirmButtonTitle: 'OK',
                        confirmButtonColor: "#FFA000",
                        style: 'error'
                    });
                }
            })
            .catch((err) => {
                SweetAlert.showAlertWithOptions({
                    title: "Error!",
                    subTitle: "Something went wrong",
                    confirmButtonTitle: 'OK',
                    confirmButtonColor: "#FFA000",
                    style: 'error'
                });
                console.error("Delete leave error", err);
            });
    };

    const filteredLeave = activeTab === 'self' ? selfLeaves : subLeaves;

    const openDoc = (uri) => {
        if (uri.endsWith(".pdf")) {
            setFileType("pdf");
        } else {
            setFileType("image");
        }
        setFileUri(uri);
        setVisible(true);
    };

    return (
        <View style={{ flex: 1, padding: 10 }}>

            {/* Search + Filter Row */}
            <View style={styles.row}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by Leave type , name , status..."
                    placeholderTextColor="#a7a4a4ff"
                    value={searchText}
                    onChangeText={setSearchText}
                />
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => setShowFilterBox(!showFilterBox)}
                >
                    <Ionicons name="filter-outline" size={24} color="#fff" />
                    <Text style={{ color: "#fff", marginLeft: 5 }}>Filter</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Box */}
            {showFilterBox && (
                <View style={styles.filterBox}>
                    <Text style={styles.filterTitle}>Filter Options</Text>
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            style={[styles.dateInput, { marginRight: 10 }]}
                            onPress={() => setShowFromPicker(true)}
                        >
                            <Text>From: {fromDate ? moment(fromDate).format("DD-MM-YYYY") : "Select"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowToPicker(true)}
                        >
                            <Text>To: {toDate ? moment(toDate).format("DD-MM-YYYY") : "Select"}</Text>
                        </TouchableOpacity>
                    </View>

                    <DatePicker
                        modal
                        mode="date"
                        open={showFromPicker}
                        date={fromDate || new Date()}
                        onConfirm={(date) => { setShowFromPicker(false); setFromDate(date); }}
                        onCancel={() => setShowFromPicker(false)}
                    />
                    <DatePicker
                        modal
                        mode="date"
                        open={showToPicker}
                        date={toDate || new Date()}
                        onConfirm={(date) => { setShowToPicker(false); setToDate(date); }}
                        onCancel={() => setShowToPicker(false)}
                    />

                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Select Status</Text>
                            <DropDownPicker
                                open={statusOpen}
                                value={statusValue}
                                items={[
                                    { label: "All", value: "all" },
                                    { label: "Pending", value: "pending" },
                                    { label: "Approval", value: "approval" },
                                    { label: "Reject", value: "reject" },
                                ]}
                                setOpen={setStatusOpen}
                                setValue={setStatusValue}
                                placeholder="Select Status"
                                containerStyle={{ marginTop: 10 }}
                            />
                        </View>

                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Select Leave Type</Text>
                            <DropDownPicker
                                open={leaveTypeOpen}
                                value={leaveTypeValue}
                                items={leaveTypeItems}
                                setOpen={setLeaveTypeOpen}
                                setValue={setLeaveTypeValue}
                                setItems={setLeaveTypeItems}
                                placeholder="Select Leave Type"
                                containerStyle={{ marginTop: 10 }}
                            />
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
                        <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>Apply</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilter}>
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Tabs */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'self' && styles.activeTab]}
                    onPress={() => setActiveTab('self')}
                >
                    <Text style={activeTab === 'self' ? styles.activeTabText : styles.tabText}>Self</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'sub' && styles.activeTab]}
                    onPress={() => setActiveTab('sub')}
                >
                    <Text style={activeTab === 'sub' ? styles.activeTabText : styles.tabText}>Sub-ordinate</Text>
                </TouchableOpacity>
            </View>

            {/* Leave Cards */}
            <FlatList
                data={filteredLeave}
                keyExtractor={item => item.lreqid}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.leave_type}</Text>
                            <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                <Text
                                    style={[
                                        styles.cardStatus,
                                        item.status === "0" && { backgroundColor: "#FFC107" },
                                        item.status === "1" && { backgroundColor: "#4CAF50" },
                                        item.status === "2" && { backgroundColor: "#E53935" },
                                    ]}
                                >
                                    {item.status === "0" ? "Pending" : item.status === "1" ? "Approved" : "Rejected"}
                                </Text>
                                {item.status !== "1" && employee?.empid === item.applyby && (
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.lreqid)}>
                                        <Ionicons name="trash-sharp" size={22} color="#E53935" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <View style={styles.cardRow}>
                            <Ionicons name="calendar" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Date:</Text>
                            <Text style={styles.cardText}>
                                {moment(item.fdate).format('DD-MM-YYYY')}
                                <Text style={{ color: "#E95353", fontSize: 20 }}> ⟶ </Text>
                                {moment(item.tdate).format('DD-MM-YYYY')}
                            </Text>
                        </View>

                        <View style={styles.cardRow}>
                            <Ionicons name="person" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Apply by:</Text>
                            <Text style={styles.cardText}>{item.empname}</Text>
                        </View>
                        <View style={styles.cardRow}>
                            <Ionicons name="people" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Approver:</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                <View style={styles.approverBadge}>
                                    <Text style={styles.approverText}>
                                        {item.approveby_name || "Not Approved"} (
                                        {item.status === "0" ? <Text style={{ color: "#FFC107" }}>P</Text>
                                            : item.status === "1" ? <Text style={{ color: "#4CAF50" }}>A</Text>
                                                : <Text style={{ color: "#E53935" }}>R</Text>}
                                        )
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.cardRow}>
                            <Ionicons name="chatbubble" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Remark:</Text>
                            <Text style={styles.cardText}>{item.remark}</Text>
                        </View>

                        {/* <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            
                            <View style={styles.cardFooter}>
                                <Ionicons name="time" size={16} color="#666" style={{ marginRight: 6 }} />
                                <Text style={styles.footerText}>
                                    Applied on {moment(item.applydate).format('DD-MM-YYYY')}
                                </Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <Ionicons name="documents" size={18} color="#444" style={{ marginRight: 6 }} />
                                <Text style={styles.cardLabel}>Documents:</Text>
                                <TouchableOpacity onPress={() => openDoc(`https://chaaruvi.com/hrms/Mobileapp/Leave_document/${item.documents}`)}>
                                    <Ionicons name="eye" size={18} color="#E53935" style={{ marginRight: 6 }} />
                                </TouchableOpacity>
                            </View>
                        </View> */}

                        <View style={styles.cardFooter}>
                            <Ionicons name="time" size={16} color="#666" style={{ marginRight: 6 }} />
                            <Text style={styles.footerText}>
                                Applied on {moment(item.applydate).format('DD-MM-YYYY')}
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: '#000', textAlign: 'center', marginVertical: 50 }}>
                            {activeTab === 'self'
                                ? "No self leave records found"
                                : "No subordinate leave records found"}
                        </Text>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.fabBtn} onPress={() => navigation.navigate('Leave')}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default LeaveList;

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
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
    },
    header: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    dateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    dateInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 5,
    },
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
        backgroundColor: "#E95535",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        marginBottom: 10,
    },

    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
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
        elevation: 5
    },

    // deleteBtn: {
    //     padding: 6,
    //     borderRadius: 20,
    // },

    cardRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        // paddingVertical: 5,
        marginBottom: 2
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
        marginBottom: 4
    },

    approverBadge: {
        backgroundColor: "#F0F0F0",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginRight: 6,
        marginBottom: 6,
    },

    approverText: {
        fontSize: 12,
        fontWeight: "500",
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
});
