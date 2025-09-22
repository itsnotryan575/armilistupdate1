import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Bell, Calendar, Filter, Plus } from 'lucide-react-native';
import { ReminderCard } from '../../components/ReminderCard';
import { FilterModal } from '../../components/FilterModal';
import { AddReminderModal } from '../../components/AddReminderModal';
import { EditReminderModal } from '../../components/EditReminderModal';
import { DatabaseService } from '@/services/DatabaseService';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';

const REMINDER_TYPE_COLORS = {
  all: '#6B7280',
  general: '#3B82F6',
  health: '#EF4444',
  celebration: '#F59E0B',
  career: '#059669',
  life_event: '#8B5CF6',
};

export default function RemindersScreen() {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [addReminderModalVisible, setAddReminderModalVisible] = useState(false);
  const [editReminderModalVisible, setEditReminderModalVisible] = useState(false);
  const [selectedReminderForEdit, setSelectedReminderForEdit] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const colors = {
    background: isDark ? '#0B0909' : '#003C24',
    surface: isDark ? '#1A1A1A' : '#002818',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    text: '#f0f0f0',
    textSecondary: '#f0f0f0',
    primary: '#f0f0f0',
    secondary: isDark ? '#6B7280' : '#012d1c',
    accent: isDark ? '#3B82F6' : '#012d1c',
    border: isDark ? '#2A2A2A' : '#012d1c',
  };

  useEffect(() => {
    loadReminders();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadReminders();
    }, [])
  );

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getAllReminders();
      setReminders(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    if (selectedFilter === 'all') return true;
    return reminder.type === selectedFilter;
  });

  const filterOptions = [
    { key: 'all', label: 'All', count: reminders.length },
    { key: 'general', label: 'General', count: reminders.filter(r => r.type === 'general').length },
    { key: 'health', label: 'Health', count: reminders.filter(r => r.type === 'health').length },
    { key: 'celebration', label: 'Celebration', count: reminders.filter(r => r.type === 'celebration').length },
    { key: 'career', label: 'Career', count: reminders.filter(r => r.type === 'career').length },
    { key: 'life_event', label: 'Life Event', count: reminders.filter(r => r.type === 'life_event').length },
  ];

  const handleReminderComplete = async (reminderId: number) => {
    await loadReminders(); // Refresh the list
  };

  const handleReminderSnooze = async (reminderId: number, newDate: string) => {
    await loadReminders(); // Refresh the list
  };

  const handleReminderDelete = async (reminderId: number) => {
    try {
      // Get the reminder to cancel its notification
      const reminder = await DatabaseService.getReminderById(reminderId);
      if (reminder?.notificationId) {
        const { cancelById } = await import('@/services/Scheduler');
        await cancelById(reminder.notificationId);
      }
      
      // Delete the reminder from database
      await DatabaseService.deleteReminder(reminderId);
      
      // Refresh the list
      await loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleReminderAdded = () => {
    loadReminders(); // Refresh the list
  };

  const handleReminderEdit = (reminder: any) => {
    setSelectedReminderForEdit(reminder);
    setEditReminderModalVisible(true);
  };

  const handleReminderUpdated = () => {
    setEditReminderModalVisible(false);
    setSelectedReminderForEdit(null);
    loadReminders(); // Refresh the list
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Bell size={32} color={colors.text} />
        <Text style={[styles.title, { color: colors.text }]}>Reminders</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => setAddReminderModalVisible(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContent}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedFilter === option.key 
                    ? REMINDER_TYPE_COLORS[option.key] || colors.primary 
                    : colors.surface,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setSelectedFilter(option.key)}
            >
              <Text style={[
                styles.filterChipText,
                {
                  color: selectedFilter === option.key ? '#FFFFFF' : colors.text,
                }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reminders List */}
      {loading ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
            Loading reminders...
          </Text>
          {selectedFilter === 'all' && (
            <TouchableOpacity
              style={[styles.emptyActionButton, { backgroundColor: colors.secondary }]}
              onPress={() => setAddReminderModalVisible(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyActionButtonText}>Add Your First Reminder</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
          {filteredReminders.length > 0 ? (
            filteredReminders.map((reminder) => (
              <ReminderCard 
                key={reminder.id} 
               reminder={{
                 ...reminder,
                 completed: Boolean(reminder.completed)
               }}
                theme={colors}
                onComplete={handleReminderComplete}
                onSnooze={handleReminderSnooze}
                onDelete={handleReminderDelete}
                onEdit={handleReminderEdit}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                No reminders found
              </Text>
              <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
                {selectedFilter === 'all' 
                  ? 'You have no reminders set up yet'
                  : `No ${selectedFilter} reminders found`
                }
              </Text>
              {selectedFilter === 'all' && (
                <TouchableOpacity
                  style={[styles.emptyActionButton, { backgroundColor: colors.secondary }]}
                  onPress={() => setAddReminderModalVisible(true)}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.emptyActionButtonText}>Add Your First Reminder</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedFilter={selectedFilter}
        onFilterSelect={setSelectedFilter}
        relationshipTypes={filterOptions}
        theme={colors}
      />

      <AddReminderModal
        visible={addReminderModalVisible}
        onClose={() => setAddReminderModalVisible(false)}
        onReminderAdded={handleReminderAdded}
        theme={colors}
      />

      <EditReminderModal
        visible={editReminderModalVisible}
        onClose={() => {
          setEditReminderModalVisible(false);
          setSelectedReminderForEdit(null);
        }}
        onReminderUpdated={handleReminderUpdated}
        reminder={selectedReminderForEdit}
        theme={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterChipsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterChipsContent: {
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 0,
    gap: 12
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginTop: 32,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});