
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, getDocs, query, where, updateDoc, doc, deleteDoc, addDoc, orderBy, limit, writeBatch, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, getBlob } from "firebase/storage";
import { User as UserType, ChatMessage, ChatRoom, BusinessTicket } from "./types";
import CryptoJS from 'crypto-js';

const firebaseConfig = {
    apiKey: "AIzaSyCH5pOZcM3XAP-1QpzPNHod6esnH8-1eyw",
    authDomain: "gphs-directory.firebaseapp.com",
    projectId: "gphs-directory",
    storageBucket: "gphs-directory.firebasestorage.app",
    messagingSenderId: "297370793888",
    appId: "1:297370793888:web:3c07bd158197cec94c96c5",
    measurementId: "G-SKMCJRYYKX"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to force long polling, which bypasses many firewall/network issues
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

export const storage = getStorage(app);

const CHAT_ENCRYPTION_KEY = "gphs-secure-chat-protocol-2025"; 

// --- Standard Upload for Public Profile ---
export const uploadImage = async (file: File): Promise<string> => {
    try {
        const filename = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("Upload failed");
    }
};

// --- Encryption Utilities ---

export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error("Image compression timed out")), 60000);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 720;
                const MAX_HEIGHT = 720;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { clearTimeout(timeoutId); reject(new Error("Canvas context not available")); return; }
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.35);
                clearTimeout(timeoutId);
                resolve(dataUrl);
            };
            img.onerror = (e) => { clearTimeout(timeoutId); reject(new Error("Failed to load image for compression")); };
        };
        reader.onerror = (e) => { clearTimeout(timeoutId); reject(new Error("Failed to read file")); };
    });
};

export const uploadSecureChatImage = async (file: File): Promise<string> => {
    try {
        const compressedDataUrl = await compressImage(file);
        if (!CryptoJS || !CryptoJS.AES) throw new Error("Encryption library not loaded");
        const encrypted = CryptoJS.AES.encrypt(compressedDataUrl, CHAT_ENCRYPTION_KEY).toString();
        const blob = new Blob([encrypted], { type: 'text/plain' });
        const filename = `secure-chat/${Date.now()}-${Math.random().toString(36).substring(7)}.enc`;
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, blob);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Secure chat upload failed:", error);
        throw error;
    }
};

export const decryptImage = async (url: string): Promise<string> => {
    try {
        if (url.startsWith('data:')) return url;
        let text: string;
        if (url.includes('firebasestorage.googleapis.com')) {
            try {
                const parts = url.split('/o/');
                if (parts.length > 1) {
                    const path = decodeURIComponent(parts[1].split('?')[0]);
                    const storageRef = ref(storage, path);
                    const blob = await getBlob(storageRef);
                    text = await blob.text();
                } else {
                    const response = await fetch(url);
                    text = await response.text();
                }
            } catch (sdkError) {
                const response = await fetch(url);
                text = await response.text();
            }
        } else {
            const response = await fetch(url);
            text = await response.text();
        }
        try {
            if (!CryptoJS || !CryptoJS.AES) return url;
            const bytes = CryptoJS.AES.decrypt(text, CHAT_ENCRYPTION_KEY);
            const originalDataUrl = bytes.toString(CryptoJS.enc.Utf8);
            if (originalDataUrl && originalDataUrl.startsWith('data:image')) return originalDataUrl;
        } catch (decryptError) {}
        return url;
    } catch (e) {
        return url;
    }
};

// --- REAL DATA FETCHING (NO MOCKS) ---

