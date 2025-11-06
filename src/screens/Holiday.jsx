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
// import DropDownPicker from 'react-native-dropdown-picker';
// import DatePicker from 'react-native-date-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import { useFocusEffect } from '@react-navigation/native';
import { getholidaylist } from '../services/Actions/employeeAction';
import { useDispatch, useSelector } from 'react-redux';
import { useLoading } from '../navigation/LoadingContext';
const { width, height } = Dimensions.get("window");

const Holiday = ({ navigation }) => {

    // ===== useSelector & useDispatch =====     
    const { employee } = useSelector(state => state.employee);
    const dispatch = useDispatch();

    // ===== States =====
    const [searchText, setSearchText] = useState('');
    // const [showFilterBox, setShowFilterBox] = useState(false);
    // const [fromDate, setFromDate] = useState(new Date());
    // const [toDate, setToDate] = useState(new Date());
    // const [showFromPicker, setShowFromPicker] = useState(false);
    // const [showToPicker, setShowToPicker] = useState(false);
    // const [statusOpen, setStatusOpen] = useState(false);
    // const [statusValue, setStatusValue] = useState('all');
    const [filterassert, setFilterAssert] = useState(null);
    const [allHolidays, setAllHolidays] = useState([]);
    const { loading, setLoading } = useLoading();


    // ===== Sample Leave Data =====
    // const leaveData = [
    //     {
    //         id: '1',
    //         type: 'Unpaid',
    //         status: 'Pending',
    //         fromDate: '20/08/2025',
    //         toDate: '22/08/2025',
    //         approvers: [{ name: 'Bikram', status: 'Pending' }],
    //         remark: 'Family function',
    //         applyDate: '20/08/2025',
    //         applyTime: '11:07 AM',
    //     },
    //     {
    //         id: '2',
    //         type: 'Paid',
    //         status: 'Approval',
    //         fromDate: '10/08/2025',
    //         toDate: '12/08/2025',
    //         approvers: [
    //             { name: 'Bikram', status: 'Approved' },
    //             { name: 'Manager', status: 'Pending' },
    //         ],
    //         remark: 'Vacation',
    //         applyDate: '09/08/2025',
    //         applyTime: '10:00 AM',
    //     },
    // ];

    // const handleClearFilter = () => {
    //     // setFilterValue(null);
    //     setShowFromPicker(false);
    //     setShowToPicker(false);
    //     setFromDate(new Date());
    //     setToDate(new Date());
    //     setStatusValue('all');
    //     setStatusOpen(false);
    //     // setFilterOpen(false);
    // };

    useEffect(() => {
        if (!employee?.empid) return;
        setLoading(true);

        dispatch(getholidaylist(employee.empid))
            .then((res) => {
                setLoading(false);
                const rawData = res.data || [];

                const holiday = rawData.map((item) => {
                    const dateObj = new Date(item.dates);
                    const day = dateObj.getDate();
                    const month = dateObj.toLocaleString('default', { month: 'short' });

                    return {
                        id: item.holidayid,
                        date: item.dates,
                        day,
                        hname: item.holiday_name,
                        month,
                    };
                });

                setAllHolidays(holiday);       // Save original
                setFilterAssert(holiday);      // Show full list initially
            })
            .catch((error) => console.log("error in leave availability", error));
    }, [dispatch, employee?.empid]);



    useEffect(() => {
        if (!searchText) {
            setFilterAssert(allHolidays);
        } else {
            const filtered = [...allHolidays]
                .filter(item => item.hname.toLowerCase().includes(searchText.toLowerCase()))
                .sort((a, b) => {
                    // Prioritize items where searchText appears earlier
                    return (
                        a.hname.toLowerCase().indexOf(searchText.toLowerCase()) -
                        b.hname.toLowerCase().indexOf(searchText.toLowerCase())
                    );
                });

            setFilterAssert(filtered);
        }
    }, [searchText, allHolidays]);


    console.log("filterassert", searchText);
    return (
        <View style={{ flex: 1, padding: 10 }}>
            {/* ===== Search + Filter Icon Row ===== */}
            {/* <View style={styles.tabRow}>
                <Text style={styles.heading}>Holidays</Text>
            </View> */}
            <View style={styles.row}>

                <TextInput

                    style={styles.searchInput}
                    placeholder="Search Event..."
                    placeholderTextColor="#000"
                    value={searchText}
                    onChangeText={setSearchText}

                />

            </View>

            {/* ===== Filter Box ===== */}
            <FlatList
                data={filterassert}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={[styles.dateBox, { backgroundColor: 'green' }]}>
                                <Text style={styles.dateText}>{item.day}</Text>
                                <Text style={styles.dayText}>{item.month}</Text>
                            </View>
                            <Text style={[styles.cardText, { fontSize: 16, fontWeight: 'bold' }]}>{item.hname}</Text>
                        </View>

                        <View style={styles.cardRow}>
                        </View>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.fabBtn} onPress={() => navigation.navigate('Leave')}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default Holiday;

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    dropdown: { flexDirection: "row", justifyContent: "space-between", width: '100%' },
    filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
    filterBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, elevation: 4, zIndex: 1000 },
    filterTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 10, color: '#333' },
    searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginRight: 10, height: 50, backgroundColor: 'white', marginBottom: 20, color: 'black' },
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
        paddingVertical: 1,
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
    heading: {
        fontSize: 24,       // Larger font size for heading
        fontWeight: 'bold', // Bold text
        color: 'red',      // Darker color for better visibility
        textAlign: 'center'
        // optional: marginBottom: 10
    },
    dateBox: { width: 60, height: 60, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 10 },
    dateText: { fontSize: 14, fontWeight: 'bold', color: "white" },
    dayText: { fontSize: 10, textAlign: 'center', color: "white" },
});
