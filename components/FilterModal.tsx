import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFilter: string;
  selectedTagFilter: string;
  onFilterSelect: (filter: string) => void;
  onTagFilterSelect: (filter: string) => void;
  relationshipTypes: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  tagTypes: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  theme: any;
}

export function FilterModal({ 
  visible, 
  onClose, 
  selectedFilter, 
  selectedTagFilter, 
  onFilterSelect, 
  onTagFilterSelect, 
  relationshipTypes = [], 
  tagTypes = [], 
  theme 
}: FilterModalProps) {
  const handleFilterSelect = (filterKey: string) => {
    onFilterSelect(filterKey);
  };

  const handleTagFilterSelect = (filterKey: string) => {
    onTagFilterSelect(filterKey);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Relationship Type</Text>
            {relationshipTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[styles.filterOption, { borderBottomColor: theme.border }]}
                onPress={() => {
                  handleFilterSelect(type.key);
                  onClose();
                }}
              >
                <View style={styles.filterOptionLeft}>
                  <Text style={[styles.filterOptionText, { color: theme.text }]}>
                    {type.label}
                  </Text>
                  <Text style={[styles.filterOptionCount, { color: theme.primary }]}>
                    {type.count} contacts
                  </Text>
                </View>
                {selectedFilter === type.key && (
                  <Check size={20} color={theme.secondary} />
                )}
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Tag Filter</Text>
            {tagTypes.map((type) => (
              <TouchableOpacity
                key={`tag-${type.key}`}
                style={[styles.filterOption, { borderBottomColor: theme.border }]}
                onPress={() => {
                  handleTagFilterSelect(type.key);
                  onClose();
                }}
              >
                <View style={styles.filterOptionLeft}>
                  <Text style={[styles.filterOptionText, { color: theme.text }]}>
                    {type.label}
                  </Text>
                  <Text style={[styles.filterOptionCount, { color: theme.primary }]}>
                    {type.count} contacts
                  </Text>
                </View>
                {selectedTagFilter === type.key && (
                  <Check size={20} color={theme.secondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterOptionLeft: {
    flex: 1,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  filterOptionCount: {
    fontSize: 14,
  },
});