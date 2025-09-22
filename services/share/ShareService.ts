import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export interface CaptureOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'png' | 'jpg';
}

class ShareServiceClass {
  async capture(ref: any, options: CaptureOptions): Promise<string> {
    try {
      const uri = await captureRef(ref, {
        format: options.format || 'png',
        quality: options.quality || 1.0,
        width: options.width,
        height: options.height,
      });
      
      console.log('ARMi card captured:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to capture ARMi card:', error);
      throw new Error('Failed to capture image');
    }
  }

  async saveToMediaLibrary(uri: string): Promise<boolean> {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable photo library access in Settings to save images.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    } catch (error) {
      console.error('Failed to save to media library:', error);
      throw new Error('Failed to save image');
    }
  }

  async share(uri: string, title: string = 'My ARMi Card'): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Share', 'Sharing is not available on web platform');
        return false;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return false;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: title,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to share:', error);
      throw new Error('Failed to share image');
    }
  }

  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request media library permissions:', error);
      return false;
    }
  }
}

export const ShareService = new ShareServiceClass();