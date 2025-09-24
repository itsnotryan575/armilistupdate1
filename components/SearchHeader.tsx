import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { Search, Filter, Plus, Users, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterPress: () => void;
  onAddPress: () => void;
  onTitlePress: () => void;
  profileCount: number;
}

export function SearchHeader({ searchQuery, onSearchChange, onFilterPress, onAddPress, onTitlePress, profileCount }: SearchHeaderProps) {
  const { isDark, getRosterLabel } = useTheme();

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Users size={32} color={theme.text} />
        <Pressable onPress={onTitlePress} style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>My {getRosterLabel()}</Text>
          <ChevronDown size={20} color={theme.primary} style={styles.dropdownIcon} />
        </Pressable>
      </View>
      <Text style={[styles.subtitle, { color: theme.primary }]}>{profileCount} profiles</Text>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.accent, borderColor: theme.border }]}>
          <Search size={20} color={theme.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search profiles..."
            placeholderTextColor={theme.primary}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
        
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.secondary, borderColor: theme.border }]} onPress={onAddPress}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]} onPress={onFilterPress}>
          <Filter size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    letterSpacing: 0,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 8,
  },
});