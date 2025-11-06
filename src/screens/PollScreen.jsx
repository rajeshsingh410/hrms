import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Switch,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { pick, types } from '@react-native-documents/picker';
import { useDispatch, useSelector } from 'react-redux';
import { postWallAsync } from '../services/Actions/employeeAction';

const PollScreen = ({ navigation }) => {
  const { employee } = useSelector((state) => state.employee);

  const dispatch = useDispatch();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [date, setDate] = useState(null);
  const [open, setOpen] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [notify, setNotify] = useState(false);
  const [multi, setMulti] = useState(false);
  const [userAdd, setUserAdd] = useState(false);
  const [excludeNotice, setExcludeNotice] = useState(false);
  const [file, setFile] = useState(null);

  const addOption = () => setOptions([...options, '']);
  const setOption = (idx, text) => {
    const arr = [...options];
    arr[idx] = text;
    setOptions(arr);
  };

  const pickFile = async () => {
    console.log('Opening picker…');
    try {
      const [res] = await pick({ type: [types.allFiles] });
      console.log('Picked file →', res);
      if (!res.name) {
        alert('Cannot detect file name.');
        return;
      }
      if (res.size > 10 * 1024 * 1024) {
        alert('File must be ≤10 MB');
        return;
      }
      setFile(res);
    } catch (e) {
      console.log('Picker cancelled or error', e);
    }
  };

  const submit = async () => {
    const form = new FormData();
    form.append('user_id', employee.empid);
    form.append('type', 'poll');
    form.append('question', question);
    options.forEach(opt => form.append('options[]', opt));
    if (date) form.append('date', date.toISOString().split('T')[0]);
    form.append('anonymous', anonymous ? 1 : 0);
    form.append('notify', notify ? 1 : 0);
    form.append('multi', multi ? 1 : 0);
    form.append('user_add', userAdd ? 1 : 0);
    form.append('exclude_notice', excludeNotice ? 1 : 0);
    if (file) {
      form.append('post_image', {
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name || 'attachment'
      });
    }

    dispatch(postWallAsync(form))
      .then(() => {
        // 🔄 Reset all states after successful post
        setQuestion('');
        setOptions(['', '', '']);        // default three empty options
        setDate(null);
        setFile(null);
        setAnonymous(false);
        setNotify(false);
        setMulti(false);
        setUserAdd(false);
        setExcludeNotice(false);

        // Navigate to the Wall tab
        navigation.navigate('MainTabs', { screen: 'Wall' });
      })
      .catch((err) => {
        Alert.alert('Error', 'Failed to submit post. Please try again.',err);
      });
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>What is this poll about?</Text>
      <TextInput
        style={styles.input}
        placeholder="Question"
        placeholderTextColor="#aaa"
        value={question}
        onChangeText={setQuestion}
      />

      <Text style={styles.label}>Options</Text>
      {options.map((opt, i) => (
        <TextInput
          key={i}
          style={styles.input}
          placeholder={`Option ${i + 1}`}
          placeholderTextColor="#aaa"
          value={opt}
          onChangeText={text => setOption(i, text)}
        />
      ))}
      <TouchableOpacity onPress={addOption} style={styles.addOption}>
        <Text style={styles.addText}>+ Add an option</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Poll expires on *</Text>
      <TouchableOpacity onPress={() => setOpen(true)}>
        <View style={styles.input}>
          <Text style={{ color: date ? '#000' : '#aaa' }}>
            {date ? date.toLocaleDateString() : 'Select date'}
          </Text>
        </View>
      </TouchableOpacity>
      <DatePicker
        modal open={open}
        date={date || new Date()}
        mode="date"
        onConfirm={d => { setOpen(false); setDate(d); }}
        onCancel={() => setOpen(false)}
        androidVariant="nativeAndroid"
      />

      {[
        { label: 'Anonymous poll', state: anonymous, set: setAnonymous },
        { label: 'Notify employees via email', state: notify, set: setNotify },
        { label: 'Users can vote for multiple options', state: multi, set: setMulti },
        { label: 'Allow users to add their own answers', state: userAdd, set: setUserAdd },
        { label: 'Exclude employees on notice period', state: excludeNotice, set: setExcludeNotice },
      ].map((item, i) => (
        <View style={styles.switchRow} key={i}>
          <Text style={styles.switchLabel}>{item.label}</Text>
          <Switch
            trackColor={{ false: '#ccc', true: '#e53935' }}
            thumbColor="#fff"
            onValueChange={item.set}
            value={item.state}
          />
        </View>
      ))}

      {/* Attach file row */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Attach file (png/jpg/doc/pdf ≤10 MB)</Text>
        <TouchableOpacity onPress={pickFile} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>
            {file ? 'Change' : 'Upload'}
          </Text>
        </TouchableOpacity>
      </View>
      {file && (
        <Text style={styles.filename}>
          📎 {file.name} – {(file.size / (1024 * 1024)).toFixed(2)} MB
        </Text>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={submit}>
        <Text style={styles.submitText}>Post</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default PollScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  label: { color: '#e53935', fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e53935', borderRadius: 4,
    padding: 12, color: '#000', backgroundColor: '#fff', marginBottom: 8,
  },
  addOption: { padding: 12, marginVertical: 4 },
  addText: { color: '#e53935', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 16,
  },
  switchLabel: { color: '#000', fontSize: 16, flex: 1, marginRight: 8 },
  uploadButton: {
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: '#e53935', borderRadius: 4,
  },
  uploadButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  filename: {
    marginTop: 8, fontSize: 14, color: '#333',
  },
  submitButton: {
    backgroundColor: '#e53935', padding: 16, alignItems: 'center', borderRadius: 4, marginVertical: 24,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
