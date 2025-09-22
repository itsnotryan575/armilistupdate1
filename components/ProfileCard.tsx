import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { User, Calendar, MapPin, Heart, Phone, Trash2, Tag } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

interface Profile {
  id: number;
  name: string;
  age?: number;
  relationship: string;
  job?: string;
  photoUri?: string;
  lastContactDate?: string;
  notes?: string;
  kids?: any[];
  phone?: string;
  likes?: any[];
}

interface ProfileCardProps {
  profile: Profile;
  onPress: () => void;
  onDelete: (profileId: number) => void;
  theme: any;
}

export function ProfileCard({ profile, onPress, onDelete, theme }: ProfileCardProps) {
  const translateX = new Animated.Value(0);
  const [isSwipeActive, setIsSwipeActive] = React.useState(false);

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case 'family':
        return <Heart size={16} color="#EF4444" />;
      case 'partner':
        return <Heart size={16} color="#EC4899" />;
      case 'friend':
        return <User size={16} color="#3B82F6" />;
      case 'coworker':
        return <User size={16} color="#059669" />;
      default:
        return <User size={16} color="#6B7280" />;
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'family':
        return theme.isDark ? '#7F1D1D' : '#FEE2E2';
      case 'partner':
        return theme.isDark ? '#831843' : '#FCE7F3';
      case 'friend':
        return theme.isDark ? '#1E3A8A' : '#DBEAFE';
      case 'coworker':
        return theme.isDark ? '#064E3B' : '#D1FAE5';
      default:
        return theme.isDark ? '#374151' : '#F3F4F6';
    }
  };

  const formatLastContact = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM d');
    } catch {
      return null;
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        // Prevent right swipe by clamping values
        const { translationX: tx } = event.nativeEvent;
        if (tx > 0) {
          translateX.setValue(0);
        }
      }
    }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationX } = event.nativeEvent;
    
    if (state === State.END || state === State.CANCELLED) {
      if (translationX < -50) {
        // Show delete button - swipe threshold reached
        setIsSwipeActive(true);
        Animated.timing(translateX, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // Hide delete button - not enough swipe or wrong direction
        setIsSwipeActive(false);
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } else if (state === State.ACTIVE && translationX < -30) {
      // Provide visual feedback during active swipe
      if (!isSwipeActive && translationX < -50) {
        setIsSwipeActive(true);
      }
    } else if (state === State.ACTIVE && translationX < -60) {
      // Provide haptic feedback when threshold is reached (mobile only)
      // This helps users know they've reached the delete threshold
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${profile.name}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Reset swipe position
            setIsSwipeActive(false);
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(profile.id);
            // Reset swipe position
            setIsSwipeActive(false);
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.swipeContainer}>
      {isSwipeActive && (
        <View style={[styles.deleteButtonContainer, { backgroundColor: '#EF4444' }]}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-15, 15]}
        failOffsetY={[-10, 10]}
        shouldCancelWhenOutside={false}
        enableTrackpadTwoFingerGesture={false}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <TouchableOpacity 
            style={[styles.container, { backgroundColor: theme.cardBackground }]} 
            onPress={onPress}
            disabled={isSwipeActive}
          >
            <View>
              <View style={styles.header}>
                <View style={styles.profileInfo}>
                  {profile.photoUri ? (
                    <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                      <User size={20} color={theme.primary} />
                    </View>
                  )}
                  
                  <View style={styles.nameContainer}>
                    <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
                    {profile.age && (
                      <Text style={[styles.age, { color: theme.primary }]}>{profile.age} years old</Text>
                    )}
                  </View>
                </View>

                <View style={[
                  styles.relationshipBadge,
                  { backgroundColor: getRelationshipColor(profile.relationship) }
                ]}>
                  {getRelationshipIcon(profile.relationship)}
                  <Text style={[styles.relationshipText, { 
                    color: theme.isDark ? '#FFFFFF' : '#374151' 
                  }]}>
                    {profile.relationship.charAt(0).toUpperCase() + profile.relationship.slice(1)}
                  </Text>
                </View>
              </View>

              {profile.job && (
                <View style={styles.jobContainer}>
                  <MapPin size={14} color={theme.primary} />
                  <Text style={[styles.jobText, { color: theme.primary }]}>{profile.job}</Text>
                </View>
              )}

              {profile.notes && (
                <Text style={[styles.notes, { color: theme.text }]} numberOfLines={2}>
                  {profile.notes}
                </Text>
              )}

              {/* Additional Info Row */}
              <View style={styles.additionalInfo}>
                {profile.tags && profile.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {profile.tags.slice(0, 2).map((tag, index) => (
                      <View key={index} style={[
                        styles.tagChip, 
                        { 
                          backgroundColor: theme.isDark 
                            ? (typeof tag === 'object' && tag.color ? tag.color.dark : theme.accent)
                            : (typeof tag === 'object' && tag.color ? tag.color.light : theme.accent)
                        }
                      ]}>
                        <Tag size={10} color={
                          theme.isDark ? '#FFFFFF' : 
                          (typeof tag === 'object' && tag.color ? tag.color.text : theme.text)
                        } />
                        <Text style={[
                          styles.tagChipText, 
                          { 
                            color: theme.isDark ? '#FFFFFF' : 
                            (typeof tag === 'object' && tag.color ? tag.color.text : theme.primary)
                          }
                        ]}>
                          {typeof tag === 'string' ? tag : tag.text}
                        </Text>
                      </View>
                    ))}
                    {profile.tags.length > 2 && (
                      <View style={[styles.tagChip, { backgroundColor: theme.accent }]}>
                        <Text style={[styles.tagChipText, { color: theme.isDark ? '#FFFFFF' : theme.primary }]}>
                          +{profile.tags.length - 2}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                
                {profile.kids && profile.kids.length > 0 && (
                  <View style={styles.infoChip}>
                    <Heart size={12} color="#EC4899" />
                    <Text style={[styles.infoChipText, { color: theme.primary }]}>
                      {profile.kids.length} kid{profile.kids.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                
                {profile.phone && (
                  <View style={styles.infoChip}>
                    <Phone size={12} color="#3B82F6" />
                    <Text style={[styles.infoChipText, { color: theme.primary }]}>
                      {profile.phone}
                    </Text>
                  </View>
                )}
                
                {profile.likes && profile.likes.length > 0 && (
                  <View style={styles.infoChip}>
                    <Heart size={12} color="#059669" />
                    <Text style={[styles.infoChipText, { color: theme.primary }]}>
                      {profile.likes.length} like{profile.likes.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.footer}>
                {formatLastContact(profile.lastContactDate) && (
                  <View style={styles.lastContact}>
                    <Calendar size={14} color={theme.primary} />
                    <Text style={[styles.lastContactText, { color: theme.primary }]}>
                      Last contact: {formatLastContact(profile.lastContactDate)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 12,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    backgroundColor: 'transparent',
  },
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  age: {
    fontSize: 14,
  },
  relationshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relationshipText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  jobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobText: {
    fontSize: 14,
    marginLeft: 6,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastContactText: {
    fontSize: 12,
    marginLeft: 4,
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 4,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 3,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  infoChipText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
});