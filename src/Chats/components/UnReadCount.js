// src/hooks/useUnreadChatCount.js
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';

const useUnreadChatCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Query for unread messages where current user is the receiver
    const q = query(
      collection(db, 'platform-messages'),
      where('receiverId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        setUnreadCount(querySnapshot.size);
      },
      (error) => {
        console.error('Error listening to unread messages:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  return unreadCount;
};

export default useUnreadChatCount;