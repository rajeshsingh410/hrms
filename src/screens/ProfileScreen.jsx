import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
// import * as ImagePicker from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { getMyAbout, profileImageUpload, updateEmployeeSection } from '../services/Actions/employeeAction';
import moment from 'moment';
import { useRoute } from '@react-navigation/native'
import ImageResizer from 'react-native-image-resizer';
import { useLoading } from '../navigation/LoadingContext';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ImageCropPicker from "react-native-image-crop-picker";

const { height, width } = Dimensions.get("window");

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const dispatch = useDispatch();
  const { employee } = useSelector(state => state.employee);
  const route = useRoute();
  const IMG_URL = 'https://chaaruvi.com/hrms/Mobileapp/profile_img/'

  const [modalVisible, setModalVisible] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [rotation, setRotation] = useState('0deg');
  const { loading, setLoading } = useLoading();
  const [imageUploading, setImageUploading] = useState(false);
  const [zoomImageUri, setZoomImageUri] = useState(null);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'summary', title: 'Summary' },
    // { key: 'timeline', title: 'Timeline' },
    { key: 'personal', title: 'Personal' },
    { key: 'job', title: 'Job' },
    // { key: 'document', title: 'Document' },
  ]);

  const [profileState, setProfileState] = useState({
    profileInfo: { name: '', email: '', empcode: '', profileImage: '' },
    summary: { praises: [], about: '', designation: '' },
    personal: { primaryDetails: {}, contactDetails: {}, addresses: {} },
    job: { details: {} },
    document: { details: {} },
  });

  // Function to fetch and set profile state
  const fetchAndSetProfile = async () => {
    if (!employee?.empid) return;

    setLoading(true); // ✅ loader start
    try {
      const res = await dispatch(getMyAbout(employee.empid));
      console.log("my about data", res)
      if (res?.data) {
        const data = res.data;
        setProfileState({
          profileInfo: {
            name: data.empname || '',
            email: data.email || '',
            empcode: data.empcode || '',
            profileImage: data?.profile_img_url
              ? data.profile_img_url
              : 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?crop=faces&fit=crop&w=300&h=300',
          },
          summary: {
            praises: [],
            about: data.about_me || 'About not updated yet.',
            designation: data.desg_name || 'Not Updated',
          },
          personal: {
            primaryDetails: {
              'Full NAME': data.empname || '',
              'GENDER': data.gender || '',
              'DATE OF BIRTH': moment(data.dob).format('DD-MM-YYYY') || '',
              'MARITAL STATUS': data.mr_status || '',
              'BLOOD GROUP': data.bldgrp || '-Not set-',
              'NATIONALITY': 'IN',
            },
            contactDetails: {
              'WORK EMAIL': data.oemail || '-Not set-',
              'PERSONAL EMAIL': data.email || '-Not set-',
              'MOBILE NUMBER': data.mobile || '',
              'WORK NUMBER': data.altno || '-Not set-',
              'RESIDENCE NUMBER': data.altno || '-Not set-',
            },
            addresses: {
              'CURRENT ADDRESS': `${data.address ? data.address + ',\n' : ''}${data.cityname ? data.cityname + ',\n' : ''}${data.statename || ''}` || '-Not set-',
              'PERMANENT ADDRESS': '-Not set-',
            },
          },
          job: {
            details: {
              'EMPLOYEE NUMBER': data.empcode || '-Not set-',
              'DATE OF JOINING': data.dojoin ? moment(data.dojoin).format('DD MMM, YYYY') : '-Not set-',
              'JOB TITLE - PRIMARY': data.desg_name || '-Not set-',
              // 'JOB TITLE - SECONDARY': data.secondary_job_title || '-Not set-',
              'IN PROBATION?': data.in_probation ? `Yes  ${moment(data.prob_start).format('DD MMM, YYYY')} - ${moment(data.prob_end).format('DD MMM, YYYY')}` : 'No',
              'NOTICE PERIOD': data.notice_period || '-Not set-',
              'Employee TYPE': data.emptype || '-Not set-',
              'Work TYPE': data.wrktype || '-Not set-',
              'Work From': data.wrkfrm || '-Not set-',
              'BAND': data.band || '-Not set-',
              'PAY GRADE': data.pay_grade || '-Not set-',
              'Department': data.deptname || '-Not set-',
            }
          },
          // document: {
          //   details: {
          //     'Aadhar': data.aadharno || 'Not Updated',
          //   }
          // },
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false); // ✅ loader stop
    }
  };

  // Load profile when page opens
  useEffect(() => {
    fetchAndSetProfile();
  }, [employee, dispatch]);
  // Save updates and refresh immediately

  const handleSave = async (updatedData) => {
    setLoading(true); // ✅ loader start
    try {
      const normalizedData = {};
      Object.entries(updatedData).forEach(([key, value]) => {
        normalizedData[key.trim()] = value;
      });

      const res = await dispatch(updateEmployeeSection(employee.empid, normalizedData));
      if (res.success) {
        await fetchAndSetProfile();
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", res.message || "Failed to update");
      }
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", "Failed to update profile!");
    } finally {
      setLoading(false); // ✅ loader stop
    }

    setModalVisible(false);
  };


  useEffect(() => {
    if (route.params?.capturedImage) {
      console.log("post image", route.params?.capturedImage);

      setSelectedImage(route.params?.capturedImage.uri); // ✅ Set image URI
    }
  }, [route.params?.capturedImage]);

  const handleImagePick = () => {
    Alert.alert(
      'Choose Image Source',
      'Select the source of the image',
      [
        {
          text: 'Camera',
          onPress: () => {
            ImageCropPicker.openCamera({
              width: 800,
              height: 800,
              cropping: true,
              compressImageQuality: 0.7,
            }).then((image) => {
              setSelectedImage(image.path);
            });
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            ImageCropPicker.openPicker({
              width: 800,
              height: 800,
              cropping: true,
              compressImageQuality: 0.7,
            }).then((image) => {
              setSelectedImage(image.path);
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleUploadImage = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image first!");
      return;
    }

    setImageUploading(true); // ✅ loader start only for image
    try {
      // 🔹 Resize the image
      const resizedImage = await ImageResizer.createResizedImage(
        selectedImage,
        800,
        800,
        'JPEG',
        70
      );

      const formData = new FormData();
      formData.append("profile_img", {
        uri: resizedImage.uri,
        type: "image/jpeg",
        name: "profile.jpg",
      });

      const res = await dispatch(profileImageUpload(employee.empid, formData));

      if (res.success) {
        await fetchAndSetProfile();
        setSelectedImage(null);
        Alert.alert("Success", "Profile image updated!");
      } else {
        Alert.alert("Error", res.message || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Image resize or upload failed!");
    } finally {
      setImageUploading(false); // ✅ loader stop
    }
  };

  //  Reset password
  // const ResetPasswordModal = ({ modalVisible, setModalVisible, userId }) => {
  //   const [password, setPassword] = useState('');
  //   const [confirmPassword, setConfirmPassword] = useState('');
  //   const [showPassword, setShowPassword] = useState(false);
  
  //   const handleSetPassword = async () => {
  //     if (password !== confirmPassword) {
  //       Alert.alert('Error', 'Passwords do not match!');
  //       return;
  //     }
  
  //     try {
  //       const response = await fetch('http://YOUR_LOCALHOST_OR_SERVER/update_password.php', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           user_id: userId,   // 👈 your logged-in user’s id
  //           password: password,
  //         }),
  //       });
  
  //       const data = await response.json();
  
  //       if (data.success) {
  //         Alert.alert('Success', data.message);
  //         setModalVisible(false);
  //       } else {
  //         Alert.alert('Error', data.message);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       Alert.alert('Error', 'Network error. Please try again.');
  //     }
  //   };



/////////////////////////////////
  const openEdit = (section, data) => {
    setEditSection(section);
    setEditData(data);
    setModalVisible(true);
  };

  const EditModal = ({ visible, data, onClose, onSave }) => {
    const [localData, setLocalData] = useState(data);
    useEffect(() => { setLocalData(data); }, [data]);

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editSection}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {Object.entries(localData).map(([key, value]) => (
                <View key={key} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 4, fontWeight : 700 }}>{key}</Text>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={(text) => setLocalData({ ...localData, [key]: text })}
                    placeholder={`Enter ${key}`}
                  />
                </View>
              ))}
            </ScrollView>

            {/* Buttons in one row */}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onSave(localData)} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };


  const SummaryRoute = () => (
    <ScrollView style={styles.scene}>
      <View style={styles.pariseCard}>
        <Text style={styles.tital}>Praises</Text>
        <View style={styles.infoBody}>
          <Ionicons name="cube" size={100} color="#eee" />
        </View>
      </View>

      <View style={styles.pariseCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <Text style={styles.tital}>About</Text>
          <TouchableOpacity onPress={() => openEdit("about", { "About": profileState.summary.about })}>
            <Ionicons name="create" size={25} color="#E53935" />
          </TouchableOpacity>
        </View>
        <View style={styles.infoBody}>
          <Text>{profileState.summary.about}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="briefcase" size={20} color="#E53935" style={styles.icon} />
        <View>
          <Text style={styles.label}>Designation</Text>
          <Text style={styles.value}>{profileState.summary.designation}</Text>
        </View>
      </View>
    </ScrollView>
  );

  const PersonalRoute = () => (
    <ScrollView style={styles.scene}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>Primary Details</Text>
          <TouchableOpacity onPress={() => openEdit("primary", profileState.personal.primaryDetails)}>
            <Ionicons name="create" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {Object.entries(profileState.personal.primaryDetails).map(([label, value]) => (
          <View style={styles.row} key={label}>
            <View>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="call" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>Contact Details</Text>
          <TouchableOpacity onPress={() => openEdit("contact", profileState.personal.contactDetails)}>
            <Ionicons name="create" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {Object.entries(profileState.personal.contactDetails).map(([label, value]) => (
          <View style={styles.row} key={label}>
            <View>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="home" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>Addresses</Text>
          <TouchableOpacity onPress={() => openEdit("address", profileState.personal.addresses)}>
            <Ionicons name="create" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {Object.entries(profileState.personal.addresses).map(([label, value]) => (
          <View style={styles.row} key={label}>
            <Ionicons name="location" size={18} color="#E53935" style={styles.icon} />
            <View>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const JobRoute = () => (
    <ScrollView style={styles.scene}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="business" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>Job</Text>
        </View>
        {Object.entries(profileState.job.details).map(([label, value]) => (
          <View style={styles.row} key={label}>
            <View>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
  // const DocumentRoute = () => (
  //   <ScrollView style={styles.scene}>
  //     <View style={styles.card}>
  //       <View style={styles.cardHeader}>
  //         <Text style={styles.cardTitle}>Documents</Text>
  //         <TouchableOpacity onPress={() => openEdit("document", profileState.document.details)}>
  //           <Text style={styles.editText}>Edit</Text>
  //         </TouchableOpacity>
  //       </View>
  //       {Object.entries(profileState.document.details).map(([label, value]) => (
  //         <View style={styles.row} key={label}>
  //           <Text style={styles.label}>{label}</Text>
  //           <Text style={styles.value}>{value}</Text>
  //         </View>
  //       ))}
  //     </View>
  //   </ScrollView>
  // );

  const renderScene = SceneMap({
    summary: SummaryRoute,
    // timeline: () => <View style={styles.scene}><Text>No Timeline Data</Text></View>,
    personal: PersonalRoute,
    job: JobRoute,
    // document: DocumentRoute,
  });


  return (
    <SafeAreaView
      style={[
        styles.outerContainer,
        {
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 0,
        },
      ]}
    >
      <View style={styles.container}>
        <View style={styles.profileContainer}>
          <TouchableOpacity style={styles.editIcon} onPress={handleImagePick}>
            <Ionicons name="add-outline" size={18} color="#fff" />
          </TouchableOpacity>

          <View style={styles.imageWrapper}>
            {imageUploading ? (
              <ActivityIndicator size="large" color="#007bff" />
            ) : (
              <TouchableOpacity
                onPress={() => setZoomImageUri(profileState?.profileInfo?.profileImage)}
              >
                <Image
                  source={{ uri: profileState?.profileInfo?.profileImage }}
                  style={[styles.profileImage, { transform: [{ rotate: rotation }] }]}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.name}>{profileState.profileInfo.name}</Text>
          <Text style={styles.email}>{profileState.profileInfo.email}</Text>
          <Text style={styles.mobile}>{profileState.profileInfo.empcode}</Text>

  {/* Button to open modal */}
  <TouchableOpacity
        style={styles.openButton}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.closeText}>  🔐 Change Password</Text>
      </TouchableOpacity>
    {/* Modal */}
    <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}> 🔐 Change Password</Text>

            {/* Password Inputs */}
            <TextInput
              style={styles.input}
              placeholder="Password"
              // secureTextEntry={showPassword}
              // // value={password}
              // onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              // secureTextEntry={!showPassword}
              // value={confirmPassword}
              // onChangeText={setConfirmPassword}
            />

            {/* Show Password Toggle */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setShowPassword(!showPassword)}>
              <View
                style={[styles.checkbox]}
              />
              <Text style={styles.checkboxLabel}>Show passwords</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              // onPress={handleSetPassword} // commented out
              onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Set Password</Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
     </Modal>
          </View>

        {/* ✅ Image Preview Card */}
        {selectedImage && (
          <Modal
            visible={!!selectedImage}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setSelectedImage(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>

                {/* Close Btn */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>

                {/* Preview Image */}
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />

                {/* Upload Btn below image */}
                <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadImage}>
                  <Text style={styles.uploadText}>Upload</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* 🔍 Zoom Modal */}
        {zoomImageUri && (
          <Modal
            visible={!!zoomImageUri}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setZoomImageUri(null)}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => setZoomImageUri(null)}>
                <View style={styles.modalOverlay}>
                  <Image
                    source={{ uri: zoomImageUri }}
                    style={{ width: width * 0.9, height: width * 0.9, borderRadius: 10 }}
                    resizeMode="contain"
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </Modal>
        )}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: Dimensions.get("window").width }}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              indicatorStyle={{ backgroundColor: "#E53935" }}
              style={{ backgroundColor: "#fff", elevation: 2 }}
              activeColor="#E53935"
              inactiveColor="#333"
              labelStyle={{ fontWeight: "600", fontSize: 12 }}
              scrollEnabled
              tabStyle={{ minWidth: 50 }}
            />
          )}
        />

        {/* <EditModal
          visible={modalVisible}
          data={editData}
          onClose={() => setModalVisible(false)}
          onSave={handleSave}
        /> */}
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#f4f6f8', },
  container: { flex: 1 },
  profileContainer: {
    backgroundColor: '#fff', borderRadius: 15, padding: 20,
    alignItems: 'center', marginBottom: 10,
  },
  editIcon: {
    position: 'absolute', top: '54%', right: '37%',
    backgroundColor: '#E53935', padding: 3, borderRadius: 12, zIndex: 1
  },
  imageWrapper: {
    borderWidth: 3, borderColor: '#E53935',
    padding: 3, borderRadius: 65, elevation: 8, marginBottom: 10,
  },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  name: { fontSize: 22, fontWeight: '700', color: '#333' },
  email: { fontSize: 14, color: '#666', marginTop: 2 },
  mobile: { fontSize: 14, color: '#666', marginBottom: 4 },
  scene: {
    flex: 1,
    padding: width * 0.03,
  },
  card: {
    backgroundColor: '#f1f1f1ff', borderRadius: 8, paddingBottom: 16, marginBottom: 16, elevation: 16,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: "#E95535", borderTopLeftRadius: 10, borderTopRightRadius: 10
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    paddingBottom: 8, paddingHorizontal: 10
  },
  label: { fontSize: 12, color: '#888' },
  value: { fontSize: 14, fontWeight: '600', color: '#333' },
  icon: { marginRight: 10 },
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 20, elevation: 2,
  },
  pariseCard: {
    backgroundColor: '#fff', borderRadius: 8, padding: 16,
    marginBottom: 10, alignItems: 'center', elevation: 2,
  },
  tital: { alignSelf: 'flex-start', fontWeight: 'bold', fontSize: 16, color: '#E53935', marginBottom: 10 },
  infoBody: { justifyContent: 'center', alignItems: 'center', width: '100%' },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // dim bg
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#fff",   // ✅ White card
    borderRadius: 12,
    padding: 20,
    width: "90%",
    elevation: 8,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
    textAlign: "left",
    borderBottomWidth: 1,
    borderBottomColor: "#b4b4b4ff",
    paddingBottom: 8,
  },

  modalActions: {
    flexDirection: "row",       // ✅ side by side
    justifyContent: "flex-end", // right aligned
    marginTop: 20,
  },

  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
  },

  cancelText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },

  saveBtn: {
    backgroundColor: "#E53935",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation:2
  },

  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fafafa",
    elevation: 2,
  },

  previewImage: {
    width: 250,
    height: 250,
    borderRadius: 8,
    marginVertical: 20,
  },

  uploadBtn: {
    backgroundColor: "#E53935",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },

  uploadText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  zoomImage: {
    width: "100%",
    height: "100%",
  },

// butteon model

openButton: {
  shadowOpacity: 0.4,
  transform: [{ scale: 1 }],
},
buttonText: {
  color: '#fff',
  fontSize: 15,
  fontWeight: '600',
  letterSpacing: 0.5,
},

// ---------- Modal Styles ----------
screen: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F4F5F7',
},
overlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.35)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  width: '88%',
  backgroundColor: '#fff',
  borderRadius: 16,
  paddingVertical: 25,
  paddingHorizontal: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 8,
},
title: {
  fontSize: 22,
  fontWeight: '700',
  marginBottom: 20,
  textAlign: 'center',
  color: '#222',
  letterSpacing: 0.3,
},
input: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  marginBottom: 14,
  backgroundColor: '#FAFAFA',
  color: '#333',
},
checkboxRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 20,
},
checkbox: {
  width: 20,
  height: 20,
  borderWidth: 1.5,
  borderColor: '#4A90E2',
  borderRadius: 5,
  marginRight: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
checkboxChecked: {
  backgroundColor: '#4A90E2',
},
checkboxLabel: {
  fontSize: 15,
  color: '#333',
},
button: {
  backgroundColor: '#4A90E2',
  paddingVertical: 14,
  borderRadius: 10,
  alignItems: 'center',
  marginBottom: 10,
  shadowColor: '#4A90E2',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 5,
},
buttonText: {
  color: '#fff',
  fontSize: 13,
  fontWeight: '600',
},
closeText: {
  color: '#4A90E2',
  textAlign: 'center',
  fontSize: 15,
  marginTop: 4,
},



});
