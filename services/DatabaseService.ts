import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import NotificationService from './NotificationService';
import { AuthService } from './AuthService';

class DatabaseServiceClass {
  private db: SQLite.SQLiteDatabase | null = null;
  private readyPromise: Promise<void> | null = null;
  private isWebFallback: boolean = false;
  private supabase: any | null = null;
  async init() {
    if (this.readyPromise) return this.readyPromise; // Already initializing or initialized
    
    this.readyPromise = this.initializeDatabase();
    return this.readyPromise;
  }

  private async initializeDatabase() {
    // Make sure Supabase client is available regardless of platform
  await AuthService.init();
  this.supabase = (AuthService as any).supabase ?? null;

    // Skip SQLite initialization on web platform
    if (Platform.OS === 'web') {
      console.log('Web platform detected - using mock data fallback');
      this.isWebFallback = true;
      return;
    }
    
    try {
      console.log('Opening database...');
      this.db = await SQLite.openDatabaseAsync('armi.db');
      console.log('Database opened, creating tables...');
      // Create tables FIRST, then run migrations
      await this.createTables();
      console.log('Tables created successfully, running migrations...');
      await this.migrateDatabase();
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      if (error instanceof Error && error.message.includes('unable to open database file')) {
        console.log('Entering web fallback mode - using mock data');
        this.isWebFallback = true;
        // Don't throw error, allow app to continue with mock data
      } else {
        this.readyPromise = null; // Reset on error so init can be retried
        throw error;
      }
    }
  }

  getIsWebFallback(): boolean {
    return this.isWebFallback;
  }

  private async ensureReady() {
    if (!this.readyPromise) {
      await this.init();
    } else {
      await this.readyPromise;
    }
  }

  private async createTables() {
    if (!this.db) return;

    try {
      // Profiles table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          age INTEGER,
          phone TEXT,
          email TEXT,
          relationship TEXT,
          job TEXT,
          notes TEXT,
          tags TEXT,
          photoUri TEXT,
          parents TEXT,
          kids TEXT,
          brothers TEXT,
          sisters TEXT,
          siblings TEXT,
          pets TEXT,
          foodLikes TEXT,
          foodDislikes TEXT,
          interests TEXT,
          instagram TEXT,
          snapchat TEXT,
          twitter TEXT,
          tiktok TEXT,
          facebook TEXT,
          birthday TEXT,
          birthdayTextEnabled INTEGER DEFAULT 0,
          birthdayTextScheduledTextId INTEGER,
          giftReminderEnabled INTEGER DEFAULT 0,
          giftReminderId INTEGER,
          lastContactDate TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Interactions table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profileId INTEGER,
          description TEXT NOT NULL,
          extractedData TEXT,
          type TEXT DEFAULT 'conversation',
          location TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (profileId) REFERENCES profiles (id)
        );
      `);

      // Reminders table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profileId INTEGER,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT DEFAULT 'general',
          scheduledFor TEXT NOT NULL,
          completed INTEGER DEFAULT 0,
          completedAt TEXT,
          notificationId TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (profileId) REFERENCES profiles (id)
        );
      `);

