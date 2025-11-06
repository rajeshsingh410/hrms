import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
    Modal,
    Linking,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { getExpenses, getMyAbout, getMyPay, getMyPaySlip } from '../services/Actions/employeeAction';
import { useLoading } from '../navigation/LoadingContext';

const { width, height } = Dimensions.get('window');

// Reusable Card Component
const Card = ({ icon, title, subtitle, onPress, style }) => (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
        <View style={styles.iconContainer}>
            <Ionicons name={icon} size={30} color="#E53935" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{subtitle}</Text>
    </TouchableOpacity>
);

// -------------------- SECTION COMPONENTS --------------------

// Time Section
const TimeSection = () => (
    <ScrollView contentContainerStyle={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
            <Card
                key={i}
                icon="time-outline"
                title={`Time Log ${i + 1}`}
                subtitle="Worked on project XYZ"
            />
        ))}
    </ScrollView>
);

// Finance Section
const FinanceSection = ({ navigation, openModal, openFile }) => {
    const financeItems = [
        {
            icon: 'reader-outline',
            title: 'My Pay',
            subtitle: 'View salary details and payslips here',
            type: 'modal',
        },
        {
            icon: 'document-text-outline',
            title: 'Pay Slips',
            subtitle: 'View and download your previous payslips',
            type: 'modal',
        },
    ];

    const expenseItem = {
        icon: 'add-circle-outline',
        title: 'Add/Claim Expenses',
        subtitle: 'Create expenses, advance requests, mileage tracking, per diem and claim them',
        type: 'modal',
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.sectionHeader}>Salary</Text>
            <View style={styles.grid}>
                {financeItems.map((item) => (
                    <Card
                        key={item.title}
                        icon={item.icon}
                        title={item.title}
                        subtitle={item.subtitle}
                        onPress={() => {
                            if (item.type === 'modal') openModal(item.title);
                            else if (item.type === 'link') openFile(item.file);
                        }}
                    />
                ))}
            </View>

            <Text style={styles.sectionHeader}>Expenses</Text>
            <View style={styles.expenseContainer}>
                <Card
                    icon={expenseItem.icon}
                    title={expenseItem.title}
                    subtitle={expenseItem.subtitle}
                    style={styles.fullWidthCard}
                    onPress={() => openModal('Expenses')}
                />
            </View>
        </ScrollView>
    );
};

// Performance Section
const PerformanceSection = () => (
    <ScrollView contentContainerStyle={styles.grid}>
        <Card icon="create-outline" title="Personal Feedback" subtitle="Foster a culture of continuous learning" />
        <Card icon="hand-left-outline" title="Praise" subtitle="Appreciate your peers’ achievements" />
    </ScrollView>
);

// Documents Section
const DocumentsSection = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionHeader}>Documents</Text>
        <View style={styles.grid}>
            <Card icon="business-outline" title="Org Documents" subtitle="Official policies, handbooks" />
            <Card icon="document-text-outline" title="My Documents" subtitle="Your uploaded or assigned files" />
        </View>
    </ScrollView>
);

