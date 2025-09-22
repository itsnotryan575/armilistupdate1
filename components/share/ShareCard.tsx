import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Profile, PrivacySettings, ShareCardTheme, TemplateType, AspectRatio } from '@/types/armi';
import { TemplateStats } from './templates/TemplateStats';
import { TemplateBlurredPeek } from './templates/TemplateBlurredPeek';
import { TemplateMiniCards } from './templates/TemplateMiniCards';

interface ShareCardProps {
  templateType: TemplateType;
  profiles: Profile[];
  privacySettings: PrivacySettings;
  aspectRatio: AspectRatio;
  theme: ShareCardTheme;
}

export interface ShareCardRef {
  capture: (options: { width: number; height: number }) => Promise<string>;
}

export const ShareCard = forwardRef<ShareCardRef, ShareCardProps>(
  ({ templateType, profiles, privacySettings, aspectRatio, theme }, ref) => {
    const viewShotRef = useRef<ViewShot>(null);

    useImperativeHandle(ref, () => ({
      capture: async (options: { width: number; height: number }) => {
        if (!viewShotRef.current) {
          throw new Error('ViewShot ref not available');
        }
        
        return await viewShotRef.current.capture({
          format: 'png',
          quality: 1.0,
          width: options.width,
          height: options.height,
        });
      },
    }));

    const renderTemplate = () => {
      const templateProps = {
        profiles,
        privacySettings,
        theme,
        aspectRatio,
      };

      switch (templateType) {
        case 'Stats':
          return <TemplateStats {...templateProps} />;
        case 'BlurredPeek':
          return <TemplateBlurredPeek {...templateProps} />;
        case 'MiniCards':
          return <TemplateMiniCards {...templateProps} />;
        default:
          return <TemplateStats {...templateProps} />;
      }
    };

    const getDimensions = () => {
      switch (aspectRatio) {
        case 'Story':
          return { width: 1080, height: 1920 };
        case 'Portrait':
          return { width: 1080, height: 1350 };
        case 'Square':
          return { width: 1080, height: 1080 };
        default:
          return { width: 1080, height: 1920 };
      }
    };

    const dimensions = getDimensions();

    return (
      <ViewShot
        ref={viewShotRef}
        options={{
          format: 'png',
          quality: 1.0,
        }}
        style={[styles.container, dimensions]}
      >
        {renderTemplate()}
      </ViewShot>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});