import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    FlatList,
    TextInput,
    SafeAreaView,
} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import Ionicons from "react-native-vector-icons/Ionicons";
import Modal from "react-native-modal";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "react-native-image-picker";
import notifee, { AndroidImportance } from "@notifee/react-native";
import SweetAlert from "react-native-sweet-alert";
import { useDispatch, useSelector } from "react-redux";
import {
    AssignTaskAsync,
    getInfoAsync,
    getTaskasync,
} from "../services/Actions/employeeAction";
import TaskCard from "./TaskModules/TaskCard";
import { useLoading } from "../navigation/LoadingContext";

const themeColor = "#E95535";
const initialLayout = { width: Dimensions.get("window").width };
const { width, height } = Dimensions.get("window");
const FILTER_OPTIONS = ["All", "Pending", "Hold", "In Progress", "Completed", "Reopened"];

const My_Task = ({ navigation }) => {
    const { employee } = useSelector((state) => state.employee);
    const dispatch = useDispatch();

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: "mytask", title: "My Task" },
        { key: "assignedtask", title: "Assigned Task" },
    ]);
    const { loading, setLoading } = useLoading();
    const [tasks, setTasks] = useState([]);
    const [newTaskCount, setNewTaskCount] = useState(0);
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskPriority, setTaskPriority] = useState("Medium");
    const [datePickerType, setDatePickerType] = useState(null);
    const [assignDate, setAssignDate] = useState(null);
    const [deadline, setDeadline] = useState(null);
    const [assignedEmployees, setAssignedEmployees] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [openPriority, setOpenPriority] = useState(false);
    const [openAssign, setOpenAssign] = useState(false);
    const [myTask, setMyTask] = useState([]);
    const [assignedTask, setAssignedTask] = useState([]);

    const [filterStatus, setFilterStatus] = useState("All");
    const [assignedTaskFilterStatus, setAssignedTaskFilterStatus] = useState("All");

    const prevAssignedCount = useRef(0); // 🔔 Track previous assigned count

    // ✅ Ask Notification Permission
    useEffect(() => {
        (async () => {
            await notifee.requestPermission();
        })();
    }, []);

    // ✅ Notify when a new task is assigned to ME (My_Task)
    useEffect(() => {
        if (!employee?.empid || !myTask) return;

        // 🔍 Filter tasks assigned to me
        const myAssignedTasks = myTask.filter(task =>
            task.assignedTo?.includes(employee.empid)
        );

        // Compare with previous count to detect new assignments
        if (myAssignedTasks.length > prevAssignedCount.current) {
            const newTasks = myAssignedTasks.slice(prevAssignedCount.current);
            newTasks.forEach(task => showTaskNotification(task));
        }

        // Update previous count
        prevAssignedCount.current = myAssignedTasks.length;
    }, [myTask, employee?.empid]);

    // 🔔 Show notification when I get a new task
    async function showTaskNotification(task) {
        const channelId = await notifee.createChannel({
            id: "my-task-channel",
            name: "My Task Notifications",
            importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
            title: "📋 New Task Assigned to You",
            body: `Task: ${task.title || "Untitled Task"} AssignedBy  ${task.assignByName}`,
            android: {
                channelId,
                smallIcon: "ic_launcher",
                pressAction: { id: "default" },
            },
        });
    }


    useEffect(() => {
        const pendingTasks = tasks.filter((t) => t.status === "Pending");
        setNewTaskCount(pendingTasks.length);
    }, [tasks]);

    useEffect(() => {
        if (showCreateModal) {
            setTaskTitle("");
            setTaskDescription("");
            setTaskPriority("Medium");
            setAssignDate(null);
            setDeadline(null);
            setAssignedEmployees([]);
            setAttachments([]);
        }
    }, [showCreateModal]);

    useEffect(() => {
        if (employee?.empid) {
            setLoading(true);
            dispatch(getInfoAsync(employee?.empid))
                .then((res) => {
                    const options = res.emp
                        .filter(empData => empData.empid !== employee.empid)
                        .map(empData => ({
                            label: empData.empname,
                            value: empData.empid,
                        }));
                    setEmployeeOptions(options);
                })
                .finally(() => setLoading(false));
        }
    }, [employee?.empid]);


    useEffect(() => {
        if (employee?.empid) {
            dispatch(getTaskasync(employee?.empid))
                .then((res) => {
                    setMyTask(res.data)
                    setAssignedTask(res.assign)
                })
        }
    }, [employee?.empid, dispatch])


    const handlePickImage = async () => {
        const opts = { mediaType: "photo", quality: 0.7 };
        ImagePicker.launchImageLibrary(opts, (resp) => {
            if (resp.didCancel || resp.errorCode) return;
            const asset = resp.assets && resp.assets[0];
            if (asset)
                setAttachments((prev) => [
                    ...prev,
                    { uri: asset.uri, name: asset.fileName },
                ]);
        });
    };

    const handleCreateTask = () => {
        if (!taskTitle.trim()) {
            SweetAlert.showAlertWithOptions({
                title: "Warning!",
                subTitle: "Please enter a task title before saving.",
                confirmButtonTitle: "OK",
                confirmButtonColor: "#E95535",
                style: "warning",
            });
            return;
        }

        setLoading(true); // start loading
        const taskData = {
            // ... your task data
        };
        const formData = new FormData();
        formData.append("action", "Create_Task");
        formData.append("payload", JSON.stringify(taskData));
        attachments.forEach((file, index) => {
            formData.append(`attachment_${index}`, {
                uri: file.uri,
                name: file.name,
                type: file.type || "image/jpeg",
            });
        });

        dispatch(AssignTaskAsync(formData))
            .then((res) => {
                SweetAlert.showAlertWithOptions({
                    title: "Success!",
                    subTitle: res.message || "New task created successfully!",
                    confirmButtonTitle: "OK",
                    confirmButtonColor: "#E95535",
                    style: "success",
                });
                return dispatch(getTaskasync(employee?.empid));
            })
            .then((res2) => {
                setMyTask(res2.data);
                setAssignedTask(res2.assign);
                setShowCreateModal(false);
            })
            .catch(() => {
                SweetAlert.showAlertWithOptions({
                    title: "Error!",
                    subTitle: "Failed to create the task. Please try again.",
                    confirmButtonTitle: "OK",
                    confirmButtonColor: "#E95535",
                    style: "error",
                });
            })
            .finally(() => setLoading(false)); // stop loading
    };

    const filteredTasks = myTask.filter((t) =>
        filterStatus === "All" ? true : t.current_status === filterStatus
    );

    const MyTaskScene = () => (
        <View style={styles.sceneInner}>
            <Text style={styles.filterLabel}>Showing: {filterStatus} Tasks</Text>
            <FlatList
                data={filteredTasks}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => <TaskCard item={item} type="myTask" />}
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 30, color: "#666" }}>
                        No task
                    </Text>
                }
            />
        </View>
    );

    const filteredAssignTasks = assignedTask.filter((t) =>
        assignedTaskFilterStatus === "All" ? true : t.status === assignedTaskFilterStatus
    );

    const AssignedTaskScene = () => (
        <View style={styles.sceneInner}>
            <Text style={styles.filterLabel}>
                Showing: {assignedTaskFilterStatus} Tasks
            </Text>
            <FlatList
                data={filteredAssignTasks}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => <TaskCard item={item} type="assignedTask" />}
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 30, color: "#666" }}>
                        No tasks Assigned
                    </Text>
                }
            />
        </View>
    );

    // const getAssignedTasks = () => {
    //     return tasks.filter(task =>
    //         task.assignedTo.includes(employee?.empid) &&
    //         (filterStatus === "All" ? true : task.status === filterStatus)
    //     );
    // };

    const renderScene = SceneMap({
        mytask: MyTaskScene,
        assignedtask: AssignedTaskScene,
    });

    // console.log("My Task ", myTask);
    return (
        <SafeAreaView style={styles.safe}>
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    marginBottom: 5,
                }}
            >
                <Text style={{ fontSize: 20, fontWeight: "700", color: themeColor }}>
                    Tasks
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                    <TouchableOpacity onPress={() => setShowFilterModal(true)}>
                        <Ionicons name="filter-outline" size={28} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() =>
                            alert("You have " + newTaskCount + " pending tasks!")
                        }
                    >
                        <Ionicons name="notifications-outline" size={28} color="#333" />
                        {newTaskCount > 0 && (
                            <View
                                style={{
                                    position: "absolute",
                                    right: -2,
                                    top: -2,
                                    backgroundColor: "red",
                                    borderRadius: 8,
                                    paddingHorizontal: 5,
                                    paddingVertical: 1,
                                    minWidth: 16,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text
                                    style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}
                                >
                                    {newTaskCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={initialLayout}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        indicatorStyle={{ backgroundColor: "#fff", height: 3 }}
                        style={{ backgroundColor: themeColor, marginTop: 5 }}
                        labelStyle={{ fontSize: 14, fontWeight: "700" }}
                        activeColor="#fff"
                        inactiveColor="#ddd"
                    />
                )}
            />

            {index === 1 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Filter Modal */}
            <Modal
                isVisible={showFilterModal}
                onBackdropPress={() => setShowFilterModal(false)}
            >
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Filter Tasks</Text>

                    {FILTER_OPTIONS.map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => {
                                if (index === 0) {
                                    // My Task tab
                                    setFilterStatus(f);
                                } else {
                                    // Assigned Task tab
                                    setAssignedTaskFilterStatus(f);
                                }
                                setShowFilterModal(false);
                            }}
                            style={[
                                styles.filterOption,
                                (index === 0 ? filterStatus : assignedTaskFilterStatus) === f && {
                                    backgroundColor: themeColor,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    { fontSize: 16 },
                                    (index === 0 ? filterStatus : assignedTaskFilterStatus) === f && {
                                        color: "#fff",
                                    },
                                ]}
                            >
                                {f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            {/* Create Task Modal */}
            <Modal
                isVisible={showCreateModal}
                onBackdropPress={() => setShowCreateModal(false)}
            >
                <View style={styles.modalBox}>
                    {/* Close Button */}
                    <TouchableOpacity
                        onPress={() => setShowCreateModal(false)}
                        style={{ position: "absolute", top: 10, right: 10, zIndex: 9999, padding: 5 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close-circle" size={30} color="#E95535" />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>Create Task</Text>

                    {/* Dates */}
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                        {/* Assign Date */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>Assign Date</Text>
                            <TouchableOpacity
                                style={styles.datePickerBox}
                                onPress={() => { setDatePickerType("assign"); setDatePickerVisibility(true); }}
                            >
                                <Text style={{ flex: 1 }}>
                                    {assignDate ? assignDate.toDateString() : " Assign Date"}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {/* Deadline */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>Deadline</Text>
                            <TouchableOpacity
                                style={styles.datePickerBox}
                                onPress={() => { setDatePickerType("deadline"); setDatePickerVisibility(true); }}
                            >
                                <Text style={{ flex: 1 }}>
                                    {deadline ? deadline.toDateString() : "Select Deadline"}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.fieldLabel}>Title</Text>
                    <TextInput
                        placeholder="Enter title"
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                        style={styles.input}
                    />

                    {/* Description */}
                    <Text style={styles.fieldLabel}>Description</Text>
                    <TextInput
                        placeholder="Enter description"
                        value={taskDescription}
                        onChangeText={setTaskDescription}
                        style={styles.input}
                        multiline
                    />

                    {/* Priority & Assign To */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        {/* Priority */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>Priority</Text>
                            <DropDownPicker
                                open={openPriority}
                                value={taskPriority}
                                items={[
                                    { label: "High", value: "High" },
                                    { label: "Medium", value: "Medium" },
                                    { label: "Low", value: "Low" },
                                ]}
                                setOpen={setOpenPriority}
                                setValue={setTaskPriority}
                                containerStyle={{ marginBottom: 10, zIndex: 1000 }}
                            />
                        </View>

                        {/* Assign To Employees */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>Assign To</Text>
                            <DropDownPicker
                                open={openAssign}
                                value={assignedEmployees} // must stay as array
                                items={employeeOptions}
                                multiple={true}
                                mode="BADGE"
                                setOpen={setOpenAssign}
                                setValue={setAssignedEmployees}
                                placeholder={
                                    assignedEmployees.length > 0
                                        ? `${assignedEmployees.length} Selected`
                                        : "Select Employees"
                                }
                                searchable={true}
                            />

                        </View>
                    </View>

                    {/* Attachments */}
                    <View style={{ marginBottom: 12 }}>
                        <TouchableOpacity
                            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                            onPress={handlePickImage}
                        >
                            <Ionicons name="attach" size={22} color={themeColor} />
                            <Text style={{ color: "#333", fontWeight: "600" }}>
                                Attach a file (optional)
                            </Text>
                        </TouchableOpacity>
                        {attachments.length > 0 && (
                            <Text style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                                {attachments.length} file(s) attached
                            </Text>
                        )}
                    </View>

                    {/* Create Button */}
                    <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
                        <TouchableOpacity style={styles.btnPrimary} onPress={handleCreateTask}>
                            <Text style={styles.btnPrimaryText}>Create</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Date Picker Modal */}
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={(date) => {
                            if (datePickerType === "assign") setAssignDate(date);
                            else if (datePickerType === "deadline") setDeadline(date);
                            setDatePickerVisibility(false);
                        }}
                        onCancel={() => setDatePickerVisibility(false)}
                    />
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f9f9f9" },
    sceneInner: { flex: 1, paddingHorizontal: 10, paddingTop: 5 },
    filterLabel: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 10 },
    filterOption: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderColor: "#ddd" },
    datePickerBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, backgroundColor: "#fff" },
    card: { backgroundColor: "#fff", padding: 12, borderRadius: 10, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    cardTitle: { fontSize: 16, fontWeight: "700" },
    cardSmall: { fontSize: 14, color: "#666", marginBottom: 6 },
    metaRow: { flexDirection: "row", justifyContent: "space-between" },
    metaText: { fontSize: 13, color: "#333" },
    badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
    fab: { position: "absolute", bottom: height * 0.08, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: themeColor, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
    modalBox: { backgroundColor: "#fff", borderRadius: 12, padding: 15, maxHeight: height * 0.85 },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15 },
    fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, backgroundColor: "#fff" },
    btnPrimary: { backgroundColor: themeColor, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    btnPrimaryText: { color: "#fff", fontWeight: "700" },
});


export default My_Task;
