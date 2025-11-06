import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { getMyTaskHistory } from "../../services/Actions/employeeAction";

const themeColor = "#2e8bff";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TaskHistory = ({ route }) => {
  const { employee } = useSelector((state) => state.employee);
  const { task, type } = route.params;

  const dispatch = useDispatch();

  const [cardsMap, setCardsMap] = useState({}); // { empid or "all": [groups] }
  const [expandedMap, setExpandedMap] = useState({}); // { empid: bool }
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState("");

  const handleShowFullText = (text) => {
    setModalText(text);
    setModalVisible(true);
  };

  // 🧩 Function to format data into step groups
  const groupTaskHistory = (data) => {
    let cardGroups = [];
    let currentGroup = [];

    data.forEach((item, index) => {
      let details = [];

      if (item.status === "Assigned") {
        details.push(`Task created and assigned.`);
        if (item.description) details.push(item.description);
      } else if (item.status === "In Progress") {
        details.push(item.remark || "Task is currently in progress.");
      } else if (item.status === "Completed") {
        details.push("Task has been completed successfully.");
      } else if (item.status === "Reopened") {
        details.push(item.remark || "Task reopened due to an issue.");
      } else if (item.status === "Hold") {
        details.push(item.remark || "Task has been put on Hold.");
      }

      const step = {
        title: item.status,
        date: moment(item.actionDate || item.assignDate).format("DD MMM YYYY"),
        details,
        active: true,
        deadline: item.deadline,
      };

      currentGroup.push(step);

      if (index === data.length - 1) {
        cardGroups.push([...currentGroup]);
      }
    });

    return cardGroups;
  };

  // 🟢 Default load for single employee / all task history
  useEffect(() => {
    if (task?.id) {
      const empid = employee?.empid || null;

      dispatch(getMyTaskHistory(task.id, empid)).then((res) => {
        console.log("📦 Task History Response:", res);

        if (res?.status && Array.isArray(res.data)) {
          const grouped = groupTaskHistory(res.data);

          // ✅ Fixed: Use setCardsMap instead of setCards
          setCardsMap((prev) => ({
            ...prev,
            all: grouped,
          }));
        } else {
          setCardsMap((prev) => ({
            ...prev,
            all: [],
          }));
        }
      });
    }
  }, [task, dispatch]);

  // 🟡 On Toggle Expand → fetch that employee’s history
  const toggleExpand = (empid) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Toggle expand/collapse
    setExpandedMap((prev) => ({
      ...prev,
      [empid]: !prev[empid],
    }));

    // If expanding, fetch that emp’s task history
    if (!expandedMap[empid]) {
      dispatch(getMyTaskHistory(task.id, empid)).then((res) => {
        if (res?.status && Array.isArray(res.data)) {
          const empCardGroups = groupTaskHistory(res.data);
          setCardsMap((prev) => ({
            ...prev,
            [empid]: empCardGroups,
          }));
        } else {
          setCardsMap((prev) => ({
            ...prev,
            [empid]: [],
          }));
        }
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* 🟢 For multiple assigned employees */}
        {task?.assignedStatus?.length > 1 && type === "assignedTask" ? (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
              <Text style={styles.cardTitle}>Assigned Employees</Text>
              <Text style={styles.cardTitle}>{task.title}</Text>
            </View>
            {task.assignedStatus.map((emp, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <View style={styles.empRow}>
                  <Text style={[styles.empInitial, statusBadgeStyle(emp.status)]} >
                    {emp.status.charAt(0).toUpperCase()}
                  </Text>
                  <Text style={styles.empName}>{emp.empname}</Text>

                  <TouchableOpacity onPress={() => toggleExpand(emp.empid)}>
                    <Icon
                      name={expandedMap[emp.empid] ? "chevron-down" : "chevron-forward"}
                      size={20}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>

                {/* Timeline for this employee */}
                {expandedMap[emp.empid] && (
                  <View style={{ marginTop: 10 }}>
                    {cardsMap[emp.empid]?.length > 0 ? (
                      cardsMap[emp.empid].map((steps, cardIndex) => (
                        <View key={cardIndex} style={styles.timelineCard}>
                          <Text style={styles.timelineTitle}>
                            Task Timeline
                            {/* {cardIndex > 0 ? `(#${cardIndex + 1})` : ""} */}
                          </Text>

                          {steps.map((step, index) => (
                            <View key={index} style={styles.stepContainer}>
                              <View style={styles.iconContainer}>
                                <View
                                  style={[
                                    styles.circle,
                                    step.active
                                      ? styles.circleActive
                                      : styles.circleInactive,
                                  ]}
                                >
                                  {step.active && (
                                    <Icon name="checkmark" size={14} color="#fff" />
                                  )}
                                </View>
                                {index !== steps.length - 1 && (
                                  <View style={styles.verticalLine}></View>
                                )}
                              </View>

                              <View style={styles.textContainer}>
                                <Text
                                  style={[styles.title, step.active && styles.activeTitle]}
                                >
                                  {step.title}{" "}
                                  <Text style={styles.date}>{step.date}</Text>
                                </Text>

                                {step.details.map((line, i) =>
                                  line.length > 50 ? (
                                    <TouchableOpacity
                                      key={i}
                                      onPress={() => handleShowFullText(line)}
                                    >
                                      <Text style={styles.detailText}>
                                        {line.substring(0, 50)}...
                                        <Text style={styles.readMore}> Read more</Text>
                                      </Text>
                                    </TouchableOpacity>
                                  ) : (
                                    <Text key={i} style={styles.detailText}>
                                      {line}
                                    </Text>
                                  )
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      ))
                    ) : (
                      <Text style={{ textAlign: "center", color: "#777", marginTop: 8 }}>
                        No task Sheet Update Here .
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          // 🔹 Single employee / default timeline
          <>
            {cardsMap["all"]?.length > 0 ? (
              cardsMap["all"].map((steps, cardIndex) => (
                <View key={cardIndex} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                    <Text style={styles.timelineTitle}>
                      Task Timeline
                      {/* {cardIndex > 0 ? `(#${cardIndex + 1})` : ""} */}
                    </Text>
                    <Text style={styles.cardTitle}>{task.title}</Text>
                  </View>

                  {steps.map((step, index) => (
                    <View key={index} style={styles.stepContainer}>
                      <View style={styles.iconContainer}>
                        <View
                          style={[
                            styles.circle,
                            step.active ? styles.circleActive : styles.circleInactive,
                          ]}
                        >
                          {step.active && <Icon name="checkmark" size={14} color="#fff" />}
                        </View>
                        {index !== steps.length - 1 && (
                          <View style={styles.verticalLine}></View>
                        )}
                      </View>

                      <View style={styles.textContainer}>
                        <Text style={[styles.title, step.active && styles.activeTitle]}>
                          {step.title}{" "}
                          <Text style={styles.date}>{step.date}</Text>
                        </Text>

                        {step.details.map((line, i) =>
                          line.length > 50 ? (
                            <TouchableOpacity
                              key={i}
                              onPress={() => handleShowFullText(line)}
                            >
                              <Text style={styles.detailText}>
                                {line.substring(0, 50)}...
                                <Text style={styles.readMore}> Read more</Text>
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <Text key={i} style={styles.detailText}>
                              {line}
                            </Text>
                          )
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <Text style={{ color: "#777", textAlign: "center", marginTop: 20 }}>
                No task history found.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal for full details */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Full Details</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={styles.modalText}>{modalText}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default TaskHistory;

// ========================== Styles ==========================
const statusBadgeStyle = (status) => {
  console.log("status", status);

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2", padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#333" },
  empRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9ff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  empInitial: {
    backgroundColor: themeColor,
    color: "#fff",
    borderRadius: 20,
    width: 25,
    height: 25,
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "bold",
  },
  empName: { flex: 1, marginLeft: 10, color: "#333", fontWeight: "600" },
  timelineCard: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
  timelineTitle: { fontWeight: "700", color: themeColor, marginBottom: 8 },
  stepContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  iconContainer: { alignItems: "center", width: 30 },
  circle: { width: 18, height: 18, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  circleActive: { backgroundColor: themeColor },
  circleInactive: { borderWidth: 1.5, borderColor: "#ccc", backgroundColor: "#fff" },
  verticalLine: { width: 2, flex: 1, backgroundColor: "#ccc", marginTop: 4 },
  textContainer: { flex: 1, paddingLeft: 10 },
  title: { fontSize: 16, fontWeight: "600", color: "#000" },
  activeTitle: { color: themeColor },
  date: { fontSize: 13, fontWeight: "400", color: "#777" },
  detailText: { color: "#555", fontSize: 13, marginTop: 2 },
  readMore: { color: "#E95535", textDecorationLine: "underline", fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "100%" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 10 },
  modalText: { fontSize: 14, color: "#444", lineHeight: 20 },
  closeBtn: { marginTop: 15, alignSelf: "center", backgroundColor: "#E95535", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6 },
  closeText: { color: "#fff", fontWeight: "600" },
});
