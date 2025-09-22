import React, { useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function MiniNotifSmoke() {
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') await Notifications.requestPermissionsAsync();
    })();
  }, []);

  const logPending = async (tag: string) => {
    const t = await Notifications.getAllScheduledNotificationsAsync();
    console.log(tag, 'pending=', Array.isArray(t) ? t.length : t, t);
  };

  const test65 = async () => {
    console.log('SMOKE 65s literal');
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'SMOKE 65s', body: new Date().toISOString(), sound: 'default' },
      trigger: { seconds: 65, repeats: false },
    });
    console.log('SMOKE 65s id=', id);
    setTimeout(() => logPending('SMOKE 65s'), 700);
  };

  const testAbs90 = async () => {
    console.log('SMOKE abs90 literal');
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'SMOKE abs90', body: new Date().toISOString(), sound: 'default' },
      trigger: { date: new Date(Date.now() + 90_000) },        // NOTE: Date instance
    });
    console.log('SMOKE abs90 id=', id);
    setTimeout(() => logPending('SMOKE abs90'), 700);
  };

  return (
    <View style={{flex:1, alignItems:'center', justifyContent:'center', gap:16}}>
      <Pressable onPress={test65}  style={{padding:14, backgroundColor:'#333', borderRadius:10}}>
        <Text style={{color:'#fff'}}>🧪 65s</Text>
      </Pressable>
      <Pressable onPress={testAbs90} style={{padding:14, backgroundColor:'#333', borderRadius:10}}>
        <Text style={{color:'#fff'}}>⏰ +90s (Date)</Text>
      </Pressable>
    </View>
  );
}