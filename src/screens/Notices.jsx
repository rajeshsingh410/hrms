import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking } from "react-native";
import React, { useEffect, useState } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { getNoticeData } from "../services/Actions/employeeAction";
import SweetAlert from 'react-native-sweet-alert';
import { useLoading } from "../navigation/LoadingContext";
import moment from "moment";

const NOTICE_FILE = "https://chaaruvi.com/hrms/storage/app/public/notices"

const Notices = () => {
    const { employee } = useSelector((state) => state.employee);
    const dispatch = useDispatch();
    const { loading, setLoading } = useLoading();

    const [noticesData, setNoticesData] = useState([])

    useEffect(() => {
        if (employee.empid) {
            setLoading(true)
            dispatch(getNoticeData(employee.empid))
                .then((res) => {
                    setLoading(false)
                    if (res && res.data && res.data.length > 0) {
                        setNoticesData(res.data);
                    } else {
                        setNoticesData([]);
                        // SweetAlert.showAlertWithOptions({
                        //     title: 'No Notices',
                        //     subTitle: 'No notice for you!',
                        //     confirmButtonTitle: 'OK',
                        //     style: 'info',
                        // });
                    }
                })
                .catch((error) => {
                    setLoading(false)
                    console.log("error ", error);
                    setNoticesData([]);
                })
        }
    }, [employee.empid]);

    const openFile = (fileName) => {
        if (!fileName) {
            SweetAlert.showAlertWithOptions({
                title: 'File not available',
                confirmButtonTitle: 'OK',
                style: 'warning',
            });
            return;
        }
        const fileUrl = `${NOTICE_FILE}/${fileName}`;
        Linking.openURL(fileUrl)
            .catch(err => {
                SweetAlert.showAlertWithOptions({
                    title: 'Failed to open file',
                    subTitle: err.message,
                    confirmButtonTitle: 'OK',
                    style: 'error',
                });
            });
    };

    return (
        <ScrollView style={styles.container}>
            {noticesData.length > 0 ? (
                noticesData.map((item) => (
                    <View key={item.notid} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Notice</Text>
                            <TouchableOpacity onPress={() => openFile(item.file)}>
                                <Ionicons name="download" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                            <View style={styles.cardRow}>
                                <Text style={styles.label}>Notice Type:</Text>
                                <Text style={styles.value}>{item.type}</Text>
                            </View>

                            <View style={styles.cardRow}>
                                <Text style={styles.label}>From:</Text>
                                <Text style={styles.value}>{moment(item.fromdate).format("DD-MM-YYYY")}</Text>
                            </View>

                            <View style={styles.cardRow}>
                                <Text style={styles.label}>To:</Text>
                                <Text style={styles.value}>{moment(item.todate).format("DD-MM-YYYY")}</Text>
                            </View>

                            <View style={styles.cardRow}>
                                <Text style={styles.label}>Reason:</Text>
                                <Text style={styles.value}>{item.reason}</Text>
                            </View>
                        </View>
                    </View>
                ))
            ) : (
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                    <Text style={{ fontSize: 16, color: '#555' }}>No notices available for you.</Text>
                </View>
            )}
        </ScrollView>
    );
};

export default Notices;

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: "#f2f2f2",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        borderBottomWidth: 1,
        backgroundColor: "#E95535",
        borderBottomColor: "#eee",
        padding: 10,
        borderStartStartRadius: 10,
        borderEndStartRadius: 10

    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    cardRow: {
        flexDirection: "row",
        marginBottom: 6,
    },
    label: {
        fontWeight: "bold",
        color: "#555",
        width: 120,
    },
    value: {
        color: "#333",
        flexShrink: 1,
    },
});
