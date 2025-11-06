import { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Text } from "react-native-gesture-handler";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch, useSelector } from "react-redux";
import {
  getTaskasync,
  updateDailyTask,
} from "../../services/Actions/employeeAction";
import { useLoading } from "../../navigation/LoadingContext";

const themeColor = "#E95535";

const TaskCard = ({ item, type }) => {
  console.log("Item", item);

  const { employee } = useSelector((state) => state.employee);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading, setLoading } = useLoading();
  // === STATES ===
  const [expanded, setExpanded] = useState(false);
  // const [showIssueInput, setShowIssueInput] = useState(false);
  // const [issueText, setIssueText] = useState("");
  const [showDescModal, setShowDescModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusDate, setStatusDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [remark, setRemark] = useState("");

  // === HANDLERS ===
  // const handleSaveIssue = () => {
  //   if (!issueText.trim()) return;
  //   // You can add dispatch or API call to send comment here
  //   setIssueText("");
  //   setShowIssueInput(false);
  // };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setStatusDate(new Date());
    setRemark("");
    setShowStatusMenu(false);
    setShowStatusModal(true);
  };

  const handleSubmitStatus = (id) => {
    setLoading(true); // ✅ Start loading

    const formData = new FormData();
    formData.append("action", "update_daily_task");
    formData.append("id", id);
    formData.append("status", selectedStatus);
    formData.append("today", moment(statusDate).format("YYYY-MM-DD"));
    formData.append("remark", remark);
    formData.append("actionBy", employee.empid);

    dispatch(updateDailyTask(formData))
      .then(() => {
        return dispatch(getTaskasync(employee?.empid));
      })
      .then(() => {
        navigation.replace("My_Task");
      })
      .finally(() => {
        setLoading(false); // ✅ Stop loading
        setShowStatusModal(false); // Close modal
      });
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || statusDate;
    setShowDatePicker(Platform.OS === "ios");
    setStatusDate(currentDate);
  };

  const shortDescription =
    item.description && item.description.length > 70
      ? item.description.substring(0, 70) + "..."
      : item.description;

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: statusBadgeStyle(type === "myTask" ? item.current_status : item.status).backgroundColor },
      ]}
    >
      {/* HEADER */}
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          {/* Status Circle */}
          <View style={[styles.statusCircle, statusBadgeStyle(type === "myTask" ? item.current_status : item.status)]}>
            <Text style={styles.statusLetter}>
              {type === "myTask" ? item.current_status?.charAt(0) || "?" : item.status?.charAt(0)}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>
        </View>

        {/* Dropdown Arrow */}
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#555"
        />
      </TouchableOpacity>

      {/* EXPANDED SECTION */}
      {expanded && (
        <>
          {/* STATUS + ASSIGN INFO */}
          <View style={styles.rowBetween}>

            {/* Assigned Info */}
            {type === "myTask" ? (
              <Text style={styles.subTitle}>
                <Ionicons name="person-outline" size={12} />{" "}
                {item.assignByName || "—"}
              </Text>
            ) : item.assignedStatus?.length > 1 ? (
              <TouchableOpacity onPress={() => setShowEmployeeList(true)}>
                <Text style={[styles.subTitle, { color: "#007bff" }]}>
                  Assigned to {item.assignedStatus.length} Employees
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.subTitle}>

                <Ionicons name="person-outline" size={12} />{" "}
                {item.assignedStatus?.[0].empname || "—"} to {item.assignedStatus?.[0].status || "—"}
              </Text>
            )}

            {/* Status Tag */}
            {
              type === "myTask" && (
                <TouchableOpacity
                  style={[styles.statusTag, statusBadgeStyle(item.current_status)]}
                  onPress={() => setShowStatusMenu(!showStatusMenu)}
                >
                  <Text style={styles.statusText}>{item.current_status}</Text>
                  <Ionicons name="chevron-down" size={14} color="#fff" />
                </TouchableOpacity>
              )
            }
          </View>

          {/* STATUS MENU */}
          {showStatusMenu && (
            <View style={styles.floatingStatusMenu}>
              <ScrollView
                style={{ maxHeight: 100 }}  // max height for scroll
                contentContainerStyle={{ paddingVertical: 5 }}
                nestedScrollEnabled={true}   // optional, for nested scrolling
              >
                {["Pending", "In Progress", "Completed", "Hold", "Reopened"].map(
                  (status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => handleStatusChange(status)}
                      style={styles.statusOption}
                    >
                      <Text style={{ color: "#333" }}>{status}</Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </View>
          )}

          {/* EMPLOYEE LIST MODAL */}
          <Modal visible={showEmployeeList} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Assigned Employees</Text>
                  <TouchableOpacity onPress={() => setShowEmployeeList(false)}>
                    <Ionicons name="close-circle" size={22} color="#E95535" />
                  </TouchableOpacity>
                </View>

                {/* List */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  {Array.isArray(item.assignedStatus) && item.assignedStatus.length > 0 ? (
                    item.assignedStatus.map((emp, idx) => (
                      <View key={idx} style={styles.employeeRow}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="person-circle-outline" size={18} color="#4CAF50" />
                          <Text style={styles.empName}>{emp.empname}</Text>
                        </View>

                        <View style={[styles.statusBadge, statusBadgeStyle(emp.status)]}>
                          <Text style={styles.statusText}>{emp.status}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No employees assigned</Text>
                  )}
                </ScrollView>

                {/* Close Button */}
                {/* <TouchableOpacity onPress={() => setShowEmployeeList(false)} style={styles.closeBtn}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Close</Text>
                </TouchableOpacity> */}
              </View>
            </View>
          </Modal>

          {/* DESCRIPTION */}
          <TouchableOpacity
            style={styles.descContainer}
            onPress={() =>
              item.description?.length > 70 && setShowDescModal(true)
            }
          >
            <View style={styles.descHeader}>
              <Ionicons name="document-text-outline" size={18} color="#555" />
              <Text style={styles.descLabel}>Task Description</Text>
            </View>
            <Text style={styles.description}>{shortDescription}</Text>
            {item.description?.length > 70 && (
              <Text style={styles.tapHint}>Tap here to read more...</Text>
            )}
          </TouchableOpacity>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.dateInfo}>
              <Text style={styles.footerText}>
                <Ionicons name="calendar-outline" size={12} /> Assigned:{" "}
                {moment(item.assignDate).format("DD MMM YYYY")}
              </Text>
              <Text style={styles.footerText}>
                <Ionicons name="time-outline" size={12} /> Deadline:{" "}
                {moment(item.deadline).format("DD MMM YYYY")}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("TaskDocuments", { task: item })
                }
                style={styles.actionIcon}
              >
                <Ionicons
                  name="folder-open-outline"
                  size={20}
                  color={themeColor}
                />
                <Text style={styles.iconLabel}>Docs</Text>
              </TouchableOpacity>

              {/* <TouchableOpacity
                onPress={() => setShowIssueInput(!showIssueInput)}
                style={styles.actionIcon}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={themeColor}
                />
                <Text style={styles.iconLabel}>Message</Text>
              </TouchableOpacity> */}

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("TaskHistory", { task: item, type })
                }
                style={styles.actionIcon}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={themeColor}
                />
                <Text style={styles.iconLabel}>Info</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* COMMENT BOX */}
          {/* {showIssueInput && (
            <View style={styles.issueBox}>
              <TextInput
                value={issueText}
                onChangeText={setIssueText}
                placeholder="Write a comment..."
                style={styles.issueInput}
                multiline
              />
              <TouchableOpacity onPress={handleSaveIssue} style={styles.saveBtn}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>Send</Text>
              </TouchableOpacity>
            </View>
          )} */}
        </>
      )}

      {/* === DESCRIPTION MODAL === */}
      <Modal
        visible={showDescModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDescModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Task Description</Text>
              <TouchableOpacity onPress={() => setShowDescModal(false)}>
                <Ionicons name="close-circle" size={26} color="#555" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDesc}>{item.description}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* === STATUS UPDATE MODAL === */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close-circle" size={26} color="#555" />
              </TouchableOpacity>
            </View>

            {/* SCROLLABLE CONTENT */}
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Picker */}
              <Text style={styles.inputLabel}>Select Date</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#555" />
                <Text style={styles.datePickerText}>
                  {moment(statusDate).format("DD MMM YYYY")}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={statusDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}

              {/* Task Name */}
              <Text style={styles.inputLabel}>Task Name</Text>
              <TextInput
                value={item.title}
                editable={false}
                style={[styles.input, { backgroundColor: "#f0f0f0" }]}
              />

              {/* Remark */}
              <Text style={styles.inputLabel}>Remark</Text>
              <TextInput
                value={remark}
                onChangeText={setRemark}
                placeholder="Write a remark..."
                style={styles.input}
                multiline
              />

              {/* Submit */}
              <TouchableOpacity
                onPress={() => handleSubmitStatus(item.id)}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default TaskCard;