      // Life events table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS life_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profileId INTEGER,
          eventType TEXT NOT NULL,
          description TEXT,
          eventDate TEXT,
          importance INTEGER DEFAULT 1,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (profileId) REFERENCES profiles (id)
        );
      `);

      // Feedback table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          userEmail TEXT,
          deviceInfo TEXT,
          appVersion TEXT,
          status TEXT DEFAULT 'open',
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Scheduled texts table
      await this.db!.execAsync(`
        CREATE TABLE IF NOT EXISTS scheduled_texts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profileId INTEGER,
          phoneNumber TEXT NOT NULL,
          message TEXT NOT NULL,
          scheduledFor TEXT NOT NULL,
          sent INTEGER DEFAULT 0,
          notificationId TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (profileId) REFERENCES profiles (id)
        );
      `);
      
      console.log('All tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  private async migrateDatabase() {
    if (!this.db) return;

    try {
      // Check existing columns in profiles table
      const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(profiles)`);
      const existingColumns = new Set(tableInfo.map((col: any) => col.name));
      console.log('DB Migration: Existing profile columns:', Array.from(existingColumns).join(', '));
      
      // Define all columns that should exist
      const requiredColumns = [
        { name: 'parents', definition: 'TEXT' },
        { name: 'brothers', definition: 'TEXT' },
        { name: 'sisters', definition: 'TEXT' },
        { name: 'instagram', definition: 'TEXT' },
        { name: 'snapchat', definition: 'TEXT' },
        { name: 'twitter', definition: 'TEXT' },
        { name: 'tiktok', definition: 'TEXT' },
        { name: 'facebook', definition: 'TEXT' },
        { name: 'birthday', definition: 'TEXT' },
        { name: 'birthdayTextEnabled', definition: 'INTEGER DEFAULT 0' },
        { name: 'birthdayTextScheduledTextId', definition: 'INTEGER' },
        { name: 'giftReminderEnabled', definition: 'INTEGER DEFAULT 0' },
        { name: 'giftReminderId', definition: 'INTEGER' },
      ];
      
      // Add missing columns individually with error handling
      for (const column of requiredColumns) {
        if (!existingColumns.has(column.name)) {
          try {
            console.log(`DB Migration: Adding column ${column.name} ${column.definition}`);
            await this.db.execAsync(`ALTER TABLE profiles ADD COLUMN ${column.name} ${column.definition}`);
            console.log(`DB Migration: Successfully added column ${column.name}`);
          } catch (columnError) {
            console.error(`DB Migration: Failed to add column ${column.name}:`, columnError);
            // Continue with other columns even if one fails
          }
        } else {
          console.log(`DB Migration: Column ${column.name} already exists`);
        }
      }
    } catch (error) {
      // If profiles table doesn't exist yet, that's fine - it will be created
      console.log('DB Migration: Skipped - profiles table does not exist yet');
    }
  }

  async getAllProfiles() {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      return [
        {
          id: 1,
          name: 'John Doe',
          age: 30,
          phone: '+1234567890',
          email: 'john@example.com',
          relationship: 'Friend',
          job: 'Software Engineer',
          notes: 'Met at conference last year',
          tags: ['tech', 'colleague'],
          photoUri: null,
          kids: [],
          siblings: ['Jane Doe'],
          pets: ['Max (dog)'],
          foodLikes: ['pizza', 'sushi'],
          foodDislikes: ['mushrooms'],
          interests: ['coding', 'hiking'],
          birthday: '1994-05-15',
          lastContactDate: '2024-01-15',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-15T00:00:00.000Z'
        },
        {
          id: 2,
          name: 'Sarah Smith',
          age: 28,
          phone: '+1987654321',
          email: 'sarah@example.com',
          relationship: 'Colleague',
          job: 'Designer',
          notes: 'Great at UI/UX design',
          tags: ['design', 'creative'],
          photoUri: null,
          kids: [],
          siblings: [],
          pets: ['Luna (cat)'],
          foodLikes: ['pasta', 'salads'],
          foodDislikes: ['spicy food'],
          interests: ['art', 'photography'],
          birthday: '1996-03-22',
          lastContactDate: '2024-01-10',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-10T00:00:00.000Z'
        }
      ];
    }
    
    const result = await this.db!.getAllAsync('SELECT * FROM profiles ORDER BY updatedAt DESC');
    return result.map(profile => ({
      ...profile,
      tags: profile.tags ? JSON.parse(profile.tags) : [],
      parents: profile.parents ? JSON.parse(profile.parents) : [],
      kids: profile.kids ? JSON.parse(profile.kids) : [],
      brothers: profile.brothers ? JSON.parse(profile.brothers) : [],
      sisters: profile.sisters ? JSON.parse(profile.sisters) : [],
      siblings: profile.siblings ? JSON.parse(profile.siblings) : [],
      pets: profile.pets ? JSON.parse(profile.pets) : [],
      foodLikes: profile.foodLikes ? JSON.parse(profile.foodLikes) : [],
      foodDislikes: profile.foodDislikes ? JSON.parse(profile.foodDislikes) : [],
      interests: profile.interests ? JSON.parse(profile.interests) : [],
    }));
  }

  async getProfileById(id: number) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      const mockProfiles = await this.getAllProfiles();
      return mockProfiles.find(profile => profile.id === id) || null;
    }
    
    const result = await this.db!.getFirstAsync('SELECT * FROM profiles WHERE id = ?', [id]);
    if (!result) return null;
    
    return {
      ...result,
      tags: result.tags ? JSON.parse(result.tags) : [],
      parents: result.parents ? JSON.parse(result.parents) : [],
      kids: result.kids ? JSON.parse(result.kids) : [],
      brothers: result.brothers ? JSON.parse(result.brothers) : [],
      sisters: result.sisters ? JSON.parse(result.sisters) : [],
      siblings: result.siblings ? JSON.parse(result.siblings) : [],
      pets: result.pets ? JSON.parse(result.pets) : [],
      foodLikes: result.foodLikes ? JSON.parse(result.foodLikes) : [],
      foodDislikes: result.foodDislikes ? JSON.parse(result.foodDislikes) : [],
      interests: result.interests ? JSON.parse(result.interests) : [],
    };
  }

  async logProfileDataForCollection(profileData: any, operationType: 'create' | 'update', profileId?: number) {
    console.log('🔍 DEBUG: logProfileDataForCollection called with:', {
      operationType,
      profileId,
      hasProfileData: !!profileData,
      authServiceAvailable: true
    });
    
    try {
      // Get current user session from AuthService
      const session = await AuthService.getSession();
      console.log('🔍 DEBUG: Session check result:', {
        hasSession: !!session,
        hasUser: !!session?.user?.id,
        userId: session?.user?.id || 'none'
      });
      
      if (!session?.user?.id) {
        console.log('No authenticated user - skipping profile data collection');
        return;
      }

      // Get Supabase client from AuthService
      await AuthService.init();
      const supabase = (AuthService as any).supabase;
      
      if (!supabase) {
        console.log('Supabase client not available - skipping profile data collection');
        return;
      }

      // Prepare the data to collect
      const collectionData = {
        user_id: session.user.id,
        profile_data: {
          ...profileData,
          // Add metadata for developer reference
          _metadata: {
            platform: Platform.OS,
            timestamp: new Date().toISOString(),
            app_version: '1.0.0'
          }
        },
        operation_type: operationType,
        profile_id: profileId || null,
      };

      console.log('🔍 DEBUG: About to insert data to Supabase:', {
        user_id: collectionData.user_id,
        operation_type: collectionData.operation_type,
        profile_id: collectionData.profile_id,
        dataKeys: Object.keys(collectionData.profile_data)
      });

      // Insert into Supabase
      const { error } = await supabase
        .from('collected_profiles_data')
        .insert([collectionData]);

      if (error) {
        console.error('Failed to log profile data for collection:', error);
        console.error('🔍 DEBUG: Full Supabase error details:', JSON.stringify(error, null, 2));
      } else {
        console.log(`Profile data logged for collection: ${operationType} operation`);
        console.log('🔍 DEBUG: Successfully inserted data to Supabase');
      }
    } catch (error) {
      console.error('Error logging profile data for collection:', error);
      console.error('🔍 DEBUG: Full error details:', JSON.stringify(error, null, 2));
    }
  }

  async createOrUpdateProfile(profileData: any) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Profile operation simulated');
      const mockId = profileData.id || Math.floor(Math.random() * 1000) + 3;
      // Still log data collection even in web fallback mode
      await this.logProfileDataForCollection(profileData, profileData.id ? 'update' : 'create', mockId);
      return mockId;
    }
    
    const {
      id,
      name,
      age,
      phone,
      email,
      relationship,
      job,
      notes,
      tags = [],
      photoUri,
      parents = [],
      kids = [],
      brothers = [],
      sisters = [],
      siblings = [],
      pets = [],
      foodLikes = [],
      foodDislikes = [],
      interests = [],
      instagram,
      snapchat,
      twitter,
      tiktok,
      facebook,
      birthday,
      lastContactDate,
      birthdayTextEnabled = 0,
      birthdayTextScheduledTextId = null,
      giftReminderEnabled = 0,
      giftReminderId = null
    } = profileData;

    const now = new Date().toISOString();
    
    if (id) {
      // Update existing profile
      await this.db!.runAsync(`
        UPDATE profiles SET
          name = ?, age = ?, phone = ?, email = ?, relationship = ?,
          job = ?, notes = ?, tags = ?, photoUri = ?, parents = ?, kids = ?, brothers = ?, sisters = ?, siblings = ?, pets = ?, foodLikes = ?, foodDislikes = ?,
          interests = ?, instagram = ?, snapchat = ?, twitter = ?, tiktok = ?, facebook = ?, birthday = ?, lastContactDate = ?, 
          birthdayTextEnabled = ?, birthdayTextScheduledTextId = ?, giftReminderEnabled = ?, giftReminderId = ?, updatedAt = ?
        WHERE id = ?
      `, [
        name, age, phone, email, relationship, job, notes,
        JSON.stringify(tags), photoUri, JSON.stringify(parents), JSON.stringify(kids), JSON.stringify(brothers), JSON.stringify(sisters), JSON.stringify(siblings), JSON.stringify(pets),
        JSON.stringify(foodLikes), JSON.stringify(foodDislikes),
        JSON.stringify(interests), instagram, snapchat, twitter, tiktok, facebook, birthday, lastContactDate,
        birthdayTextEnabled ? 1 : 0, birthdayTextScheduledTextId, giftReminderEnabled ? 1 : 0, giftReminderId, now, id
      ]);
      
      // Log profile data for developer collection
      console.log('🔍 DEBUG: About to call logProfileDataForCollection for UPDATE operation');
      await this.logProfileDataForCollection(profileData, 'update', id);
      return id;
    } else {
      // Create new profile
      const result = await this.db!.runAsync(`
        INSERT INTO profiles (
          name, age, phone, email, relationship, job, notes, tags, photoUri, parents, kids, brothers, sisters, siblings, pets, foodLikes, foodDislikes,
          interests, instagram, snapchat, twitter, tiktok, facebook, birthday, lastContactDate,
          birthdayTextEnabled, birthdayTextScheduledTextId, giftReminderEnabled, giftReminderId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, age, phone, email, relationship, job, notes,
        JSON.stringify(tags), photoUri, JSON.stringify(parents), JSON.stringify(kids), JSON.stringify(brothers), JSON.stringify(sisters), JSON.stringify(siblings), JSON.stringify(pets),
        JSON.stringify(foodLikes), JSON.stringify(foodDislikes),
        JSON.stringify(interests), instagram, snapchat, twitter, tiktok, facebook, birthday, lastContactDate,
        birthdayTextEnabled, birthdayTextScheduledTextId, giftReminderEnabled, giftReminderId, now, now
      ]);
      
      const newProfileId = result.lastInsertRowId;
      
      // Log profile data for developer collection
      console.log('🔍 DEBUG: About to call logProfileDataForCollection for CREATE operation');
      await this.logProfileDataForCollection(profileData, 'create', newProfileId);
      
      return newProfileId;
    }
  }

  async addInteraction(interactionData: any) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Interaction operation simulated');
      return Math.floor(Math.random() * 1000) + 1;
    }
    
    const { profileId, description, extractedData, type = 'conversation', location } = interactionData;
    const now = new Date().toISOString();
    
    const result = await this.db!.runAsync(`
      INSERT INTO interactions (profileId, description, extractedData, type, location, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [profileId, description, extractedData, type, location, now]);
    
    return result.lastInsertRowId;
  }

  async getAllReminders() {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      return [
        {
          id: 1,
          profileId: 1,
          title: 'Follow up with John',
          description: 'Check on his new project',
          type: 'followup',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          completed: 0,
          completedAt: null,
          notificationId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          profileName: 'John Doe',
          profilePhoto: null
        },
        {
          id: 2,
          profileId: 2,
          title: 'Birthday reminder',
          description: "Sarah's birthday is coming up",
          type: 'birthday',
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          completed: 0,
          completedAt: null,
          notificationId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          profileName: 'Sarah Smith',
          profilePhoto: null
        }
      ];
    }
    
    const result = await this.db!.getAllAsync(`
      SELECT r.*, p.name as profileName, p.photoUri as profilePhoto
      FROM reminders r
      LEFT JOIN profiles p ON r.profileId = p.id
      ORDER BY r.scheduledFor ASC
    `);
    
    return result;
  }

  async createReminder(reminderData: any) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Reminder operation simulated');
      return Math.floor(Math.random() * 1000) + 1;
    }
    
    const { profileId, title, description, type = 'general', scheduledFor } = reminderData;
    // Convert Date object to ISO string for database storage
    const scheduledForISO = scheduledFor instanceof Date ? scheduledFor.toISOString() : scheduledFor;
    const now = new Date().toISOString();
    
    const result = await this.db!.runAsync(`
      INSERT INTO reminders (profileId, title, description, type, scheduledFor, createdAt, notificationId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [profileId, title, description, type, scheduledForISO, now, null]);
    
    return result.lastInsertRowId;
  }

  async completeReminder(reminderId: number) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Complete reminder operation simulated');
      return;
    }
    
    const now = new Date().toISOString();
    await this.db!.runAsync(`
      UPDATE reminders SET completed = 1, completedAt = ? WHERE id = ?
    `, [now, reminderId]);
  }

  async snoozeReminder(reminderId: number, newDate: string) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Snooze reminder operation simulated');
      return;
    }
    
    // Convert Date string to ISO string for database storage
    const newDateISO = new Date(newDate).toISOString();
    
    await this.db!.runAsync(`
      UPDATE reminders SET scheduledFor = ? WHERE id = ?
    `, [newDateISO, reminderId]);
  }

  async updateReminderNotificationId(reminderId: number, notificationId: string | null) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Update notification ID operation simulated');
      return;
    }
    
    await this.db!.runAsync(`
      UPDATE reminders SET notificationId = ? WHERE id = ?
    `, [notificationId, reminderId]);
  }

  async updateReminder(reminderData: any) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Update reminder operation simulated');
      return;
    }
    
    const { id, title, description, type, profileId, scheduledFor } = reminderData;
    // Convert Date object to ISO string for database storage only
    const scheduledForISO = scheduledFor.toISOString();
    
    await this.db!.runAsync(`
      UPDATE reminders SET 
        title = ?, 
        description = ?, 
        type = ?, 
        profileId = ?, 
        scheduledFor = ?
      WHERE id = ?
    `, [title, description, type, profileId, scheduledForISO, id]);
  }

  async getReminderById(reminderId: number) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      const mockReminders = await this.getAllReminders();
      return mockReminders.find(reminder => reminder.id === reminderId) || null;
    }
    
    const result = await this.db!.getFirstAsync(`
      SELECT r.*, p.name as profileName, p.photoUri as profilePhoto
      FROM reminders r
      LEFT JOIN profiles p ON r.profileId = p.id
      WHERE r.id = ?
    `, [reminderId]);
    
    return result;
  }

  async deleteReminder(reminderId: number) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Delete reminder operation simulated');
      return;
    }
    
    await this.db!.runAsync('DELETE FROM reminders WHERE id = ?', [reminderId]);
  }

  async deleteProfile(profileId: number) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Delete profile operation simulated');
      return;
    }
    
    // Delete associated reminders first
    await this.db!.runAsync('DELETE FROM reminders WHERE profileId = ?', [profileId]);
    
    // Delete associated interactions
    await this.db!.runAsync('DELETE FROM interactions WHERE profileId = ?', [profileId]);
    
    // Delete associated life events
    await this.db!.runAsync('DELETE FROM life_events WHERE profileId = ?', [profileId]);
    
    // Finally delete the profile
    await this.db!.runAsync('DELETE FROM profiles WHERE id = ?', [profileId]);
  }

  async createScheduledText(textData: any) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Scheduled text operation simulated');
      return Math.floor(Math.random() * 1000) + 1;
    }
    
    const { profileId, phoneNumber, message, scheduledFor } = textData;
    // Convert Date object to ISO string for database storage
    const scheduledForISO = scheduledFor instanceof Date ? scheduledFor.toISOString() : scheduledFor;
    const now = new Date().toISOString();
    
    const result = await this.db!.runAsync(`
      INSERT INTO scheduled_texts (profileId, phoneNumber, message, scheduledFor, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [profileId, phoneNumber, message, scheduledForISO, now, now]);
    
    return result.lastInsertRowId;
  }

  async getAllScheduledTexts() {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      return [
        {
          id: 1,
          profileId: 1,
          phoneNumber: '+1234567890',
          message: 'Hey! How are you doing?',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          sent: 0,
          notificationId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          profileName: 'John Doe',
          profilePhoto: null
        }
      ];
    }
    
    const result = await this.db!.getAllAsync(`
      SELECT st.*, p.name as profileName, p.photoUri as profilePhoto
      FROM scheduled_texts st
      LEFT JOIN profiles p ON st.profileId = p.id
      ORDER BY st.scheduledFor ASC
    `);
    
    return result.map(text => ({
      ...text,
      sent: Boolean(text.sent)
    }));
  }

  async updateScheduledTextNotificationId(textId: number, notificationId: string | null) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Update scheduled text notification ID operation simulated');
      return;
    }
    
    await this.db!.runAsync(`
      UPDATE scheduled_texts SET notificationId = ? WHERE id = ?
    `, [notificationId, textId]);
  }

  async markScheduledTextAsSent(textId: number) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Mark scheduled text as sent operation simulated');
      return;
    }
    
    const now = new Date().toISOString();
    await this.db!.runAsync(`
      UPDATE scheduled_texts SET sent = 1, updatedAt = ? WHERE id = ?
    `, [now, textId]);
  }

  async snoozeScheduledText(textId: number, newDate: string) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Snooze scheduled text operation simulated');
      return;
    }
    
    const now = new Date().toISOString();
    await this.db!.runAsync(`
      UPDATE scheduled_texts SET scheduledFor = ?, updatedAt = ? WHERE id = ?
    `, [newDate, now, textId]);
  }

  async deleteScheduledText(textId: number) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Delete scheduled text operation simulated');
      return;
    }
    
    await this.db!.runAsync('DELETE FROM scheduled_texts WHERE id = ?', [textId]);
  }

  async getScheduledTextById(textId: number) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      const mockTexts = await this.getAllScheduledTexts();
      return mockTexts.find(text => text.id === textId) || null;
    }
    
    const result = await this.db!.getFirstAsync(`
      SELECT st.*, p.name as profileName, p.photoUri as profilePhoto
      FROM scheduled_texts st
      LEFT JOIN profiles p ON st.profileId = p.id
      WHERE st.id = ?
    `, [textId]);
    
    return result ? {
      ...result,
      sent: Boolean(result.sent)
    } : null;
  }

  async updateScheduledText(textData: any) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Update scheduled text operation simulated');
      return;
    }
    
    const { id, profileId, phoneNumber, message, scheduledFor } = textData;
    const scheduledForISO = scheduledFor instanceof Date ? scheduledFor.toISOString() : scheduledFor;
    const now = new Date().toISOString();
    
    await this.db!.runAsync(`
      UPDATE scheduled_texts SET 
        profileId = ?, 
        phoneNumber = ?, 
        message = ?, 
        scheduledFor = ?, 
        updatedAt = ?
      WHERE id = ?
    `, [profileId, phoneNumber, message, scheduledForISO, now, id]);
  }

  async submitFeedback(feedbackData: any) {
    await this.ensureReady();
  
    // Try Supabase first
    if (this.supabase) {
      try {
        const nowIso = new Date().toISOString();
  
        const { data, error } = await this.supabase
          .from('feedback')
          .insert([{
            type: feedbackData.type,
            subject: feedbackData.subject,
            message: feedbackData.message,
            useremail: feedbackData.userEmail ?? null,
            deviceinfo: feedbackData.deviceInfo ?? null,
            appversion: feedbackData.appVersion ?? null,
            status: 'open',
            createdat: nowIso,          // <— required in your schema
          }])
          .select()
          .single();
  
        if (error) {
          console.log('FEEDBACK INSERT ERROR:', error.message, error.details, error.hint);
          throw error;
        }
  
        console.log('Feedback submitted to Supabase successfully');
        return data?.id;
      } catch (error) {
        console.error('Failed to submit feedback to Supabase:', error);
        // Fall through to local storage
      }
    }
  
    // Fallback to local SQLite or web simulation
    if (this.isWebFallback) {
      console.log('Web fallback: Feedback submission simulated', feedbackData);
      return Math.floor(Math.random() * 1000) + 1;
    }
  
    const { type, subject, message, userEmail, deviceInfo, appVersion } = feedbackData;
    const now = new Date().toISOString();
  
    const result = await this.db!.runAsync(
      `INSERT INTO feedback (type, subject, message, userEmail, deviceInfo, appVersion, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, subject, message, userEmail, deviceInfo, appVersion, now]
    );
  
    return result.lastInsertRowId;
  }

  async getAllFeedback() {
    await this.ensureReady();
    
    // Try Supabase first
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase feedback fetch error:', error);
          throw error;
        }
        
        console.log('Feedback fetched from Supabase successfully');
        return data || [];
      } catch (error) {
        console.error('Failed to fetch feedback from Supabase:', error);
        // Fall through to local storage
      }
    }
    
    // Fallback to local SQLite or web simulation
    if (this.isWebFallback) {
      return [
        {
          id: 1,
          type: 'bug',
          subject: 'App crashes when adding profile',
          message: 'The app crashes whenever I try to add a new profile with a photo.',
          userEmail: 'user@example.com',
          deviceInfo: 'iPhone 14 Pro, iOS 17.2',
          appVersion: '1.0.0',
          status: 'open',
          createdAt: '2024-01-15T10:30:00.000Z'
        },
        {
          id: 2,
          type: 'feature',
          subject: 'Dark mode support',
          message: 'Would love to see dark mode support in the app!',
          userEmail: 'feedback@example.com',
          deviceInfo: 'Samsung Galaxy S23, Android 14',
          appVersion: '1.0.0',
          status: 'open',
          createdAt: '2024-01-14T15:45:00.000Z'
        }
      ];
    }
    
    const result = await this.db!.getAllAsync('SELECT * FROM feedback ORDER BY createdAt DESC');
    return result;
  }

  async updateFeedbackStatus(feedbackId: number, status: string) {
    await this.ensureReady();
    
    // Try Supabase first
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('feedback')
          .update({ status: status })
          .eq('id', feedbackId);
        
        if (error) {
          console.error('Supabase feedback status update error:', error);
          throw error;
        }
        
        console.log('Feedback status updated in Supabase successfully');
        return;
      } catch (error) {
        console.error('Failed to update feedback status in Supabase:', error);
        // Fall through to local storage
      }
    }
    
    // Fallback to local SQLite or web simulation
    if (this.isWebFallback) {
      console.log('Web fallback: Feedback status update simulated');
      return;
    }
    
    await this.db!.runAsync(`
      UPDATE feedback SET status = ? WHERE id = ?
    `, [status, feedbackId]);
  }

  async updateProfileBirthdayTextStatus(profileId: number, enabled: boolean, scheduledTextId: number | null) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Update birthday text status operation simulated');
      return;
    }
    
    await this.db!.runAsync(`
      UPDATE profiles SET birthdayTextEnabled = ?, birthdayTextScheduledTextId = ? WHERE id = ?
    `, [enabled ? 1 : 0, scheduledTextId, profileId]);
  }

  async updateProfileGiftReminderStatus(profileId: number, enabled: boolean, reminderId: number | null) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Update gift reminder status operation simulated');
      return;
    }
    
    await this.db!.runAsync(`
      UPDATE profiles SET giftReminderEnabled = ?, giftReminderId = ? WHERE id = ?
    `, [enabled ? 1 : 0, reminderId, profileId]);
  }

  async getScheduledTextByProfileId(profileId: number) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      return null;
    }
    
    const result = await this.db!.getFirstAsync(`
      SELECT * FROM scheduled_texts WHERE profileId = ? ORDER BY createdAt DESC LIMIT 1
    `, [profileId]);
    
    return result ? {
      ...result,
      sent: Boolean(result.sent)
    } : null;
  }

  async getAllProfilesWithBirthdayTextEnabled() {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      return [];
    }
    
    const result = await this.db!.getAllAsync(`
      SELECT p.*, st.scheduledFor, st.sent, st.id as scheduledTextId, st.notificationId
      FROM profiles p
      LEFT JOIN scheduled_texts st ON p.birthdayTextScheduledTextId = st.id
      WHERE p.birthdayTextEnabled = 1
    `);
    
    return result.map(row => ({
      ...row,
      birthdayTextEnabled: Boolean(row.birthdayTextEnabled),
      sent: Boolean(row.sent),
    }));
  }

  async getAllProfilesWithGiftReminderEnabled() {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      return [];
    }
    
    const result = await this.db!.getAllAsync(`
      SELECT p.*, r.scheduledFor, r.completed, r.id as reminderId, r.notificationId
      FROM profiles p
      LEFT JOIN reminders r ON p.giftReminderId = r.id
      WHERE p.giftReminderEnabled = 1
    `);
    
    return result.map(row => ({
      ...row,
      giftReminderEnabled: Boolean(row.giftReminderEnabled),
      completed: Boolean(row.completed),
    }));
  }

  async addLifeEvent(eventData: any) {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Life event operation simulated');
      return Math.floor(Math.random() * 1000) + 1;
    }
    
    const { profileId, eventType, description, eventDate, importance = 1 } = eventData;
    const now = new Date().toISOString();
    
    const result = await this.db!.runAsync(`
      INSERT INTO life_events (profileId, eventType, description, eventDate, importance, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [profileId, eventType, description, eventDate, importance, now]);
    
    return result.lastInsertRowId;
  }

  async clearAllData() {
    await this.ensureReady();
    
    if (this.isWebFallback) {
      console.log('Web fallback: Clear data operation simulated');
      return;
    }
    
    await this.db!.execAsync(`
      DROP TABLE IF EXISTS life_events;
      DROP TABLE IF EXISTS reminders;
      DROP TABLE IF EXISTS interactions;
      DROP TABLE IF EXISTS profiles;
    `);
    
    // Recreate tables with the latest schema
    await this.createTables();
  }
}

export const DatabaseService = new DatabaseServiceClass();