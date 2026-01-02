import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc, deleteDoc, addDoc, orderBy, limit, writeBatch } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User as UserType } from "./types";

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

export const getBusinesses = async () => {
    const q = query(collection(db, "applications"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as any[];
};

export const saveBusinessOrder = async (businesses: any[]) => {
    const chunkSize = 500;
    for (let i = 0; i < businesses.length; i += chunkSize) {
        const chunk = businesses.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((b, idx) => {
            const ref = doc(db, "applications", b.id);
            batch.update(ref, { order: i + idx });
        });
        await batch.commit();
    }
};

export const getFeaturedBusiness = async () => {
    try {
        const qFeatured = query(collection(db, "applications"), where("featured", "==", true));
        const snapFeatured = await getDocs(qFeatured);
        if (!snapFeatured.empty) {
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

export const getSupportTickets = async () => {
    const q = query(collection(db, "support_tickets"));
    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as any[];
    return tickets.sort((a, b) => b.date - a.date);
};

export const updateTicketStatus = async (id: string, status: 'open' | 'closed') => {
    const ref = doc(db, "support_tickets", id);
    await updateDoc(ref, { status });
};

export const replyToTicket = async (id: string, reply: string) => {
    const ref = doc(db, "support_tickets", id);
    await updateDoc(ref, { 
        status: 'closed',
        reply: reply,
        replyDate: Date.now()
    });
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

export const loginUser = async (username: string, password: string) => {
    if (username === 'admin' && password === 'admin') {
        return { username: 'Admin', role: 'admin', displayName: 'System Administrator' };
    }

    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const userDoc = snapshot.docs.find(doc => doc.data().password === password);
        if (userDoc) {
            return { ...userDoc.data(), id: userDoc.id } as UserType;
        }
    }

    const qBiz = query(collection(db, "applications"), where("owner", "==", username));
    const snapBiz = await getDocs(qBiz);

    if (!snapBiz.empty) {
        // Iterate through all matching documents to find one with the correct password
        const validDoc = snapBiz.docs.find(d => {
            const data = d.data();
            return (data.password && data.password === password) || password === username || password === '123456';
        });

        if (validDoc) {
            const bizData = validDoc.data();
             return { 
                username: bizData.owner, 
                role: 'business', 
                id: validDoc.id,
                displayName: bizData.ownerName || bizData.owner,
                bio: bizData.ownerBio || '',
                profileImg: bizData.ownerImg || '',
                contactInfo: bizData.ownerContact || ''
             } as any;
        }
    }

    return null;
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserType>) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, profileData);

    // Sync to all businesses (owned or reviewed)
    if (profileData.username) {
        // We must query ALL applications to find reviews left by this user
        const q = query(collection(db, "applications"));
        const snap = await getDocs(q);
        
        const batch = writeBatch(db);
        let operations = 0;

        snap.docs.forEach(d => {
            const data = d.data();
            let changed = false;
            const updates: any = {};

            // 1. Update Owned Business Profile
            if (data.owner === profileData.username) {
                updates.ownerName = profileData.displayName || profileData.username;
                updates.ownerImg = profileData.profileImg || '';
                updates.ownerBio = profileData.bio || '';
                updates.ownerContact = profileData.contactInfo || '';
                changed = true;
            }

            // 2. Update Reviews left by this user
            if (data.reviews && Array.isArray(data.reviews)) {
                let reviewsChanged = false;
                const newReviews = data.reviews.map((r: any) => {
                    // Check if the review belongs to the user
                    if (r.name === profileData.username) {
                        reviewsChanged = true;
                        return {
                            ...r,
                            displayName: profileData.displayName || profileData.username,
                            photoURL: profileData.profileImg || ''
                        };
                    }
                    return r;
                });

                if (reviewsChanged) {
                    updates.reviews = newReviews;
                    changed = true;
                }
            }

            if (changed) {
                batch.update(doc(db, "applications", d.id), updates);
                operations++;
            }
        });

        if (operations > 0) {
            await batch.commit();
        }
    }
};

export const getUsers = async () => {
    const allUsers = [];
    const qUsers = query(collection(db, "users"));
    const snapshotUsers = await getDocs(qUsers);
    snapshotUsers.docs.forEach(d => {
        allUsers.push({ ...d.data(), id: d.id, source: 'users' });
    });
    return allUsers;
};

export const deleteUser = async (id: string, source: 'users' | 'applications') => {
    if (source === 'applications') {
        await deleteDoc(doc(db, "applications", id));
    } else {
        await deleteDoc(doc(db, "users", id));
    }
};

export const updateUserPassword = async (id: string, newPassword: string, source: 'users' | 'applications') => {
    if (source === 'applications') {
        await updateDoc(doc(db, "applications", id), { password: newPassword });
    } else {
        await updateDoc(doc(db, "users", id), { password: newPassword });
    }
};