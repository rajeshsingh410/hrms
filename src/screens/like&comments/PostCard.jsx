import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity,
  ScrollView, Alert, StyleSheet, Modal, Dimensions, TouchableWithoutFeedback
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { deleteCommentAsync, getMyAbout, getPostsLikeInfo, handlePostDeleteAsync, postWallAsync } from '../../services/Actions/employeeAction';
import { useLoading } from '../../navigation/LoadingContext';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import SweetAlert from 'react-native-sweet-alert';

import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';

const IMG_URL = 'https://chaaruvi.com/hrms/Mobileapp/';
const { height } = Dimensions.get("window");

const PostCard = ({ item, onLike, onComment }) => {
  const { employee } = useSelector(state => state.employee);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  // console.log("item", item);


  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  // const comments = item.comments || [];
  const [comments, setComments] = useState(item.comments || []);
  const [editCommentId, setEditCommentId] = useState(null);

  const [likes, setLikes] = useState(item.likes || 0);
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [aboutInfo, setAboutInfo] = useState(null);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);

  const [showOptions, setShowOptions] = useState(false);
  const [commentOptions, setCommentOptions] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState(item.post_text || '');
  const [editImage, setEditImage] = useState(item.image_path ? `${IMG_URL}/${item.image_path}` : null);

  const { loading, setLoading } = useLoading();

  useEffect(() => {
    if (employee.empid) {
      dispatch(getMyAbout(employee.empid))
        .then((res) => setAboutInfo(res.data));
    }
  }, [dispatch]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: "default-channel-id", // same id use karenge localNotification me
          channelName: "Default Channel",
          channelDescription: "A channel for general notifications",
          importance: 4, // high importance shows in status bar
          vibrate: true,
        },
        (created) => console.log(`CreateChannel returned '${created}'`)
      );
    }

    // iOS permission
    PushNotification.configure({
      onRegister: function (token) {
        console.log("TOKEN:", token);
      },
      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  }, []);



  useEffect(() => {
    // Permission
    messaging().requestPermission();

    // Foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      PushNotification.localNotification({
        title: remoteMessage.notification?.title,
        message: remoteMessage.notification?.body,
        playSound: true,
        soundName: 'default',
      });
    });

    // Background
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      PushNotification.localNotification({
        title: remoteMessage.notification?.title,
        message: remoteMessage.notification?.body,
        playSound: true,
        soundName: 'default',
      });
    });

    return unsubscribe;
  }, []);

  const handleLike = async () => {
    try {
      const result = await onLike(item.id);
      if (result === 'liked') {
        setLikes(likes + 1);
        setIsLiked(true);
        setLikedUsers([...likedUsers, {
          empid: employee.empid,
          empname: employee.empname,
          profile_img: aboutInfo?.profile_img_url
        }]);
        PushNotification.localNotification({
          channelId: "default-channel-id", 
          title: "Someone liked your post",
          message: `${employee.empname} liked your post.`,
          playSound: true,
          soundName: 'default',
        });
      } else if (result === 'unliked') {
        setLikes(Math.max(likes - 1, 0));
        setIsLiked(false);
        setLikedUsers(likedUsers.filter(u => u.empid !== employee.empid));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to like/unlike post.');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      if (editCommentId) {
        // 🔄 Update Comment
        await onComment(item.id, commentText.trim(), "update_comment", editCommentId);

        // Local state update
        const idx = comments.findIndex(c => c.id === editCommentId);
        if (idx !== -1) {
          comments[idx].text = commentText.trim();
        }

        Alert.alert("Success", "Comment updated.");
        setEditCommentId(null);
      } else {
        // 🆕 Add Comment
        await onComment(item.id, commentText.trim(), "comment");

        comments.push({
          id: Date.now(),
          user: employee.empname,
          text: commentText.trim(),
          profile_img: aboutInfo?.profile_img_url || null,
          created_at: "Just now",
        });

        PushNotification.localNotification({
          channelId: "default-channel-id",
          title: "New comment on your post",
          message: `${employee.empname} commented: ${commentText}`,
          playSound: true,
          soundName: 'default',
        });
        // Alert.alert("Success", "Comment added.");
      }

      setCommentText('');
      setShowComments(true);
    } catch (e) {
      Alert.alert("Error", "Failed to post comment.");
    }
  };

  const handleLikeView = (id) => {
    setLoading(true);
    dispatch(getPostsLikeInfo(id))
      .then((res) => {
        setLoading(false);
        setLikedUsers(res.data);
        setShowLikeModal(true);
      })
      .catch(() => {
        setLoading(false);
        setShowLikeModal(true);
      });
  };

  const handleEditPost = () => {
    setEditText(item.post_text || '');
    setEditImage(item.image_path ? `${IMG_URL}/${item.image_path}` : null);
    setEditModalVisible(true);
  };

  const handleGalleryPick = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      if (!response.didCancel && response.assets?.length > 0) {
        try {
          const pickedUri = response.assets[0].uri;

          // Resize image to maxWidth 800, maxHeight 800, compress to 80%
          const resizedImage = await ImageResizer.createResizedImage(
            pickedUri,
            800,
            800,
            'JPEG',
            80
          );

          setEditImage(resizedImage.uri); // set resized image URI
        } catch (err) {
          console.log('Image resize error:', err);
          Alert.alert('Error', 'Failed to resize image.');
        }
      }
    });
  };

  const handleUpdatePost = async () => {
    const form = new FormData();
    form.append('user_id', employee.empid);
    form.append('type', 'post');
    form.append('post_id', item.id);
    if (editText.trim()) form.append('post_text', editText.trim());
    if (editImage) {
      form.append('post_image', {
        uri: editImage,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });
    }

    try {
      setLoading(true);
      const res = await dispatch(postWallAsync(form));

      if (res.success) {
        SweetAlert.showAlertWithOptions({
          title: 'Success',
          subTitle: res.message || 'Post updated successfully!',
          confirmButtonTitle: 'OK',
          confirmButtonColor: '#4CAF50',
          style: 'success',
          cancellable: true
        },
          () => {
            // ✅ After pressing OK
            item.post_text = editText.trim();
            item.image_path = editImage ? editImage : item.image_path;

            setEditText('');
            setEditImage(null);
            setEditModalVisible(false);
            setShowOptions(false);

          });
      } else {
        SweetAlert.showAlertWithOptions({
          title: 'Error',
          subTitle: res.message || 'Failed to update post.',
          confirmButtonTitle: 'OK',
          confirmButtonColor: '#E53935',
          style: 'error',
        });
      }
    } catch (err) {
      console.error(err);
      SweetAlert.showAlertWithOptions({
        title: 'Error',
        subTitle: 'Failed to update post. Please try again.',
        confirmButtonTitle: 'OK',
        confirmButtonColor: '#E53935',
        style: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // postDelete 
  const handlePostDelete = (id) => {
    setLoading(true);
    dispatch(handlePostDeleteAsync(id))
      .then((res) => {
        if (res.success === "true" || res.success === true) {
          SweetAlert.showAlertWithOptions({
            title: "Deleted",
            subTitle: res.message || "Post Deleted Successfully!",
            confirmButtonTitle: "OK",
            confirmButtonColor: "#4CAF50",
            style: "success",
          });

          setShowOptions(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Wall' } }],
          });

        } else {
          SweetAlert.showAlertWithOptions({
            title: "Error",
            subTitle: res.message || "Failed to delete post.",
            confirmButtonTitle: "OK",
            confirmButtonColor: "#E53935",
            style: "error",
          });
        }
      })
      .catch((err) => {
        SweetAlert.showAlertWithOptions({
          title: "Error",
          subTitle: "Something went wrong while deleting.",
          confirmButtonTitle: "OK",
          confirmButtonColor: "#E53935",
          style: "error",
        });
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await dispatch(deleteCommentAsync(commentId));
      if (res.success === 'true' || res.success === true) {
        // Update local comments
        setComments(prev => prev.filter(c => c.id !== commentId));
        SweetAlert.showAlertWithOptions({
          title: "Success",
          subTitle: "Comment deleted successfully.",
          confirmButtonTitle: "OK",
          confirmButtonColor: "#4CAF50",
          style: "success",
        });

      } else {
        Alert.alert('Error', res.error || 'Failed to delete comment.');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong while deleting.');
    }
  };

  const sortedLikedUsers = Array.isArray(likedUsers)
    ? [...likedUsers].sort((a, b) => {
      if (a.empid === employee.empid) return -1;
      if (b.empid === employee.empid) return 1;
      return 0;
    })
    : [];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={item?.profile_img ? { uri: `https://chaaruvi.com/hrms/Mobileapp/profile_img/${item?.profile_img}` } : require("../../assets/images/profile.png")}
          style={styles.profileImg}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.empname || 'Unknown User'}</Text>
          <Text style={styles.timestamp}>{item.created_at || 'Just now'}</Text>
        </View>
        {
          item?.user_id === employee?.empid && (
            <TouchableOpacity onPress={() => setShowOptions(!showOptions)}>
              <Ionicons name="ellipsis-vertical" size={20} color="#000" />
            </TouchableOpacity>
          )
        }
        {showOptions && (
          <View style={[styles.inlineOptions, { top: 35, right: 10, position: 'absolute' }]}>
            <TouchableOpacity style={styles.optionBtn} onPress={handleEditPost}>
              <Text style={styles.optionText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => { handlePostDelete(item.id) }}>
              <Text style={[styles.optionText, { color: "red" }]}>🗑 Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Post Content */}
      {item.post_text && <Text style={styles.caption}>{item.post_text}</Text>}
      {item.image_path && <Image
        source={{ uri: `${IMG_URL}/${item.image_path}` }}
        style={styles.postImage}
        resizeMode="cover"
      />}

      {/* Likes & Comments */}
      <View style={styles.statsRow}>
        <TouchableOpacity onPress={() => handleLikeView(item.id)}>
          <Text style={[styles.statsText, { color: '#1877F2', fontWeight: '500' }]}>{likes} Likes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowComments(!showComments)}>
          <Text style={[styles.statsText, { color: '#1877F2', fontWeight: '500' }]}>{comments.length} Comments</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons name="thumbs-up" size={18} color={isLiked ? '#1877F2' : '#444'} />
          <Text style={[styles.actionLabel, isLiked && { color: '#1877F2' }]}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(!showComments)}>
          <Ionicons name="chatbubble-outline" size={18} color="#444" />
          <Text style={styles.actionLabel}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Share', 'Feature coming soon!')}>
          <Ionicons name="share-social-outline" size={18} color="#444" />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Comments */}
      {showComments && (
        <View style={styles.commentSection}>
          <ScrollView style={styles.commentsList} nestedScrollEnabled>
            {comments.map((c) => (
              <TouchableWithoutFeedback
                key={c.id}
                onLongPress={() => setCommentOptions(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
              >
                <View style={styles.commentRow}>
                  <Image
                    source={aboutInfo?.profile_img_url ? { uri: `https://chaaruvi.com/hrms/Mobileapp/profile_img/${c?.profile_img}` } : require("../../assets/images/profile.png")}
                    style={styles.commentProfile}
                  />
                  <View style={styles.commentBox}>
                    <Text style={styles.commentUser}>{c.user}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                    <Text style={styles.commentTime}>{c.created_at || ''}</Text>
                  </View>
                  {commentOptions[c.id] && c?.user_id === employee?.empid && (
                    <View style={styles.commentOptionBox}>
                      <TouchableOpacity
                        style={styles.optionBtn}
                        onPress={() => {
                          setCommentOptions(prev => ({ ...prev, [c.id]: false }));
                          setEditCommentId(c.id);
                          setCommentText(c.text);
                        }}
                      >
                        <Text style={styles.optionText}>✏️ Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.optionBtn}
                        onPress={() => {
                          setCommentOptions(prev => ({ ...prev, [c.id]: false }));
                          handleDeleteComment(c.id);
                        }}
                      >
                        <Text style={[styles.optionText, { color: 'red' }]}>🗑 Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            ))}
          </ScrollView>
          <View style={styles.addCommentRow}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="#888"
            />
            <TouchableOpacity onPress={handleComment}>
              <Ionicons name="send" size={22} color="#1877F2" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Like Modal */}
      <Modal visible={showLikeModal} animationType="slide" transparent onRequestClose={() => setShowLikeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>People who liked</Text>
              <TouchableOpacity onPress={() => setShowLikeModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              {sortedLikedUsers.length > 0 ? (
                sortedLikedUsers.map((user) => (
                  <View key={user?.empid} style={styles.likeRow}>
                    <Image
                      source={user?.profile_img ? { uri: `https://chaaruvi.com/hrms/Mobileapp/profile_img/${user.profile_img}` } : require("../../assets/images/profile.png")}
                      style={styles?.likeProfile}
                    />
                    <Text style={styles.likeName}>{user?.empid === employee?.empid ? "You" : user?.empname}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ textAlign: "center", marginTop: 20 }}>No likes yet</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Post Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.modalTitle}>Edit Post</Text>
            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              {/* Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder="Edit your post..."
                value={editText}
                onChangeText={setEditText}
                multiline
              />

              {/* Existing Image Preview */}
              {editImage && (
                <View style={{ marginVertical: 10, position: 'relative' }}>
                  <Image source={{ uri: editImage }} style={styles.previewImage} />
                  {/* Only allow removing image if no likes/comments */}
                  {item.likes < 0 && item.comments.length === 0 && (
                    <TouchableOpacity
                      style={styles.removeIcon}
                      onPress={() => setEditImage(null)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={28} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Gallery Picker */}
              {item.likes === 0 && item.comments.length == 0 && (
                <TouchableOpacity style={styles.galleryBtn} onPress={handleGalleryPick}>
                  <MaterialCommunityIcons name="image-plus" size={24} color="#fff" />
                  <Text style={{ color: '#fff', marginLeft: 8 }}>Pick from Gallery</Text>
                </TouchableOpacity>
              )}

              {/* Update Button */}
              <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
                <TouchableOpacity style={[styles.updateBtn, { flex: 1 }]} onPress={handleUpdatePost}>
                  <Text style={{ flexShrink: 1, color: '#fff', fontWeight: '600', textAlign: 'center' }}>Update</Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setEditModalVisible(false)}>
                  <Text style={{ flexShrink: 1, color: "#fff", fontWeight: '600', textAlign: 'center' }}>Cancel</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>


    </View>
  );
};

export default PostCard;

// Styles
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', marginBottom: 10, paddingVertical: 10, borderRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  profileImg: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#c5c5c5ff" },
  name: { fontSize: 15, fontWeight: '600', color: '#000' },
  timestamp: { fontSize: 12, color: '#666' },
  caption: { fontSize: 14, color: '#222', margin: 10 },
  postImage: { width: '100%', height: 320, marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginVertical: 6 },
  statsText: { fontSize: 13, color: '#666' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#eee', borderBottomWidth: 1, borderBottomColor: '#eee' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionLabel: { marginLeft: 6, fontSize: 14, fontWeight: '500', color: '#444' },
  commentSection: { paddingHorizontal: 10, paddingTop: 8 },
  commentsList: { maxHeight: 140 },
  commentRow: { flexDirection: 'row', marginBottom: 8 },
  commentProfile: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  commentBox: { backgroundColor: '#f0f2f5', padding: 8, borderRadius: 10, flex: 1 },
  commentUser: { fontWeight: '600', fontSize: 13, color: '#000' },
  commentText: { fontSize: 13, color: '#333', marginVertical: 2 },
  commentTime: { fontSize: 11, color: '#888' },
  addCommentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, marginRight: 8 },

  inlineOptions: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    width: 120,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 1000
  },
  optionBtn: { paddingVertical: 5, paddingHorizontal: 15 },
  optionText: { fontSize: 15, fontWeight: "500", color: "#000" },
  commentOptionBox: { position: 'absolute', right: 0, top: 0, backgroundColor: "#fff", borderRadius: 6, elevation: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 } },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { height: height * 0.8, backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 15 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  likeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  likeProfile: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#c5c5c5ff", marginRight: 10 },
  likeName: { fontSize: 15, fontWeight: "500", color: "#000" },

  // Edit Modal
  editModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  editModalContainer: { width: '90%', backgroundColor: "#fff", borderRadius: 12, padding: 15 },
  textInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minHeight: 100, textAlignVertical: 'top' },
  previewImage: { width: '100%', height: 200, borderRadius: 10 },
  removeIcon: { position: 'absolute', top: 10, right: 10, backgroundColor: '#00000055', borderRadius: 20 },
  galleryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1877F2', padding: 10, borderRadius: 8, marginVertical: 10, justifyContent: 'center' },
  updateBtn: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 5 },
  cancelBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 5, backgroundColor: '#E53935', },
});
