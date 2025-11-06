// PollCard.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PollCard = ({ item }) => {
  if (!item || !item.options_json) return null;

  let options = [];
  try {
    options = JSON.parse(item.options_json);
    if (!Array.isArray(options)) options = [];
  } catch (e) {
    console.warn('Invalid options_json', e);
    options = [];
  }

  const initialVotes = item.votes || Array(options.length).fill(0);
  const [votes, setVotes] = useState(initialVotes);
  const [selected, setSelected] = useState(null);

  const totalVotes = votes.reduce((a, b) => a + b, 0) || 1;

  const handleVote = (idx) => {
    if (selected === idx) return;
    const newVotes = [...votes];
    if (selected !== null) newVotes[selected] = Math.max(newVotes[selected] - 1, 0);
    newVotes[idx]++;
    setVotes(newVotes);
    setSelected(idx);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name="poll" size={24} color="#2196F3" />
        <Text style={styles.name}>  {item.empname} created a poll</Text>
        <Text style={styles.timestamp}>{item.created_at}</Text>
      </View>
      <Text style={styles.caption}>{item.question}</Text>

      {options.length > 0 ? options.map((opt, idx) => {
        const barWidth = `${(votes[idx] / totalVotes) * 100}%`;
        return (
          <TouchableOpacity key={idx} style={styles.optionWrapper} onPress={() => handleVote(idx)}>
            <View style={styles.optionLabelRow}>
              <Text style={styles.optionText}>{opt}</Text>
              <Text style={styles.voteCount}>{votes[idx]} votes</Text>
            </View>
            <View style={styles.voteBarBackground}>
              <View style={[styles.voteBarFill, { width: barWidth }, selected === idx && styles.votedBar]} />
            </View>
          </TouchableOpacity>
        );
      }) : (
        <Text style={styles.emptyText}>No options available</Text>
      )}

      {item.expires_on && <Text style={styles.expires}>Expires on: {item.expires_on}</Text>}
    </View>
  );
};

export default PollCard;

const styles = StyleSheet.create({
  // Only poll-specific styles
  card: { backgroundColor: '#F1F8FF', borderColor: '#2196F3', borderWidth: 1, borderRadius: 12, padding: 12, margin: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 14, fontWeight: '600', color: '#000', flex: 1 },
  timestamp: { fontSize: 12, color: '#888' },
  caption: { fontSize: 16, color: '#333', marginVertical: 6, fontWeight: '500' },
  optionWrapper: { marginBottom: 14, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BBDEFB' },
  optionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  optionText: { fontSize: 14, color: '#000' },
  voteCount: { fontSize: 13, color: '#555' },
  voteBarBackground: { width: '100%', height: 8, borderRadius: 6, backgroundColor: '#E3F2FD', overflow: 'hidden' },
  voteBarFill: { height: '100%', backgroundColor: '#2196F3', borderRadius: 6 },
  votedBar: { backgroundColor: 'green' },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  expires: { marginTop: 6, fontSize: 12, color: '#888' }
});
