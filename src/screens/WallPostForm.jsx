import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, ScrollView, Alert, Animated, KeyboardAvoidingView, Platform
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as ImagePicker from 'react-native-image-picker';
import ScreenWithBackHandler from '../navigation/ScreenWithBackHandler';
import { useDispatch, useSelector } from 'react-redux';
import { getMyAbout, postWallAsync } from '../services/Actions/employeeAction';
import { useRoute } from '@react-navigation/native';
import { useLoading } from '../navigation/LoadingContext';
import ImageCropPicker from 'react-native-image-crop-picker';

const WallPostForm = ({ navigation }) => {
  const { employee } = useSelector((state) => state.employee);
  const dispatch = useDispatch();
  const route = useRoute();
  const { loading, setLoading } = useLoading();

  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const [aboutInfo, setAboutInfo] = useState(null);

  useEffect(() => {
    if (route.params?.capturedImage) {
      console.log("post image", route.params?.capturedImage);

      resizeImage(route.params?.capturedImage.uri);
    }
  }, [route.params?.capturedImage]);

  //get my about info
  useEffect(() => {
    if (employee?.empid) {
      dispatch(getMyAbout(employee.empid))
        .then((res) => {
          if (res && res.data) {
            setAboutInfo(res.data);
          }
        })
        .catch((error) => {
          console.log("error ", error);
        });
    }
  }, []);

  const resizeImage = async (uri) => {
    try {
      setLoading(true);
      const resized = await ImageResizer.createResizedImage(
        uri,
        800, // width
        800, // height
        'JPEG',
        80 // quality
      );
      setSelectedImage(resized.uri);
    } catch (err) {
      console.error("Resize error:", err);
      Alert.alert("Error", "Failed to resize image.");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = () => {
    Alert.alert(
      'Choose Image Source',
      'Select the source of the image',
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const image = await ImageCropPicker.openCamera({
                width: 800,
                height: 800,
                cropping: true, // important
                compressImageQuality: 0.8,
              });
              setSelectedImage(image.path);
            } catch (error) {
              console.error("Camera error:", error);
            }
          }
        },
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const image = await ImageCropPicker.openPicker({
                width: 800,
                height: 800,
                cropping: true, // crop enable
                compressImageQuality: 0.8,
              });
              setSelectedImage(image.path);
            } catch (error) {
              console.error("Picker error:", error);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };



  const handlePost = async () => {
    if (!postText.trim() && !selectedImage) {
      Alert.alert('Error', 'Please write something or attach an image before posting.');
      return;
    }

    const form = new FormData();
    form.append('user_id', employee.empid);
    form.append('type', 'post');
    if (postText.trim()) form.append('post_text', postText.trim());

    if (selectedImage) {
      form.append('post_image', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'upload.jpg'
      });
    }

    try {
      setLoading(true);
      await dispatch(postWallAsync(form))
        .then((res) => {
          setPostText('');
          setSelectedImage(null);
          navigation.navigate('MainTabs', { screen: 'Wall' });
        })
        .catch((err) => {
          Alert.alert('Error', 'Failed to submit post. Please try again.');
        });
    } catch (err) {
      Alert.alert('Error', 'Failed to submit post. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (postText || selectedImage) {
      Alert.alert(
        'Discard Post?',
        'You have unsaved changes. Do you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
    return true;
  };

  const animateButton = (toValue) => {
    Animated.spring(scaleAnim, { toValue, friction: 4, useNativeDriver: true }).start();
  };

  return (
    <ScreenWithBackHandler onBack={handleBackPress}>
      <KeyboardAvoidingView
        style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Header with avatar, name, timestamp */}
          <View style={styles.postHeader}>
            <Image source={
              aboutInfo?.profile_img_url
                ? { uri: aboutInfo.profile_img_url }
                : require("../assets/images/profile.png") // fallback local image
            }
              style={styles.avatar} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.username}>{employee?.empname}</Text>
              <Text style={styles.timestamp}>Just now</Text>
            </View>
          </View>

          {/* Image selection / preview */}
          <View style={styles.imageSection}>
            {selectedImage ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeIcon} onPress={() => setSelectedImage(null)}>
                  <MaterialCommunityIcons name="close-circle" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleImagePick} style={styles.addImageButton}>
                <MaterialCommunityIcons name="plus-circle-outline" size={50} color="#E53935" />
                <Text style={styles.addImageText}>Add a Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Text input */}
          <View style={styles.textBox}>
            <TextInput
              style={styles.textArea}
              placeholder="What's on your mind?"
              placeholderTextColor="#999"
              multiline
              value={postText}
              onChangeText={setPostText}
            />
          </View>

          {/* Action icon row */}
          {selectedImage && (
            <View style={styles.actionRow}>
              <MaterialCommunityIcons name="heart-outline" size={24} color="#333" style={styles.actionIcon} />
              <MaterialCommunityIcons name="comment-outline" size={24} color="#333" style={styles.actionIcon} />
              <MaterialCommunityIcons name="share-outline" size={24} color="#333" style={styles.actionIcon} />
            </View>
          )}

          {/* Post button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => animateButton(0.95)}
              onPressOut={() => animateButton(1)}
              onPress={handlePost}
            >
              <LinearGradient colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
                style={styles.postButton}>
                <MaterialCommunityIcons name="send" size={22} color="#fff" />
                <Text style={styles.postButtonText}>Post Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWithBackHandler>
  );
};

export default WallPostForm;

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#FAFAFA' },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  username: { fontWeight: '600', fontSize: 16, color: '#333' },
  timestamp: { fontSize: 12, color: '#777' },

  imageSection: { width: '100%', alignItems: 'center', marginVertical: 15 },
  addImageButton: {
    alignItems: 'center', justifyContent: 'center', height: 150, width: '100%',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
    borderColor: '#ccc'
  },
  addImageText: { marginTop: 8, color: '#E53935', fontWeight: '600', fontSize: 16 },
  imageWrapper: { position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 300 },
  removeIcon: { position: 'absolute', top: 10, right: 10, backgroundColor: '#00000055', borderRadius: 20 },

  textBox: { width: '100%', marginBottom: 20 },
  textArea: {
    minHeight: 100, backgroundColor: '#fff',
    borderRadius: 12, padding: 12, fontSize: 16, color: '#333',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },

  actionRow: { flexDirection: 'row', marginBottom: 20 },
  actionIcon: { marginRight: 20 },

  postButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 40,
    shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5, elevation: 5
  },
  postButtonText: { marginLeft: 8, color: '#fff', fontWeight: '700', fontSize: 17 },
});
