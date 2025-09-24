import React from "react";
import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ArmiIntent } from "../types/armi-intents";
import { ArmiList } from "../types/armi-intents";
import { CircleCheck as CheckCircle, X, User, MessageSquare, Bell, CreditCard as Edit } from 'lucide-react-native';

interface IntentPreviewCardProps {
  intent: ArmiIntent;
  onConfirm: (modifiedIntent?: ArmiIntent) => void;
  onCancel: () => void;
  theme: any;
}

export default function IntentPreviewCard({ intent, onConfirm, onCancel, theme }: IntentPreviewCardProps) {
  const [overrideListType, setOverrideListType] = useState<ArmiList | null>(
    (intent.intent === 'add_profile' || intent.intent === 'set_profile_list') && intent.args.listType 
      ? intent.args.listType 
      : null
  );

  const LIST_OPTIONS = [
    { key: 'Roster' as ArmiList, label: 'Roster', color: '#EC4899' },
    { key: 'Network' as ArmiList, label: 'Network', color: '#059669' },
    { key: 'People' as ArmiList, label: 'People', color: '#3B82F6' },
  ];

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
        const { name, phone, relationshipType, tags, listType } = intent.args;
        const parts = [name];
        if (phone) parts.push(`Phone: ${phone}`);
        if (relationshipType) parts.push(`Relationship: ${relationshipType}`);
        if (tags && tags.length > 0) parts.push(`Tags: ${tags.join(', ')}`);
        if (listType || overrideListType) parts.push(`List: ${overrideListType || listType}`);
        return parts.join(' • ');
      case 'edit_profile':
        const updates = Object.entries(intent.args.updates).map(([key, value]) => `${key}: ${value}`);
        return updates.join(' • ');
      case 'set_profile_list':
        return `Move to: ${overrideListType || intent.args.listType} • Profile: ${intent.args.profileName || intent.args.profileId || 'Unknown'}`;
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

  const handleConfirm = () => {
    if ((intent.intent === 'add_profile' || intent.intent === 'set_profile_list') && overrideListType) {
      // Create modified intent with override listType
      const modifiedIntent: ArmiIntent = {
        ...intent,
        args: {
          ...intent.args,
          listType: overrideListType
        }
      };
      onConfirm(modifiedIntent);
    } else {
      onConfirm();
    }
  };

  const showListOverride = (intent.intent === 'add_profile' || intent.intent === 'set_profile_list') && 
    (intent.args.listType || overrideListType);

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
      
      {/* List Override Chips */}
      {showListOverride && (
        <View style={styles.overrideSection}>
          <Text style={[styles.overrideLabel, { color: theme.primary }]}>List Assignment:</Text>
          <View style={styles.listChips}>
            {LIST_OPTIONS.map((option) => {
              const isSelected = overrideListType === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.listChip,
                    {
                      backgroundColor: isSelected ? option.color : theme.accent,
                      borderColor: theme.border,
                    }
                  ]}
                  onPress={() => setOverrideListType(option.key)}
                >
                  <Text style={[
                    styles.listChipText,
                    { color: isSelected ? '#FFFFFF' : theme.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
      
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
            onPress={handleConfirm}
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
  overrideSection: {
    marginBottom: 16,
  },
  overrideLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  listChips: {
    flexDirection: 'row',
    gap: 8,
  },
  listChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  listChipText: {
    fontSize: 12,
    fontWeight: '500',
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