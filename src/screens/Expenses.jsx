import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DropDownPicker from "react-native-dropdown-picker";
import moment from "moment";
import { pick } from "@react-native-documents/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import SweetAlert from 'react-native-sweet-alert';
import { addExpanseAction, ApplyFainalExpance, deleteExpanceAction, getExpansesData, getExpansesHeader } from "../services/Actions/employeeAction";
import { useLoading } from "../navigation/LoadingContext";
import { set } from "date-fns";
import ImagePicker from "react-native-image-crop-picker";

const { width } = Dimensions.get("window");

const EXPENCE_DOC_URL = "https://chaaruvi.com/hrms/storage/app/public/expenses";

const Expenses = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { employee } = useSelector((state) => state.employee);
  const { loading, setLoading } = useLoading();

  // ---------------- STATES ----------------
  const [items, setItems] = useState([]); // all expenses
  const [selectedDate, setSelectedDate] = useState(""); // date
  const [amount, setAmount] = useState(""); // amount
  const [expenseHeader, setExpenseHeader] = useState(null); // dropdown
  const [remark, setRemark] = useState(""); // remark
  const [files, setFiles] = useState([]); // files
  const [editingId, setEditingId] = useState(null); // editing expense id

  // Dropdown
  const [open, setOpen] = useState(false);
  const [itemsHeader, setItemsHeader] = useState([]);

  // Date Picker
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date) => {
    setSelectedDate(moment(date).format("DD/MM/YYYY"));
    hideDatePicker();
  };

  // File Picker
  // const pickFiles = async () => {
  //   try {
  //     const results = await pick({
  //       type: ["*/*"],
  //       // allowMultiSelection: true,
  //     });

  //     console.log("Selected files:", results);
  //     setFiles(results);
  //   } catch (err) {
  //     console.log("File picking error:", err);
  //   }
  // };

  const pickFiles = async () => {
    try {
      const results = await pick({
        type: ["*/*"], // sabhi extension allow
      });

      let file = results[0]; // sirf single file
      let finalFile = file;

      // ✅ Agar image hai toh cropper open karo + compress karo
      if (
        file.type &&
        (file.type.includes("image/jpeg") || file.type.includes("image/png"))
      ) {
        try {
          const cropped = await ImagePicker.openCropper({
            path: file.uri,        // image ka path
            width: 800,            // resize width
            height: 600,           // resize height
            cropping: true,        // user ko crop karne do
            compressImageQuality: 0.7, // quality reduce 70%
          });

          finalFile = {
            uri: cropped.path,
            type: cropped.mime,
            name: file.name || `image_${Date.now()}.jpg`,
          };
        } catch (err) {
          console.log("Image cropper error:", err);
        }
      }

      console.log("Selected file (after crop/compress if image):", finalFile);
      setFiles([finalFile]); // ✅ single file hi rakha
    } catch (err) {
      console.log("File picking error:", err);
    }
  };

  useEffect(() => {
    dispatch(getExpansesHeader())
      .then((res) => {
        if (res.success === true || res.success === "true") {
          const formattedItems = res.expense_heads.map((item) => ({
            label: item.headname,
            value: item.exphdid,
          }));

          setItemsHeader(formattedItems);
        }
      })
    //already add expenses data
    dispatch(getExpansesData(employee?.empid))
      .then((res) => {
        if (res?.success === true || res?.success === "true") {
          setItems(res?.data);
        }
      })
      .catch((err) => {
        console.log("Get Expenses Error", err);
      })

  }, [dispatch])

  // Add or Update Expense
  const handelAddExpense = () => {
    const formetedDte = moment(selectedDate, "DD/MM/YYYY").format("YYYY-MM-DD");

    const formData = new FormData();
    formData.append("empid", employee.empid);
    formData.append("date", formetedDte);
    formData.append("amount", amount);
    formData.append("header", expenseHeader);
    formData.append("remark", remark);

    if (editingId) {
      formData.append("action", "Update_Expense_report");
      formData.append("expid", editingId);
    } else {
      formData.append("action", "Add_Expenses_report");
    }

    // ✅ File append karo (Add + Update dono ke liye)
    if (files.length > 0 && files[0].uri) {
      const file = files[0];
      formData.append("file", {
        uri: file.uri,
        type: file.type || "application/octet-stream",
        name: file.name || `file_${Date.now()}`,
      });
    }

    // ✅ Dispatch API
    setLoading(true);
    dispatch(addExpanseAction(formData))
      .then((res) => {
        console.log("response from add/update expense:", res);
        
        if (res.success === true || res.success === "true") {
          dispatch(getExpansesData(employee?.empid))
            .then((res) => {
              console.log("response from get expenses after add/update:", res);
              
              if (res.success === true || res.success === "true") {
                setLoading(false);
                setSelectedDate("");
                setAmount("");
                setExpenseHeader(null);
                setRemark("");
                setFiles([]);
                setItems(res.data);
                setEditingId(null);
              }
            });
        } else {
          setLoading(false);
        }
      });
  };

  // Final Submit
  const handleApplyExpense = () => {

    const formData = new FormData();
    formData.append('action', "ApplyFainalExpance");
    formData.append('empid', employee.empid);

    setLoading(true);
    dispatch(ApplyFainalExpance(formData))
      .then((res) => {
        if (res.success === true || res.success === "true") {
          setLoading(false);
          setItems([]);
          SweetAlert.showAlertWithOptions({
            title: 'Success',
            subTitle: res.message,
            confirmButtonTitle: 'OK',
            style: 'success', // success | error | warning
            cancellable: true
          });
        } else {
          SweetAlert.showAlertWithOptions({
            title: 'Failed',
            subTitle: res.message,
            confirmButtonTitle: 'OK',
            style: 'error',
          });
        }
      })
      .catch((err) => {
        SweetAlert.showAlertWithOptions({
          title: 'Error',
          subTitle: 'Unable to apply expenses. Please try again later.',
          confirmButtonTitle: 'OK',
          style: 'error',
        });
        console.log("Apply Expense Error:", err);
      });
  };

  //edit expense 
  const handleEditExpense = (item) => {
    setSelectedDate(moment(item.expdate).format("DD/MM/YYYY"));
    setEditingId(item.expid);
    setAmount(item.amount);
    setExpenseHeader(item.exphdid);
    setRemark(item.resion);

    if (item.file) {
      // Purana file ko file:// prefix ke sath set karo
      setFiles([
        {
          isOld: true,
          uri: `${EXPENCE_DOC_URL}/${item.file}`,  // ✅ prefix added
          name: item.file,
          type: "application/octet-stream", // safe default
        },
      ]);
    } else {
      setFiles([]);
    }
  };

  // delete expense
  const handleDeleteExpance = (expid) => {
    Alert.alert(
      "Are you sure?",
      "This action will delete the expense permanently.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, delete it!",
          style: "destructive",
          onPress: () => {
            setLoading(true);

            let formData = new FormData();
            formData.append("action", "Delete_Expense_report");
            formData.append("expid", expid);

            dispatch(deleteExpanceAction(formData))
              .then((res) => {
                if (res.success === true || res.success === "true") {
                  SweetAlert.showAlertWithOptions({
                    title: "Deleted",
                    subTitle: res.message,
                    confirmButtonTitle: "OK",
                    style: "success",
                  });

                  // ✅ Remove item from current state instantly
                  setItems((prevItems) =>
                    prevItems.filter((item) => item.expid !== expid)
                  );

                  // Optionally, refresh from backend too
                  dispatch(getExpansesData(employee?.empid)).then((res) => {
                    if (res.success === true || res.success === "true") {
                      setItems(res.data);
                    }
                    setLoading(false);
                  });
                } else {
                  SweetAlert.showAlertWithOptions({
                    title: "Error",
                    subTitle: res.message || "Failed to delete expense.",
                    confirmButtonTitle: "OK",
                    style: "error",
                  });
                  setLoading(false);
                }
              })
              .catch(() => {
                SweetAlert.showAlertWithOptions({
                  title: "Error",
                  subTitle: "Something went wrong.",
                  confirmButtonTitle: "OK",
                  style: "error",
                });
                setLoading(false);
              });
          },
        },
      ],
      { cancelable: true }
    );
  };


  return (
    <ScrollView style={styles.container} >
      <View style={styles.card}>
        <Text style={styles.subHeading}>{editingId ? "Update Expense" : "Add Expense"}</Text>

        {/* Date & Amount */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* Date */}
          <View style={[styles.inputWrapper, { flex: 1, marginRight: 5 }]}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.inputBox} onPress={showDatePicker}>
              <Text>{selectedDate || "Select Date "}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
            />
          </View>

          {/* Amount */}
          <View style={[styles.inputWrapper, { flex: 1, marginLeft: 5 }]}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Enter Amount"
              placeholderTextColor={"#666"}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* Expense Header */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Expense Header</Text>
          <DropDownPicker
            open={open}
            value={expenseHeader}
            items={itemsHeader}
            setOpen={setOpen}
            setValue={setExpenseHeader}
            setItems={setItemsHeader}
            placeholder="Select Expense Header"
            style={styles.inputBox}
          />
        </View>

        {/* Remark */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Remark</Text>
          <TextInput
            style={[styles.inputBox, { height: 70 }]}
            placeholder="Enter Remark"
            placeholderTextColor={"#666"}
            multiline
            value={remark}
            onChangeText={setRemark}
          />
        </View>

        {/* File Attachment */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>File Attachment</Text>
          <TouchableOpacity style={styles.fileUpload} onPress={pickFiles}>
            <MaterialCommunityIcons name="paperclip" size={20} color="#444" />
            <Text style={{ marginLeft: 8 }}>
              {files.length > 0
                ? `${files.length} file(s) attached`
                : "Attach Files"}
            </Text>
          </TouchableOpacity>

          {/* File list */}
          {files.length > 0 &&
            files.map((file, idx) => (
              <Text key={idx} style={{ fontSize: 12, marginTop: 4, color: '#333' }}>
                📄 {file.name}
              </Text>
            ))}
        </View>

        {/* Add Button */}
        <TouchableOpacity style={styles.addBtn} onPress={handelAddExpense}>
          <Text style={styles.addBtnText}>
            {editingId ? "Update Expense" : "+ Add Expense"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expenses Table */}
      <View style={[styles.card, { marginBottom: insets.bottom + 20 }]}>
        <Text style={styles.subHeading}>Expenses</Text>
        <ScrollView horizontal>
          {/* Header */}
          <View>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cell, styles.headerCell, { width: 40 }]}>#</Text>
              <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>Expense Header</Text>
              <Text style={[styles.cell, styles.headerCell, { width: 80 }]}>Amount</Text>
              <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>Remark</Text>
              <Text style={[styles.cell, styles.headerCell, { width: 100 }]}>File</Text>
              <Text style={[styles.cell, styles.headerCell, { width: 100 }]}>Action</Text>
            </View>

            {/* Rows */}
            {
              items.length === 0 && (
                <View style={{ padding: 20, alignItems: 'flex-start' }}>
                  <Text style={{ color: '#666' }}>No expenses added yet.</Text>
                </View>
              )
            }
            <FlatList
              data={items}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item?.expid.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.tableRow}>
                  <Text style={[styles.cell, { width: 40 }]}>{index + 1}</Text>
                  <Text style={[styles.cell, { width: 120 }]}>{item?.headname}</Text>
                  <Text style={[styles.cell, { width: 80 }]}>{item?.amount}</Text>
                  <Text style={[styles.cell, { width: 120 }]}>{item?.resion}</Text>
                  <Text style={[styles.cell, { width: 100 }]}>{item.file}</Text>
                  <View style={{ width: 100, flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      style={{
                        marginRight: 12,
                        backgroundColor: "#d2c919",
                        padding: 2,
                        borderRadius: 15,
                      }}
                      onPress={() => handleEditExpense(item)}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#E53935",
                        padding: 2,
                        borderRadius: 15,
                      }}
                      onPress={() => handleDeleteExpance(item.expid)} // delete functionality pending
                    >
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.submitBtn} onPress={handleApplyExpense}>
          <Text style={styles.submitBtnText}>Final Submit</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

export default Expenses;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#edecebff',
    padding: width * 0.04,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: 15,
    elevation: 3,
  },
  subHeading: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#E53935',
  },
  inputWrapper: { flex: 1, marginHorizontal: 5, marginBottom: 10 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },
  inputBox: {
    backgroundColor: '#f1f5ff',
    padding: width * 0.03,
    borderRadius: 8,
    color: '#000',
  },
  fileUpload: {
    backgroundColor: '#f1f5ff',
    padding: width * 0.035,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: '#E53935',
    padding: width * 0.035,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  tableWrapper: { maxHeight: 300 },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 10,
  },
  tableHeader: { backgroundColor: '#E53935', borderRadius: 8 },
  cell: { textAlign: 'left', fontSize: 14, paddingHorizontal: 4 },
  headerCell: { fontWeight: 'bold', color: '#fff' },
  submitBtn: {
    backgroundColor: '#2e7d32',
    padding: width * 0.035,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
});