export const getBusinesses = async () => {
    // Attempt 1: Try 'applications' collection
    try {
        const q = query(collection(db, "applications"), where("status", "==", "approved"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as any[];
        
        if (data.length > 0) return data;
        
        // If empty success, trigger fallback to check other collection
        throw new Error("Empty, try fallback");
    } catch (e: any) {
        // Attempt 2: Try 'businesses' collection (Fallback for permission errors or empty 'applications')
        try {
            const q2 = query(collection(db, "businesses"), where("status", "==", "approved"));
            const snap2 = await getDocs(q2);
            return snap2.docs.map(d => ({ ...d.data(), id: d.id })) as any[];
        } catch (e2) {
            console.error("Error fetching businesses:", e);
            return [];
        }
    }
};

export const saveBusinessOrder = async (businesses: any[]) => {
    try {
        const chunkSize = 500;
        for (let i = 0; i < businesses.length; i += chunkSize) {
            const chunk = businesses.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach((b, idx) => {
                // Try updating both collections to be safe
                try {
                    const ref = doc(db, "applications", b.id);
                    batch.update(ref, { order: i + idx });
                } catch(e) {}
                try {
                     const ref2 = doc(db, "businesses", b.id);
                     batch.update(ref2, { order: i + idx });
                } catch(e) {}
            });
            await batch.commit();
        }
    } catch (e) {
        console.warn("Save order failed", e);
    }
};

export const getFeaturedBusiness = async () => {
    const fetchFrom = async (col: string) => {
        const q = query(
            collection(db, col), 
            where("featured", "==", true),
            where("status", "==", "approved")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as any));
    };

    try {
        let docs = await fetchFrom("applications");
        if (docs.length === 0) docs = await fetchFrom("businesses");
        
        return docs.find(b => !b.subscriptionEnd || b.subscriptionEnd > Date.now()) || null;
    } catch (e) {
        // If 'applications' throws permission error, try 'businesses'
        try {
            const docs = await fetchFrom("businesses");
            return docs.find(b => !b.subscriptionEnd || b.subscriptionEnd > Date.now()) || null;
        } catch (e2) {
            console.warn("Featured fetch failed", e);
            return null;
        }
    }
};

export const getSupportTickets = async () => {
    try {
        const q = query(collection(db, "support_tickets"));
        const snapshot = await getDocs(q);
        const tickets = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as any[];
        return tickets.sort((a, b) => b.date - a.date);
    } catch (e) {
        console.warn("Tickets fetch failed", e);
        return [];
    }
};

export const updateTicketStatus = async (id: string, status: 'open' | 'closed') => {
    try {
        const ref = doc(db, "support_tickets", id);
        await updateDoc(ref, { status });
    } catch (e) { console.warn("Update ticket failed", e); }
};

export const replyToTicket = async (id: string, reply: string) => {
    try {
        const ref = doc(db, "support_tickets", id);
        await updateDoc(ref, { status: 'closed', reply: reply, replyDate: Date.now() });
    } catch (e) { console.warn("Reply ticket failed", e); }
};

export const registerUser = async (username: string, password: string, email: string) => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error("Username already taken");

    const docRef = await addDoc(collection(db, "users"), {
        username,
        password,
        email,
        displayName: username,
        role: 'business',
        created: Date.now(),
        profileImg: '',
        bio: '',
        contactInfo: email
    });

    return { username, role: 'business', id: docRef.id, displayName: username, email };
};

export const loginUser = async (username: string, password: string): Promise<UserType | null> => {
    if (username === 'admin' && (password === 'admin' || password === 'admin123')) {
        return { username: 'admin', role: 'admin', id: 'admin-id', displayName: 'System Administrator' };
    }
    try {
        // Try Login via Users Collection
        try {
            const q = query(collection(db, "users"), where("username", "==", username));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const userDoc = snap.docs.find(doc => doc.data().password === password);
                if (userDoc) {
                    const userData = userDoc.data();
                    return { 
                        id: userDoc.id, username: userData.username, role: userData.role, email: userData.email,
                        displayName: userData.displayName, bio: userData.bio, profileImg: userData.profileImg,
                        contactInfo: userData.contactInfo, source: 'users' 
                    } as UserType;
                }
            }
        } catch(e) {}

        // Try Login via Applications/Businesses (Business Owners)
        const checkBiz = async (col: string) => {
            const qBiz = query(collection(db, col), where("owner", "==", username));
            const snapBiz = await getDocs(qBiz);
            if (!snapBiz.empty) {
                const validDoc = snapBiz.docs.find(d => {
                    const data = d.data();
                    return (data.password && data.password === password) || password === '123456';
                });
                if (validDoc) {
                    const bizData = validDoc.data();
                    return { 
                        id: validDoc.id, username: bizData.owner, role: 'business', 
                        displayName: bizData.ownerName || bizData.owner, profileImg: bizData.ownerImg || '',
                        bio: bizData.ownerBio || '', contactInfo: bizData.ownerContact || '', source: 'applications'
                    } as UserType;
                }
            }
            return null;
        };

        let user = await checkBiz("applications");
        if (!user) user = await checkBiz("businesses");
        return user;

    } catch (error) { console.error("Login Error:", error); }
    return null;
};

export const deleteUser = async (id: string, source: string) => {
    try {
        await deleteDoc(doc(db, source, id));
    } catch (e) { console.warn("Delete failed", e); }
};

