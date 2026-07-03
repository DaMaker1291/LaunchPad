import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNative = Capacitor.isNativePlatform();

export async function setupPushNotifications() {
  if (!isNative) return;
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return;
    await PushNotifications.register();
    PushNotifications.addListener('registration', (token) => {
      console.log('Push token:', token.value);
      localStorage.setItem('pushToken', token.value);
    });
    PushNotifications.addListener('pushNotificationReceived', (n) => {
      console.log('Push received:', n);
    });
    PushNotifications.addListener('pushNotificationActionPerformed', (n) => {
      console.log('Push action:', n);
    });
  } catch (e) {
    console.log('Push setup failed:', e);
  }
}

export async function shareContent({ title, text, url, dialogTitle }) {
  try {
    await Share.share({ title, text, url, dialogTitle });
  } catch (e) {
    if (e.message !== 'canceled') console.log('Share failed:', e);
  }
}

export async function shareCertificate(certId, certTitle) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  await shareContent({
    title: 'LaunchPad Certificate',
    text: `I earned "${certTitle}" on LaunchPad! 🎓`,
    url: `${apiUrl}/api/work/certificates/${certId}/render`,
    dialogTitle: 'Share your certificate',
  });
}

export async function shareAchievement(title, message) {
  await shareContent({
    title: 'LaunchPad Achievement',
    text: `${message} 🚀`,
    dialogTitle: 'Share your achievement',
  });
}

export function hideSplash() {
  try { SplashScreen.hide(); } catch {}
}
