import React, { useEffect, useState } from 'react';
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
import { getAssets, getAssetsReport } from '../services/Actions/employeeAction';
import moment from 'moment';
import { useLoading } from '../navigation/LoadingContext';
const { width, height } = Dimensions.get("window");

const Assets = ({ navigation }) => {
    // ===== States =====
    const { employee } = useSelector(state => state.employee);
    const dispatch = useDispatch()
    const [searchText, setSearchText] = useState('');
    const [showFilterBox, setShowFilterBox] = useState(false);
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [statusOpenasset, setStatusOpenAsset] = useState(false);
    const [activeTab, setActiveTab] = useState('self');
    const [itemValue, setItemValue] = useState([]);
    const [items, setItems] = useState([]);
    const [statusValue, setStatusValue] = useState(null); // no default yet
    const [selectstatus, setSelectStatus] = useState([]);
    const [selectfromdate, setSelectfromdate] = useState();
    const [selecttodate, setSelecttodate] = useState();
    const [filterAssert, setFilterAssert] = useState(null);
    const { loading, setLoading } = useLoading();

    console.log(statusValue);

    // ===== Sample Leave Data =====
    const statusmaster = [
        {
            statusid: '1',
            status: 'Approve',
        },
        {
            statusid: '2',
            status: 'Reject',
        },
    ];

    const handleClearFilter = () => {
        // setFilterValue(null);
        setShowFromPicker(false);
        setShowToPicker(false);
        setFromDate(new Date());
        setToDate(new Date());
        setSelectStatus(null);
        setStatusOpen(false);
        setStatusOpenAsset(false);
        setItemValue(null);

    };

    // Assert Master
    useEffect(() => {
        setLoading(true);
        dispatch(getAssets())
            .then((res) => {
                console.log(res.data);
                const Asset = res.data || [];

                const assetdata = Asset.map((item) => ({
                    label: item?.assetname || "N/A",
                    value: item?.assetid || 0
                }));
                console.log("assetdata", assetdata);
                setItems(assetdata);
            })
            .catch((error) => {
                console.log("assetdata error", error);
            })
            .finally(() => {
                setLoading(false); // ✅ stop loader here
            });
    }, [dispatch]);


    console.log("items", items);


    //Status Master
    useEffect(() => {
        const statusdata = statusmaster.map((item) => ({
            label: item?.status || "N/A",  // 👈 user sees name
            value: item?.statusid || 0         // 👈 you get the ID when selected
        }));
        setSelectStatus(statusdata);

    }, [dispatch])


    // Get Assert Report
    const handleChackLeaveAvility = () => {
        console.log("fromdate", selectfromdate,);
        const filterData = {
            fromDate: moment(fromDate).format("YYYY-MM-DD"),
            toDate: moment(toDate).format("YYYY-MM-DD"),
            status: statusValue,
            item: itemValue,
            empid: employee.empid,
        };
        console.log("filterData", filterData);

        dispatch(getAssetsReport(filterData))
            .then((res) => {
                const rawData = res.data || [];

                const AssetReport = rawData.map((item) => ({
                    id: item.asgnassetid,
                    type: item.type,
                    status: item.status === "1" ? "Approval" :
                        item.status === "0" ? "Pending" :
                            item.status === "2" ? "Reject" : "Reject",
                    fromDate: item.assigndate,
                    toDate: item.issuedate,
                    empid: item.empid,
                    empName: item.empname,
                    itemname: item.itemname,
                    itemid: item.assetid,
                    purpose: item.purpose,
                    applyDate: item.approvedate,
                    applyTime: item.created_at.split(" ")[1],
                }));

                console.log("response data ", res.data);
                setFilterAssert(AssetReport);
            })
            .catch((error) => console.log("error in leave avilaty", error));
        //  setShowFilterBox(false); 
    };

    // const applyFilter = () => {
    //     console.log("Applied Filter Data:", filterData);
    //     setShowFilterBox(false);
    // };

    const filteredData =
        activeTab === "self"
            ? (filterAssert || []).filter(item => item.status == "Pending")
            : (filterAssert || []).filter(item => item.status == "Approval");

    return (
        <View style={{ flex: 1, padding: 10 }}>
            {/* ===== Search + Filter Icon Row ===== */}
            <View style={styles.row}>
                <TextInput
                    // style={styles.searchInput}
                    // placeholder="Search Leave..."
                    placeholderTextColor="#000"
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

            {/* ===== Filter Box ===== */}
            {showFilterBox && (
                <View style={styles.filterBox}>
                    <Text style={styles.filterTitle}>Filter Options</Text>

                    {/* Date Filters */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowFromPicker(true)}
                        >
                            <Text>From: {fromDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        <DatePicker
                            modal
                            mode="date"
                            open={showFromPicker}
                            date={fromDate}
                            onConfirm={(date) => {
                                setShowFromPicker(false);
                                setFromDate(date);
                            }}
                            onCancel={() => setShowFromPicker(false)}
                        />

                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowToPicker(true)}
                        >
                            <Text>To: {toDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    </View>



                    <DatePicker
                        modal
                        mode="date"
                        open={showToPicker}
                        date={toDate}
                        onConfirm={(date) => {
                            setShowToPicker(false);
                            setToDate(date);
                        }}
                        onCancel={() => setShowToPicker(false)}
                    />




                    <View style={styles.row}>
                        {/* Status Filter */}
                        <View style={{ width: '49%' }}>
                            <Text> Status</Text>
                            <DropDownPicker
                                open={statusOpen}
                                value={statusValue}
                                items={selectstatus}
                                setOpen={setStatusOpen}
                                setValue={setStatusValue}
                                placeholder="Select Status"
                                containerStyle={{ marginTop: 10 }}
                                onChangeValue={(value) => {
                                    setStatusValue(value);
                                    handleChackLeaveAvility(value);
                                }}

                            />
                        </View>
                        <View style={{ width: '49%' }}>
                            <Text>  Asset Item</Text>
                            <DropDownPicker
                                open={statusOpenasset}
                                value={itemValue}
                                items={items}
                                setOpen={setStatusOpenAsset}
                                setValue={setItemValue}
                                placeholder="Select Status"
                                containerStyle={{ marginTop: 10 }}
                                onChangeValue={(value) => {
                                    setItemValue(value);
                                    handleChackLeaveAvility(value);
                                }}
                            />
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
                        {/* Apply Button */}
                        <TouchableOpacity
                            style={styles.applyBtn}
                            onPress={handleChackLeaveAvility}
                        >
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>Apply</Text>
                        </TouchableOpacity>

                        {/* Clear Button */}
                        <TouchableOpacity
                            style={styles.clearBtn}
                            onPress={handleClearFilter}
                        >
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            )}


            {/* ===== Tabs ===== */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'self' && styles.activeTab]}
                    onPress={() => setActiveTab('self')}
                >
                    <Text style={activeTab === 'self' ? styles.activeTabText : styles.tabText}>Pendding</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'sub' && styles.activeTab]}
                    onPress={() => setActiveTab('sub')}
                >
                    <Text style={activeTab === 'sub' ? styles.activeTabText : styles.tabText}>Approved</Text>
                </TouchableOpacity>
            </View>

            {/* ===== Leave Cards ===== */}
            <FlatList
                data={filteredData}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>


                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}> Assert : {item.itemname}</Text>
                            <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                <Text
                                    style={[
                                        styles.cardStatus,
                                        item.status === "Pending" && { backgroundColor: "#FFC107" },
                                        item.status === "Approval" && { backgroundColor: "#4CAF50" },
                                        item.status === "Reject" && { backgroundColor: "#E53935" },
                                    ]}
                                >
                                    {item.status}
                                </Text>

                                {item.status !== "Approval" && (
                                    <TouchableOpacity style={styles.deleteBtn}>
                                        <Ionicons name="trash" size={22} color="#E53935" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>


                        <View style={styles.cardRow}>
                            <Ionicons name="calendar" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}> Apply Date:</Text>
                            <Text style={styles.cardText}>{item.fromDate}</Text>
                        </View>






                        <View style={styles.cardRow}>
                            <Ionicons name="chatbubble" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Purpose:</Text>
                            <Text style={styles.cardText}>{item.purpose}</Text>
                        </View>

                        <View style={styles.cardRow}>
                            <Ionicons name="chatbubble" size={18} color="#444" style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Status:</Text>
                            <Text
                                style={[
                                    styles.cardStatus,
                                    item.status === "Pending" && { backgroundColor: "#FFC107" },
                                    item.status === "Approval" && { backgroundColor: "#4CAF50" },
                                    item.status === "Reject" && { backgroundColor: "#E53935" },
                                ]}
                            >
                                {item.status}
                            </Text>
                        </View>


                    </View>
                )}
            />


            {/* <TouchableOpacity style={styles.fabBtn} >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity> */}
        </View>
    );
};

export default Assets;

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