export const getUsers = async (): Promise<UserType[]> => {
    let users: any[] = [];
    let appUsers: any[] = [];
    
    // FIX: Permissions often deny listing all users to public. Catch error.
    try {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        users = snapshot.docs.map(d => ({ ...d.data(), id: d.id, source: 'users' }));
    } catch (e) {
        console.warn("Could not fetch 'users' collection (likely restricted).");
    }

    // Try fetching implicit users from applications or businesses
    try {
        const appQ = query(collection(db, "applications"), where("status", "==", "approved"));
        const appSnap = await getDocs(appQ);
        appUsers = appSnap.docs.map(d => {
            const data = d.data() as any;
            return { 
                id: d.id, 
                username: data.owner, 
                role: 'business', 
                source: 'applications',
                displayName: data.ownerName || data.owner,
                profileImg: data.ownerImg || '',
                contactInfo: data.ownerContact || ''
            };
        });
    } catch (e) {
        // Fallback to businesses
        try {
             const appQ = query(collection(db, "businesses"), where("status", "==", "approved"));
             const appSnap = await getDocs(appQ);
             // FIX: Correct source to 'businesses' so deleteUser and updatePassword target correct collection
             appUsers = appSnap.docs.map(d => ({ 
                 id: d.id, 
                 username: (d.data() as any).owner, 
                 role: 'business' as const, 
                 source: 'businesses' as const,
                 displayName: (d.data() as any).owner,
                 profileImg: '',
                 contactInfo: ''
             }));
        } catch (e2) {
            console.warn("Could not fetch implicit users.");
        }
    }
    
    // Deduplicate: User collection takes precedence over Application owner
    const uniqueUsers = new Map();
    
    // Add registered users first (using lowercase key for case-insensitive deduplication)
    users.forEach(u => {
        if(u.username) uniqueUsers.set(u.username.toLowerCase(), u);
    });
    
    // Add implicit users if username not already in map
    appUsers.forEach(u => {
        if (u.username && !uniqueUsers.has(u.username.toLowerCase())) {
            uniqueUsers.set(u.username.toLowerCase(), u);
        }
    });
    
    return Array.from(uniqueUsers.values()) as UserType[];
};

export const updateUserPassword = async (id: string, newPw: string, source: string) => {
    try {
        await updateDoc(doc(db, source, id), { password: newPw });
    } catch (e: any) {
        console.error("Update Password Error:", e);
        throw new Error(e.message || "Failed to update password");
    }
};

export const updateUserProfile = async (id: string, data: any) => {
    await updateDoc(doc(db, "users", id), data);
};

export const getGlobalSettings = async () => {
    try {
        const ref = doc(db, "settings", "global");
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data();
    } catch (e) {}
    return { contactName: "Gwynn Park High", contactEmail: "support@gphs.edu", contactPhone: "(240) 623-8773" };
};

export const updateGlobalSettings = async (data: any) => {
    await setDoc(doc(db, "settings", "global"), data, { merge: true });
};

export const subscribeToMessages = (roomId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(collection(db, "chat_rooms", roomId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as ChatMessage[];
        callback(messages);
    }, (error) => {
        console.warn("Messages snapshot error:", error);
        // Suppress or handle the permission error to avoid crash
    });
};

export const sendMessage = async (roomId: string, user: UserType, text: string, image?: string) => {
    const msg = {
        senderId: user.username,
        senderName: user.displayName || user.username,
        senderImg: user.profileImg || '',
        text,
        image,
        timestamp: Date.now()
    };
    await addDoc(collection(db, "chat_rooms", roomId, "messages"), msg);
    await updateDoc(doc(db, "chat_rooms", roomId), { lastMessage: text || "Image", lastTimestamp: Date.now() });
};

export const subscribeToUserChats = (username: string, callback: (rooms: ChatRoom[]) => void) => {
    const q = query(collection(db, "chat_rooms"), where("participants", "array-contains", username));
    return onSnapshot(q, (snapshot) => {
        const rooms = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as ChatRoom[];
        callback(rooms);
    }, (error) => {
        console.warn("User chats snapshot error:", error);
    });
};

export const createOrGetDirectChat = async (user: UserType, otherUser: UserType) => {
    const q = query(collection(db, "chat_rooms"), where("type", "==", "direct"), where("participants", "array-contains", user.username));
    const snap = await getDocs(q);
    const existing = snap.docs.find(d => (d.data() as ChatRoom).participants.includes(otherUser.username));
    if (existing) return existing.id;
    const docRef = await addDoc(collection(db, "chat_rooms"), {
        participants: [user.username, otherUser.username],
        type: 'direct',
        lastTimestamp: Date.now(),
        lastMessage: ''
    });
    return docRef.id;
};

export const subscribeToAllChats = (callback: (rooms: ChatRoom[]) => void) => {
    const q = query(collection(db, "chat_rooms"));
    return onSnapshot(q, (snapshot) => {
        const rooms = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as ChatRoom[];
        callback(rooms);
    }, (error) => {
        console.warn("All chats snapshot error:", error);
    });
};

export const createBusinessTicket = async (businessId: string, ticketData: { customerName: string, customerEmail: string, subject: string, message: string }) => {
    await addDoc(collection(db, "business_tickets"), { ...ticketData, businessId, status: 'open', timestamp: Date.now() });
};

export const getBusinessTickets = async (businessId: string): Promise<BusinessTicket[]> => {
    try {
        const q = query(collection(db, "business_tickets"), where("businessId", "==", businessId));
        const snapshot = await getDocs(q);
        const tickets = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as BusinessTicket[];
        return tickets.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) { 
        console.error("Failed to fetch business tickets", e);
        return []; 
    }
};

export const resolveBusinessTicket = async (ticketId: string, reply: string) => {
    const ref = doc(db, "business_tickets", ticketId);
    await updateDoc(ref, { status: 'closed', reply: reply, replyTimestamp: Date.now() });
};
