import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ArmiIntent } from "../types/armi-intents";
import { CircleCheck as CheckCircle, X, User, MessageSquare, Bell, CreditCard as Edit } from 'lucide-react-native';

interface IntentPreviewCardProps {
  intent: ArmiIntent;
  onConfirm: () => void;
  onCancel: () => void;
  theme: any;
}

export default function IntentPreviewCard({ intent, onConfirm, onCancel, theme }: IntentPreviewCardProps) {
  const getIntentIcon = () => {
    switch (intent.intent) {
      case 'add_profile':
        return <User size={20} color="#3B82F6" />;
      case 'edit_profile':
        return <Edit size={20} color="#F59E0B" />;
      case 'schedule_text':
        return <MessageSquare size={20} color="#8B5CF6" />;
      case 'schedule_reminder':
        return <Bell size={20} color="#059669" />;
      default:
        return <X size={20} color="#EF4444" />;
    }
  };

  const getIntentTitle = () => {
    switch (intent.intent) {
      case 'add_profile':
        return `Add ${intent.args.name} to contacts`;
      case 'edit_profile':
        return `Edit ${intent.args.profileName || 'profile'}`;
      case 'schedule_text':
        return `Schedule text message`;
      case 'schedule_reminder':
        return `Schedule reminder`;
      case 'none':
        return 'No action recognized';
      default:
        return 'Unknown action';
    }
  };

  const getIntentDescription = () => {
    switch (intent.intent) {
      case 'add_profile':
        const { name, phone, relationshipType, tags } = intent.args;
        const parts = [name];
        if (phone) parts.push(`Phone: ${phone}`);
        if (relationshipType) parts.push(`Relationship: ${relationshipType}`);
        if (tags && tags.length > 0) parts.push(`Tags: ${tags.join(', ')}`);
        return parts.join(' • ');
      case 'edit_profile':
        const updates = Object.entries(intent.args.updates).map(([key, value]) => `${key}: ${value}`);
        return updates.join(' • ');
      case 'schedule_text':
        return `To: ${intent.args.profileName || 'Unknown'} • When: ${intent.args.when} • Message: "${intent.args.message}"`;
      case 'schedule_reminder':
        return `About: ${intent.args.profileName || 'General'} • When: ${intent.args.when} • ${intent.args.reason || 'No reason specified'}`;
      case 'none':
        return intent.args.explanation;
      default:
        return 'Unknown action';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {getIntentIcon()}
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>AI Recognized</Text>
          <Text style={[styles.subtitle, { color: theme.primary }]}>{getIntentTitle()}</Text>
        </View>
      </View>
      
      <Text style={[styles.description, { color: theme.text }]}>
        {getIntentDescription()}
      </Text>
      
      {intent.intent !== 'none' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
            onPress={onCancel}
          >
            <X size={16} color={theme.text} />
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.confirmButton, { backgroundColor: theme.secondary }]}
            onPress={onConfirm}
          >
            <CheckCircle size={16} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {intent.intent === 'none' && (
        <TouchableOpacity 
          style={[styles.dismissButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
          onPress={onCancel}
        >
          <Text style={[styles.dismissButtonText, { color: theme.text }]}>Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});