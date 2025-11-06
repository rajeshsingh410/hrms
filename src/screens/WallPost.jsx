// WallPost.js
import React, { useCallback, useState } from 'react';
import {
  StyleSheet, View, Image, TextInput, TouchableOpacity,
  Text, FlatList, Platform, ActionSheetIOS, Modal,
  TouchableWithoutFeedback, Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getMyAbout, getWallPostsAsync, interactWithPostAsync } from '../services/Actions/employeeAction';

// Import separated components
import PostCard from './like&comments/PostCard';
import PollCard from './like&comments/PollCard';
import { useFocusEffect } from '@react-navigation/native';
import { useLoading } from '../navigation/LoadingContext';

const WallPost = ({ navigation }) => {
  const { employee } = useSelector((state) => state.employee);
  // console.log("employee data in wallpost", employee);
  
  const dispatch = useDispatch();
  const { loading, setLoading } = useLoading();

  const [posts, setPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All posts');
  const [modalVisible, setModalVisible] = useState(false);
  const [aboutInfo, setAboutInfo] = useState(null);

  const filters = ['All posts', 'Organisation', 'HR'];
  const userId = employee?.empid;

  useFocusEffect(
    useCallback(() => {
      const fetchPosts = async () => {
        try {
          setLoading(true); // 🔴 start loader
          const postsArr = await dispatch(getWallPostsAsync());
          // console.log("get data", postsArr);

          const postsWithData = postsArr.map(post => ({
            ...post,
            likes: post.comments?.filter(c => parseInt(c.likes) > 0).length || 0,
            isLiked: post.comments?.some(c => c.user_id == userId && parseInt(c.likes) > 0) || false,
            comments: post.comments
              ?.filter(comment => comment.comment_text && comment.comment_text.trim() !== '')
              .map(c => ({
                id: c.id,
                user: c.empname || "Anonymous",
                user_id : c.user_id,
                profile_img: c.profile_img,
                text: c.comment_text,
                created_at: c.created_at
              })) || []
          }));

          setPosts(postsWithData);

          // ✅ About Info bhi load karo
          if (employee?.empid) {
            const aboutRes = await dispatch(getMyAbout(employee.empid));
            // console.log("About Info:", aboutRes);
            setAboutInfo(aboutRes?.data || null);
          }
        } catch (err) {
          console.error("Error fetching posts:", err);
        } finally {
          setLoading(false); // 🟢 stop loader
        }
      };

      fetchPosts();
      return () => setPosts([]);
    }, [dispatch, userId])
  );

  // Handle Like API
  const handleLikeAPI = async (contentId) => {
    try {
      setLoading(true); // loader start
      const res = await dispatch(interactWithPostAsync(contentId, userId, 'like'));
      // console.log("Like response", res);
      return res.status;
    } catch (err) {
      console.error("Like API Error:", err);
      return 'error';
    } finally {
      setLoading(false); // loader stop
    }
  };


  // Handle Comment API
  const handleCommentAPI = async (contentId, text, type = "comment", commentId = null) => {
    try {
      setLoading(true);
      const res = await dispatch(interactWithPostAsync(contentId, userId, type, text, commentId));
      // console.log("service response", res);
      return res;
    } catch (err) {
      console.error("Comment API Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };



  // Render Posts
  const renderItem = ({ item }) =>
    item.type === 'poll'
      ? <PollCard item={item} />
      : <PostCard item={item} onLike={handleLikeAPI} onComment={handleCommentAPI} />;

  // Handle Add Button
  const onAddPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Poll', 'Create Post'], cancelButtonIndex: 0 },
        idx => {
          if (idx === 1) navigation.navigate('PullScreen');
          if (idx === 2) navigation.navigate('CreatePost');
        }
      );
    } else {
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image
            source={
              aboutInfo?.profile_img_url
                ? { uri: aboutInfo.profile_img_url }
                : require("../assets/images/profile.png") // fallback local image
            }
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#c5c5c5ff" }}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search colleagues"
          placeholderTextColor="#888"
        />
      </View>

      {/* Filters */}
      <View style={styles.filterBar}>
        {filters.map(filter => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, isActive ? styles.activeFilter : styles.inactiveFilter]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, isActive ? styles.activeFilterText : styles.inactiveFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Posts List */}
      {posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id || 'post'}-${index}`}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts available.</Text>
        </View>
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Android Modal */}
      {Platform.OS === 'android' && (
        <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalMenu}>
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => { setModalVisible(false); navigation.navigate('PullScreen'); }}
                >
                  <Icon name="poll" size={24} color="#E53935" />
                  <Text style={styles.menuText}>Poll</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => { setModalVisible(false); navigation.navigate('CreatePost'); }}
                >
                  <Icon name="post-add" size={24} color="#E53935" />
                  <Text style={styles.menuText}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

export default WallPost;

// Styles
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fafafa' },

  headerRow: {
    flexDirection: 'row', padding: 12, alignItems: 'center',
    backgroundColor: '#fff', elevation: 4, shadowColor: '#000',
    shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 },
  },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  searchInput: {
    flex: 1, marginLeft: 10, height: 40,
    backgroundColor: '#f0f0f0', borderRadius: 20,
    paddingHorizontal: 15, fontSize: 14, color: '#333'
  },

  filterBar: { flexDirection: 'row', padding: 10 },
  filterButton: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, marginRight: 8 },
  activeFilter: { backgroundColor: '#E53935' },
  inactiveFilter: { backgroundColor: '#eee' },
  filterText: { fontSize: 14 },
  activeFilterText: { color: '#fff', fontWeight: '600' },
  inactiveFilterText: { color: '#444' },

  addButton: {
    position: 'absolute', bottom: 20, right: 20, backgroundColor: '#E53935',
    width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.3,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalMenu: { backgroundColor: '#fff', paddingBottom: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  menuOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  menuText: { fontSize: 16, color: '#000', marginLeft: 12 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
});
