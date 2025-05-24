import { collection, query, where, getDocs, updateDoc, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";

export const fetchActiveSessions = async (userId) => {
  const sessionsRef = collection(db, "user_sessions");
  const q = query(
    sessionsRef,
    where("userId", "==", userId),
    where("isActive", "==", true)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const revokeSession = async (sessionId) => {
  const sessionRef = doc(db, "user_sessions", sessionId);
  await updateDoc(sessionRef, {
    isActive: false,
    loggedOutAt: serverTimestamp()
  });
};

export const revokeAllSessions = async (userId) => {
  const activeSessions = await fetchActiveSessions(userId);
  const batch = writeBatch(db);
  
  activeSessions.forEach(session => {
    const sessionRef = doc(db, "user_sessions", session.id);
    batch.update(sessionRef, {
      isActive: false,
      loggedOutAt: serverTimestamp()
    });
  });
  
  await batch.commit();
};

export const parseUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  
  // Mobile devices
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    const modelMatch = userAgent.match(/iPhone|iPad|iPod/);
    const versionMatch = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    return `${modelMatch[0]}${versionMatch ? ` (iOS ${versionMatch[1]})` : ''}`;
  }
  
  if (/Android/i.test(userAgent)) {
    const modelMatch = userAgent.match(/; ([^;)]+)(\)|;)/);
    const versionMatch = userAgent.match(/Android (\d+)/);
    return `${modelMatch ? modelMatch[1] : 'Android Device'}${versionMatch ? ` (Android ${versionMatch[1]})` : ''}`;
  }
  
  // Desktop devices
  if (/Windows/i.test(userAgent)) {
    const versionMatch = userAgent.match(/Windows NT (\d+\.\d+)/);
    return `Windows PC${versionMatch ? ` (${versionMatch[1]})` : ''}`;
  }
  
  if (/Macintosh/i.test(userAgent)) {
    const versionMatch = userAgent.match(/Mac OS X (\d+_\d+)/);
    return `Mac${versionMatch ? ` (${versionMatch[1].replace('_', '.')})` : ''}`;
  }
  
  if (/Linux/i.test(userAgent)) {
    return 'Linux PC';
  }
  
  return 'Unknown Device';
};

export const formatLastActive = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const lastActive = timestamp.toDate();
  const diff = now - lastActive;
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(minutes / 1440)} day${Math.floor(minutes / 1440) !== 1 ? 's' : ''} ago`;
};