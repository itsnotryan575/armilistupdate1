import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  FlatList
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MessageSquareText, Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { AddScheduledTextModal } from '@/components/AddScheduledTextModal';
import { EditScheduledTextModal } from '@/components/EditScheduledTextModal';
import { ScheduledTextCard } from '@/components/ScheduledTextCard';
import { DatabaseService } from '@/services/DatabaseService';
import { useFocusEffect } from '@react-navigation/native';
import { cancelById } from '@/services/Scheduler';

export default function SchedulerScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const [scheduledTexts, setScheduledTexts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTextForEdit, setSelectedTextForEdit] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = {
    text: '#f0f0f0',
    background: isDark ? '#0B0909' : '#003C24',
    primary: isDark ? '#8C8C8C' : '#f0f0f0',
    secondary: isDark ? '#4A5568' : '#012d1c',
    accent: isDark ? '#44444C' : '#002818',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    border: isDark ? '#333333' : '#012d1c',
    isDark,
  };

  useEffect(() => {
    loadScheduledTexts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadScheduledTexts();
      
      // Handle deep link from notification
      if (params.textId && params.action === 'edit') {
        handleDeepLinkEdit();
      }
    }, [])
  );

  // Handle deep link to edit specific scheduled text
  const handleDeepLinkEdit = async () => {
    try {
      const textId = parseInt(params.textId as string);
      if (isNaN(textId)) return;
      
      console.log('📱 Deep linking to edit scheduled text:', textId);
      const scheduledText = await DatabaseService.getScheduledTextById(textId);
      
      if (scheduledText) {
        setSelectedTextForEdit(scheduledText);
        setShowEditModal(true);
      } else {
        console.warn('Scheduled text not found for deep link:', textId);
      }
    } catch (error) {
      console.error('Error handling deep link edit:', error);
    }
  };

  const loadScheduledTexts = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getAllScheduledTexts();
      setScheduledTexts(data);
    } catch (error) {
      console.error('Error loading scheduled texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScheduledText = () => {
    setShowAddModal(true);
  };

  const handleTextScheduled = () => {
    loadScheduledTexts();
  };

  const handleTextEdit = (scheduledText: any) => {
    setSelectedTextForEdit(scheduledText);
    setShowEditModal(true);
  };

  const handleTextUpdated = () => {
    setShowEditModal(false);
    setSelectedTextForEdit(null);
    loadScheduledTexts();
  };

  const handleTextDelete = async (textId: number) => {
    try {
      // Get the scheduled text to cancel its notification
      const scheduledText = scheduledTexts.find(text => text.id === textId);
      if (scheduledText?.notificationId) {
        await cancelById(scheduledText.notificationId);
      }
      
      // Delete the scheduled text from database
      await DatabaseService.deleteScheduledText(textId);
      
      // Refresh the list
      await loadScheduledTexts();
    } catch (error) {
      console.error('Error deleting scheduled text:', error);
    }
  };

  const handleTextSnooze = async (textId: number) => {
    try {
      // Get the scheduled text to cancel its notification
      const scheduledText = scheduledTexts.find(text => text.id === textId);
      if (scheduledText?.notificationId) {
        await cancelById(scheduledText.notificationId);
      }
      
      // Calculate new date (24 hours from now)
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 1);
      newDate.setHours(9, 0, 0, 0); // 9 AM tomorrow
      
      // Update the scheduled text in database
      await DatabaseService.snoozeScheduledText(textId, newDate.toISOString());
      
      // Get the updated scheduled text and schedule a new notification
      const updatedText = await DatabaseService.getScheduledTextById(textId);
      if (updatedText) {
        const { scheduleScheduledText } = await import('@/services/Scheduler');
        const result = await scheduleScheduledText({
          messageId: updatedText.id.toString(),
          phoneNumber: updatedText.phoneNumber,
          message: updatedText.message,
          datePick: new Date(updatedText.scheduledFor),
          timePick: new Date(updatedText.scheduledFor),
        });
        
        // Update the notification ID in the database
        if (result.id) {
          await DatabaseService.updateScheduledTextNotificationId(textId, result.id);
        }
      }
      
      // Refresh the list
      await loadScheduledTexts();
    } catch (error) {
      console.error('Error snoozing scheduled text:', error);
    }
  };

  const handleMarkTextAsSent = async (textId: number) => {
    try {
      // Get the scheduled text to cancel its notification
      const scheduledText = scheduledTexts.find(text => text.id === textId);
      if (scheduledText?.notificationId) {
        await cancelById(scheduledText.notificationId);
      }
      
      // Mark the scheduled text as sent in database
      await DatabaseService.markScheduledTextAsSent(textId);
      
      // Refresh the list
      await loadScheduledTexts();
    } catch (error) {
      console.error('Error marking scheduled text as sent:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <MessageSquareText size={32} color={theme.text} />
        <Text style={[styles.title, { color: theme.text }]}>Text Scheduler</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.secondary }]}
          onPress={handleAddScheduledText}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Loading scheduled texts...</Text>
        </View>
      ) : scheduledTexts.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.accent }]}>
            <MessageSquareText size={48} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Scheduled Texts
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.primary }]}>
            Schedule text messages to send at the perfect time
          </Text>
          <TouchableOpacity
            style={[styles.emptyActionButton, { backgroundColor: theme.secondary }]}
            onPress={handleAddScheduledText}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.emptyActionButtonText}>Schedule Your First Text</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={scheduledTexts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ScheduledTextCard
              scheduledText={item}
              onEdit={handleTextEdit}
              onDelete={handleTextDelete}
              onSnooze={handleTextSnooze}
              onMarkAsSent={handleMarkTextAsSent}
              theme={theme}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddScheduledTextModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTextScheduled={handleTextScheduled}
        theme={theme}
      />

      <EditScheduledTextModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTextForEdit(null);
        }}
        onTextUpdated={handleTextUpdated}
        scheduledText={selectedTextForEdit}
        theme={theme}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingTop: 12,
    paddingBottom: 20,
  },
});