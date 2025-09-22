import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, CreditCard as Edit, User, Calendar, MapPin, Heart, Briefcase, Phone, Mail, Tag } from 'lucide-react-native';
import { DatabaseService } from '../../services/DatabaseService';
import { format, parseISO } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const [profile, setProfile] = useState(null);
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
    loadProfile();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [id])
  );

  const loadProfile = async () => {
    try {
      if (id) {
        const profileData = await DatabaseService.getProfileById(parseInt(id));
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const handlePhonePress = (phone: string) => {
    Alert.alert(
      'Call',
      `Would you like to call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) }
      ]
    );
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case 'family':
        return <Heart size={20} color="#EF4444" />;
      case 'partner':
        return <Heart size={20} color="#EC4899" />;
      case 'friend':
        return <User size={20} color="#3B82F6" />;
      case 'coworker':
        return <Briefcase size={20} color="#059669" />;
      default:
        return <User size={20} color="#6B7280" />;
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'family':
        return isDark ? '#7F1D1D' : '#FEE2E2';
      case 'partner':
        return isDark ? '#831843' : '#FCE7F3';
      case 'friend':
        return isDark ? '#1E3A8A' : '#DBEAFE';
      case 'coworker':
        return isDark ? '#064E3B' : '#D1FAE5';
      default:
        return isDark ? '#374151' : '#F3F4F6';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: theme.secondary }]} 
          onPress={() => router.push(`/profile/edit/${id}`)}
        >
          <Edit size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.cardBackground }]}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
              <Text style={[styles.avatarText, { color: theme.text }]}>{getInitials(profile.name)}</Text>
            </View>
          )}
          <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
          
          <View style={[
            styles.relationshipBadge,
            { backgroundColor: getRelationshipColor(profile.relationship) }
          ]}>
            {getRelationshipIcon(profile.relationship)}
            <Text style={[styles.relationshipText, { 
              color: isDark ? '#FFFFFF' : '#374151' 
            }]}>
              {profile.relationship?.charAt(0).toUpperCase() + profile.relationship?.slice(1)}
            </Text>
          </View>

          {profile.age && (
            <Text style={[styles.age, { color: theme.primary }]}>{profile.age} years old</Text>
          )}
          
          {profile.birthday && (
            <View style={styles.infoItem}>
              <Calendar size={20} color={theme.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                Birthday: {profile.birthday.match(/^\d{2}\/\d{2}\/\d{4}$/) ? profile.birthday : formatDate(profile.birthday)}
              </Text>
            </View>
          )}
          
          {profile.lastContactDate && (
            <View style={styles.infoItem}>
              <Calendar size={20} color={theme.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                Last Contact: {formatDate(profile.lastContactDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Basic Information */}
        {(profile.job || profile.phone || profile.email || profile.age) && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Information</Text>
            
            {profile.age && (
              <View style={styles.infoItem}>
                <User size={20} color={theme.primary} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.text }]}>{profile.age} years old</Text>
              </View>
            )}
            
            {profile.job && (
              <View style={styles.infoItem}>
                <Briefcase size={20} color={theme.primary} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.text }]}>{profile.job}</Text>
              </View>
            )}
            
            {profile.phone && (
              <TouchableOpacity style={styles.infoItem} onPress={() => handlePhonePress(profile.phone)}>
                <Phone size={20} color={theme.primary} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.text }]}>{profile.phone}</Text>
              </TouchableOpacity>
            )}
            
            {profile.email && (
              <View style={styles.infoItem}>
                <Mail size={20} color={theme.primary} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: theme.text }]}>{profile.email}</Text>
              </View>
            )}
          </View>
        )}

        {/* Family Information */}
        {((profile.parents && profile.parents.length > 0) || (profile.kids && profile.kids.length > 0) || (profile.siblings && profile.siblings.length > 0) || (profile.brothers && profile.brothers.length > 0) || (profile.sisters && profile.sisters.length > 0)) && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Family</Text>
            
            {profile.parents && profile.parents.length > 0 && (
              <View style={styles.infoItem}>
                <User size={20} color="#8B5CF6" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Parents:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.parents.join(', ')}</Text>
                </View>
              </View>
            )}
            
            {profile.kids && profile.kids.length > 0 && (
              <View style={styles.infoItem}>
                <Heart size={20} color="#EC4899" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Children:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.kids.join(', ')}</Text>
                </View>
              </View>
            )}
            
            {profile.brothers && profile.brothers.length > 0 && (
              <View style={styles.infoItem}>
                <User size={20} color="#3B82F6" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Brothers:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.brothers.join(', ')}</Text>
                </View>
              </View>
            )}
            
            {profile.sisters && profile.sisters.length > 0 && (
              <View style={styles.infoItem}>
                <User size={20} color="#EC4899" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Sisters:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.sisters.join(', ')}</Text>
                </View>
              </View>
            )}
            
            {profile.siblings && profile.siblings.length > 0 && (
              <View style={styles.infoItem}>
                <User size={20} color="#6B7280" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Siblings:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.siblings.join(', ')}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Preferences */}
        {((profile.foodLikes && profile.foodLikes.length > 0) || (profile.foodDislikes && profile.foodDislikes.length > 0) || (profile.interests && profile.interests.length > 0)) && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
            
            {(profile.foodLikes && profile.foodLikes.length > 0) && (
              <View style={styles.infoItem}>
                <Heart size={20} color="#059669" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Likes:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>
                    {profile.foodLikes.join(', ')}
                  </Text>
                </View>
              </View>
            )}
            
            {(profile.foodDislikes && profile.foodDislikes.length > 0) && (
              <View style={styles.infoItem}>
                <Heart size={20} color="#EF4444" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Dislikes:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>
                    {profile.foodDislikes.join(', ')}
                  </Text>
                </View>
              </View>
            )}
            
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.infoItem}>
                <Heart size={20} color="#3B82F6" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Interests:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.interests.join(', ')}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Socials */}
        {(profile.instagram || profile.snapchat || profile.twitter || profile.tiktok || profile.facebook) && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Socials</Text>
            
            {profile.instagram && (
              <View style={styles.infoItem}>
                <User size={20} color="#E4405F" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Instagram:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.instagram}</Text>
                </View>
              </View>
            )}
            
            {profile.snapchat && (
              <View style={styles.infoItem}>
                <User size={20} color="#FFFC00" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Snapchat:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.snapchat}</Text>
                </View>
              </View>
            )}
            
            {profile.twitter && (
              <View style={styles.infoItem}>
                <User size={20} color="#1DA1F2" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>X (Twitter):</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.twitter}</Text>
                </View>
              </View>
            )}
            
            {profile.tiktok && (
              <View style={styles.infoItem}>
                <User size={20} color="#000000" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>TikTok:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.tiktok}</Text>
                </View>
              </View>
            )}
            
            {profile.facebook && (
              <View style={styles.infoItem}>
                <User size={20} color="#1877F2" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.primary }]}>Facebook:</Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>{profile.facebook}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    borderRadius: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  relationshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  relationshipText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  age: {
    fontSize: 16,
    marginBottom: 8,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});