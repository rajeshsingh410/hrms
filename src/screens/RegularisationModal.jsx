import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    TextInput,
    Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import { useSelector } from "react-redux";

const RegularisationModal = ({ visible, onClose, selectedDate, handleRegularisation, defaultTimes }) => {
    console.log("defaultTimes", defaultTimes);

    const { employee, } = useSelector(state => state.employee);

    const [applyDate, setApplyDate] = useState(new Date(selectedDate));
    const [inTime, setInTime] = useState(null);
    const [outTime, setOutTime] = useState(null);
    const [reason, setReason] = useState("");
    const [showPicker, setShowPicker] = useState({ type: "", visible: false });

    useEffect(() => {
        if (selectedDate) {
            setApplyDate(new Date(selectedDate));
        }
        if (defaultTimes) {
            if (defaultTimes.intime) {
                setInTime(moment(defaultTimes.intime, "HH:mm:ss").toDate());
            } else {
                setInTime(null); // agar intime nahi mila to reset
            }

            if (defaultTimes.outtime) {
                setOutTime(moment(defaultTimes.outtime, "HH:mm:ss").toDate());
            } else {
                setOutTime(null); // ✅ important: miss punch case me clear karo
            }
        } else {
            // agar defaultTimes hi nahi aya to dono reset karo
            setInTime(null);
            setOutTime(null);
        }
    }, [selectedDate, defaultTimes]);


    const formatTime = (time) =>
        time
            ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
            : "Select Time";

    const handleConfirm = (event, selected) => {
        setShowPicker({ type: "", visible: false });
        if (!selected) return;

        if (showPicker.type === "in") setInTime(selected);
        if (showPicker.type === "out") setOutTime(selected);
    };

    const onSubmit = () => {
        if (!inTime || !outTime) {
            alert("Please fill all fields before submitting!");
            return;
        }

        const now = new Date();

        const payload = {
            empid: employee.empid,
            Regdate: moment(applyDate).format("YYYY-MM-DD"),
            inTime: moment(inTime).format("HH:mm:ss"),
            outTime: moment(outTime).format("HH:mm:ss"),
            reason: reason.trim(),
            applyDate: moment(now).format("YYYY-MM-DD"),
            applyTime: moment(now).format("HH:mm:ss"),
        };

        handleRegularisation(payload);
        setInTime(null);
        setOutTime(null);
        setReason("");
        setApplyDate(new Date(selectedDate));
        onClose();
    };

    const handleClose = () => {
        setInTime(null);
        setOutTime(null);
        setReason("");
        setApplyDate(new Date(selectedDate)); 
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.headerWrapper}>
                        <Text style={styles.header}>Regularisation Request</Text>
                    </View>

                    {/* Fixed Apply Date */}
                    <View style={styles.bodyWrapper}>
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Reg Date :</Text>
                            <Text style={styles.value}>
                                {moment(applyDate).format("DD-MM-YYYY")}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#999" />
                        </View>

                        {/* In Time Field */}
                        <TouchableOpacity
                            style={styles.inputRow}
                            onPress={() => setShowPicker({ type: "in", visible: true })}
                        >
                            <Text style={styles.label}>Checkin :</Text>
                            <Text style={styles.value}>{formatTime(inTime)}</Text>
                            <Ionicons name="time-outline" size={20} color="#444" />
                        </TouchableOpacity>

                        {/* Out Time Field */}
                        <TouchableOpacity
                            style={styles.inputRow}
                            onPress={() => setShowPicker({ type: "out", visible: true })}
                        >
                            <Text style={styles.label}>Checkout :</Text>
                            <Text style={styles.value}>{formatTime(outTime)}</Text>
                            <Ionicons name="time-outline" size={20} color="#444" />
                        </TouchableOpacity>

                        {/* Reason Input */}
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Reason :</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter reason"
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>

                        {/* Buttons */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.requestBtn} onPress={onSubmit}>
                                <Text style={styles.btnText}>Request</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Time Picker */}
                    {showPicker.visible && (
                        <DateTimePicker
                            value={new Date()}
                            mode="time"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={handleConfirm}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 20,
    },
    container: {
        backgroundColor: "#fff",
        borderRadius: 12,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
    },
    headerWrapper: {
        backgroundColor: "#E53935",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: "hidden",
        paddingVertical: 5,
    },
    header: {
        fontSize: 18,
        fontWeight: "bold",
        paddingVertical: 10,
        paddingHorizontal: 8,
        color: "#fff",
        textAlign: "center",
    },
    bodyWrapper: {
        padding: 15,
        backgroundColor: "#fafafa",   // halka sa light grey
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 6,
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#eee",
    },
    label: { flex: 1, fontSize: 14, color: "#444", fontWeight: "600" },
    value: { flex: 2, fontSize: 14, color: "#000" },
    textInput: {
        flex: 2,
        fontSize: 14,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: "#fff",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        marginRight: 8,
        backgroundColor: "#bbb",
        borderRadius: 8,
        alignItems: "center",
    },
    requestBtn: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 8,
        backgroundColor: "#4CAF50",
        borderRadius: 8,
        alignItems: "center",
    },
    btnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

});

export default RegularisationModal;