// -------------------- MAIN ABOUTME COMPONENT --------------------
const AboutMe = ({ navigation }) => {

    const EXPENCE_DOC_URL = "https://chaaruvi.com/hrms/storage/app/public/expenses";

    const { employee } = useSelector((state) => state.employee);
    const dispatch = useDispatch();
    const { loading, setLoading } = useLoading();

    const [aboutInfo, setAboutInfo] = useState(null);

    const [payData, setPayData] = useState([]);

    const [expenseData, setExpenseData] = useState([]);

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'time', title: 'Time' },
        { key: 'finances', title: 'Finances' },
        { key: 'performance', title: 'Performance' },
        { key: 'documents', title: 'Documents' },
    ]);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalSection, setModalSection] = useState('');
    const [expenseOptionVisible, setExpenseOptionVisible] = useState(false);

    useEffect(() => {
        if (employee?.empid) {
            setLoading(true);
            dispatch(getMyAbout(employee?.empid))
                .then((res) => setAboutInfo(res?.data || null))
                .finally(() => setLoading(false));
        }
    }, [dispatch, employee?.empid]);

    const handleExpenseOption = async (type) => {
        setExpenseOptionVisible(false);

        if (type === 'view') {
            try {
                setLoading(true);
                const res = await dispatch(getExpenses(employee.empid));
                if (res?.success === true) {
                    setExpenseData(res?.expenses || []);
                    setModalSection('Expenses');
                    setModalVisible(true);
                } else {
                    Alert.alert("No Data", "No expenses found.");
                }
            } catch (err) {
                Alert.alert("Error", "Unable to fetch expenses.");
            } finally {
                setLoading(false);
            }
        } else if (type === 'add') {
            navigation.navigate('ExpensesScreen')
        }
    };

    const openModal = async (section) => {
        setModalSection(section);
        try {
            setLoading(true);

            switch (section) {
                case 'My Pay':
                    await dispatch(getMyPay(employee.empid));
                    setModalVisible(true);
                    break;

                case 'Expenses':
                    setExpenseOptionVisible(true);
                    break;

                case 'Pay Slips':
                    await dispatch(getMyPaySlip(employee.empid))
                        .then((res) => {
                            if (res?.success === true) {
                                setPayData(res?.data || []);
                            }
                            else {
                                Alert.alert("No Data", "No payslips found.");
                            }
                        })
                    setModalVisible(true);
                    break;

                default:
                    break;
            }
        } catch (err) {
            Alert.alert('Error', 'Unable to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    const openFile = (url) => {
        Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open file.'));
    };

    const renderScene = SceneMap({
        time: TimeSection,
        finances: () => <FinanceSection navigation={navigation} openModal={openModal} openFile={openFile} />,
        performance: PerformanceSection,
        documents: DocumentsSection,
    });

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Image
                        source={aboutInfo?.profile_img_url ? { uri: aboutInfo.profile_img_url } : require('../assets/images/profile.png')}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#c5c5c5ff' }}
                    />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <TextInput style={styles.searchInput} placeholder="Search your colleagues" placeholderTextColor="#888" />
                </View>
            </View>

            {/* Tabs */}
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width }}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        indicatorStyle={styles.indicatorStyle}
                        style={styles.tabBar}
                        activeColor="#E53935"
                        inactiveColor="#333"
                        labelStyle={styles.labelStyle}
                        scrollEnabled
                        tabStyle={styles.tabStyle}
                    />
                )}
            />

            {/* Expense Options Modal */}
            {/* Expense Options Modal */}
            <Modal
                animationType="fade"
                transparent
                visible={expenseOptionVisible}
                onRequestClose={() => setExpenseOptionVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.optionModalContainer}>
                        {/* Close Button */}
                        <TouchableOpacity
                            style={styles.closeIconButton}
                            onPress={() => setExpenseOptionVisible(false)}
                        >
                            <Ionicons name="close-circle" size={28} color="#E53935" />
                        </TouchableOpacity>

                        {/* Title */}
                        <Text style={styles.optionHeader}>Choose an Option</Text>

                        {/* Options */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => handleExpenseOption('add')}
                        >
                            <Ionicons name="add-circle-outline" size={22} color="#E53935" />
                            <Text style={styles.optionText}>Add Expense</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => handleExpenseOption('view')}
                        >
                            <Ionicons name="document-text-outline" size={22} color="#1E88E5" />
                            <Text style={styles.optionText}>View Report</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Main Modal */}
            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Cancel Icon Fixed Top Right */}
                        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Ionicons name="close-circle" size={30} color="#E53935" />
                        </TouchableOpacity>

                        <ScrollView>
                            <View style={styles.modalHeaderBox}>
                                <View>
                                    <Text style={styles.modalHeader}>{employee?.empname || 'Employee'}</Text>
                                    <Text style={styles.modalSubHeader}>{modalSection}</Text>
                                </View>
                            </View>

                            {/* My Pay */}
                            {modalSection === 'My Pay' && (
                                <View>
                                    <View style={styles.tableHeader}>
                                        <Text style={styles.tableHeaderText}>Date</Text>
                                        <Text style={styles.tableHeaderText}>Amount</Text>
                                    </View>
                                    {payData.map((item, idx) => (
                                        <TouchableOpacity key={idx} style={styles.reportCard} onPress={() => openFile(item.file)}>
                                            <View style={styles.reportRowBetween}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons name="calendar-outline" size={20} color="#E53935" />
                                                    <Text style={styles.reportText}>{item.date}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons name="cash-outline" size={20} color="green" />
                                                    <Text style={styles.reportText}>₹{item.amount}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Pay Slips */}
                            {modalSection === 'Pay Slips' && (
                                <View>
                                    <View style={styles.tableHeader}>
                                        <Text style={styles.tableHeaderText}>Date</Text>
                                        <Text style={styles.tableHeaderText}>Download</Text>
                                    </View>
                                    {payData.map((item, idx) => (
                                        <View key={idx} style={styles.reportCard}>
                                            <View style={styles.reportRowBetween}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons name="calendar-outline" size={20} color="#E53935" />
                                                    <Text style={styles.reportText}>{item.expdate}</Text>
                                                </View>

                                                {
                                                    item?.file && (
                                                        <TouchableOpacity onPress={() => openFile(`${EXPENCE_DOC_URL}/${item.file}`)}>
                                                            <Ionicons name="download" size={24} color="#E53935" />
                                                        </TouchableOpacity>
                                                    )
                                                }
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Expenses */}
                            {modalSection === 'Expenses' && (
                                <View>
                                    <View style={styles.tableHeader}>
                                        <Text style={styles.tableHeaderText}>Date</Text>
                                        <Text style={styles.tableHeaderText}>Expense Name</Text>
                                        <Text style={styles.tableHeaderText}>Amount</Text>
                                    </View>
                                    {expenseData.map((item, idx) => (
                                        <View key={idx} style={styles.reportCard}>
                                            <View style={styles.reportRowBetween}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons name="calendar-outline" size={20} color="#E53935" />
                                                    <Text style={styles.reportText}>{item.date}</Text>
                                                </View>
                                                <Text style={styles.reportText}>{item.headname}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons name="cash-outline" size={20} color="green" />
                                                    <Text style={styles.reportText}>₹{item.amount}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

export default AboutMe;

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    headerRow: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingTop: 20, backgroundColor: '#fff' },
    searchContainer: { flex: 1, marginLeft: 10 },
    searchInput: { height: 40, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, fontSize: 14, color: '#000' },
    indicatorStyle: { backgroundColor: '#E53935', height: 3 },
    tabBar: { backgroundColor: '#fff', elevation: 2 },
    labelStyle: { fontWeight: '600', fontSize: 12 },
    tabStyle: { minWidth: 80 },
    scrollContainer: { paddingBottom: 16 },
    sectionHeader: { color: '#000', fontSize: 16, fontWeight: 'bold', paddingLeft: 16, marginTop: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
    expenseContainer: { width: '100%', paddingHorizontal: 16, marginBottom: 16 },
    card: { width: width / 2 - 24, backgroundColor: '#fafafa', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    fullWidthCard: { width: width - 32 },
    iconContainer: { padding: 12, borderRadius: 50, backgroundColor: '#fff', marginBottom: 8 },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#E53935', textAlign: 'center' },
    cardText: { color: '#333', fontSize: 12, textAlign: 'center', marginTop: 4 },
    tableHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fbe9e7', borderRadius: 6, marginBottom: 10, width: width - 70 },
    tableHeaderText: { fontSize: 14, fontWeight: '700', color: '#444', flex: 1, textAlign: 'center' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContainer: { width: width - 40, height: height - 200, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
    modalHeaderBox: { backgroundColor: '#fbe9e7', padding: 12, borderRadius: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalHeader: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    modalSubHeader: { fontSize: 15, fontWeight: '600', color: '#E53935', marginTop: 4 },
    reportRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reportCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, shadowColor: '#737373', shadowOpacity: 0.05, shadowRadius: 4, elevation: 10, width: width - 70 },
    reportText: { fontSize: 14, color: '#333', marginLeft: 8 },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
    },
    optionModalContainer: {
        width: width - 80,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        position: 'relative',
    },
    optionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 25,
        textAlign: 'center'
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 4,
    },
    optionButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    optionText: {
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '500',
        color: '#444'
    },
    closeIconButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
    },
});
