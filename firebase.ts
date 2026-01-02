import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc, deleteDoc, addDoc, orderBy, limit } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
export const db = getFirestore(app);
export const storage = getStorage(app);

// Helper to upload image
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

// Helper to get all businesses
export const getBusinesses = async () => {
    const q = query(collection(db, "applications"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as any[];
};

// Helper to get Featured
export const getFeaturedBusiness = async () => {
    // Only fetch manually featured businesses
    try {
        const qFeatured = query(collection(db, "applications"), where("featured", "==", true));
        const snapFeatured = await getDocs(qFeatured);
        if (!snapFeatured.empty) {
            // Find the first featured business that hasn't expired
            const valid = snapFeatured.docs
                .map(d => ({ ...d.data(), id: d.id } as any))
                .find(b => !b.subscriptionEnd || b.subscriptionEnd > Date.now());
            
            return valid || null;
        }
    } catch (e) {
        console.warn("Error fetching featured business", e);
    }
    
    return null;
};

// Helper to get Support Tickets
export const getSupportTickets = async () => {
    const q = query(collection(db, "support_tickets"));
    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as any[];
    return tickets.sort((a, b) => b.date - a.date);
};

// Helper to update Ticket status
export const updateTicketStatus = async (id: string, status: 'open' | 'closed') => {
    const ref = doc(db, "support_tickets", id);
    await updateDoc(ref, { status });
};

// Reply to Ticket
export const replyToTicket = async (id: string, reply: string) => {
    const ref = doc(db, "support_tickets", id);
    await updateDoc(ref, { 
        status: 'closed',
        reply: reply,
        replyDate: Date.now()
    });
};

// --- USER MANAGEMENT ---

// Seed default users if they don't exist
export const seedDatabase = async () => {
    const q = query(collection(db, "users"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        console.log("Seeding database with default users...");
        await addDoc(collection(db, "users"), {
            username: "owner",
            password: "owner", // In a real app, hash this!
            role: "business",
            email: "owner@gphs.edu",
            created: Date.now()
        });
    }
};

// Register New User
export const registerUser = async (username: string, password: string, email: string) => {
    // 1. Check if username exists in 'users'
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error("Username already taken");

    // 2. Check if username exists in 'applications' (legacy owners)
    const qApp = query(collection(db, "applications"), where("owner", "==", username));
    const snapApp = await getDocs(qApp);
    if (!snapApp.empty) throw new Error("Username already taken by an existing business");

    // 3. Create user
    const docRef = await addDoc(collection(db, "users"), {
        username,
        password, // In a real app, hash this!
        email,
        role: 'business',
        created: Date.now()
    });

    return { username, role: 'business', id: docRef.id };
};

// Login User
export const loginUser = async (username: string, password: string) => {
    // 1. Master Admin (Hardcoded safety net)
    if (username === 'admin' && password === 'admin') {
        return { username: 'Admin', role: 'admin' };
    }

    // 2. Database User (Standard 'users' collection)
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const validUser = snapshot.docs.find(doc => doc.data().password === password);
        if (validUser) {
            const userData = validUser.data();
            return { username: userData.username, role: userData.role, id: validUser.id };
        }
    }

    // 3. Business Accounts (Fallback to 'applications' collection)
    // Allows logging in with 'owner' name if no dedicated user account exists
    const qBiz = query(collection(db, "applications"), where("owner", "==", username));
    const snapBiz = await getDocs(qBiz);

    if (!snapBiz.empty) {
        const bizData = snapBiz.docs[0].data();
        // Allow login if:
        // - Password matches explicit 'password' field in doc
        // - OR Password matches the username (default for imported data)
        // - OR Password matches the username (default for imported data)
        // - OR Password is '123456' (common default)
        if ((bizData.password && bizData.password === password) || password === username || password === '123456') {
             return { username: bizData.owner, role: 'business', id: snapBiz.docs[0].id };
        }
    }

    return null;
};

// Get All Users (Unifies 'users' collection and 'applications' owners)
export const getUsers = async () => {
    const allUsers = [];

    // 1. Fetch Standard Users
    const qUsers = query(collection(db, "users"));
    const snapshotUsers = await getDocs(qUsers);
    snapshotUsers.docs.forEach(d => {
        allUsers.push({ ...d.data(), id: d.id, source: 'users' });
    });

    // 2. Fetch Business Owners (from applications)
    const qApps = query(collection(db, "applications"));
    const snapshotApps = await getDocs(qApps);
    snapshotApps.docs.forEach(d => {
        const data = d.data();
        if (data.owner) {
            allUsers.push({
                id: d.id, // Use business ID
                username: data.owner,
                role: 'business',
                email: data.ownerContact || 'N/A',
                source: 'applications', // Mark source to know how to delete
                businessName: data.business,
                password: data.password || data.owner // Include password for admin view
            });
        }
    });

    return allUsers;
};

// Delete User (Handles both collections)
export const deleteUser = async (id: string, source: 'users' | 'applications') => {
    if (source === 'applications') {
        // If the user is a business owner, we delete the business application
        await deleteDoc(doc(db, "applications", id));
    } else {
        // Standard user delete
        await deleteDoc(doc(db, "users", id));
    }
};

// Update User Password
export const updateUserPassword = async (id: string, newPassword: string, source: 'users' | 'applications') => {
    if (source === 'applications') {
        await updateDoc(doc(db, "applications", id), { password: newPassword });
    } else {
        await updateDoc(doc(db, "users", id), { password: newPassword });
    }
};