/* === STATUS BADGE COLOR === */
const statusBadgeStyle = (status) => {
  switch (status) {
    case "Pending":
      return { backgroundColor: "#FFA500" }; // Orange
    case "In Progress":
      return { backgroundColor: "#1E90FF" }; // Dodger Blue
    case "Completed":
      return { backgroundColor: "#32CD32" }; // Lime Green
    case "Reopened":
      return { backgroundColor: "#FF4500" }; // Orange Red
    case "Hold":
      return { backgroundColor: "#A9A9A9" }; // Dark Gray
    default:
      return { backgroundColor: "#4682B4" }; // Steel Blue
  }
};


/* === STYLES === */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 14,
    padding: 12,
    elevation: 3,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  statusLetter: { color: "#fff", fontWeight: "700", fontSize: 13 },
  title: { fontSize: 15, fontWeight: "700", color: "#222", flexShrink: 1 },
  subTitle: { fontSize: 12, color: "#777", marginTop: 8 },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-end",
    marginTop: 6,
    gap: 4,
  },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  floatingStatusMenu: {
    position: "absolute",
    top: 80,
    right: 10,
    zIndex: 999,
    elevation: 10,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 0.6,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statusOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  descContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  descHeader: { flexDirection: "row", alignItems: "center", marginBottom: 3, gap: 6 },
  descLabel: { fontSize: 13, fontWeight: "600", color: "#444" },
  description: { fontSize: 13, color: "#555", lineHeight: 18 },
  tapHint: { fontSize: 11, color: themeColor, marginTop: 3, fontStyle: "italic" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "#eee",
    paddingTop: 8,
  },
  footerText: { fontSize: 12, color: "#555" },
  dateInfo: { gap: 2 },
  actions: { flexDirection: "row", gap: 10 },
  actionIcon: { alignItems: "center" },
  iconLabel: { fontSize: 10, color: "#555", marginTop: 2 },
  issueBox: {
    marginTop: 6,
    borderTopWidth: 0.5,
    borderColor: "#ddd",
    padding: 6,
    flexDirection: "row",
    alignItems: "center", // Align button and input vertically
    gap: 6, // Space between input and button
  },

  issueInput: {
    flex: 1, // Take all available space
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: "#fff",
  },

  saveBtn: {
    backgroundColor: themeColor,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  modalBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  modalContent: {
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginTop: 10,
    marginBottom: 4,
  },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  datePickerText: { marginLeft: 6, fontSize: 14, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
    minHeight: 40,
  },
  submitBtn: {
    backgroundColor: themeColor,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  employeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  empName: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  noDataText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 12,
  },
  closeBtn: {
    marginTop: 14,
    backgroundColor: "#E95535",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
});
