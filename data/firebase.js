import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

// Firebase configuration provided
const firebaseConfig = {
  apiKey: "AIzaSyArV6D-7JtH0x48z5WlA4S3qPOjgfvQwk4",
  authDomain: "xpenses-monitor.firebaseapp.com",
  projectId: "xpenses-monitor",
  storageBucket: "xpenses-monitor.firebasestorage.app",
  messagingSenderId: "160242106395",
  appId: "1:160242106395:web:1d2f7678ef32c5a89a78be"
};

// Initialize Firebase (checking if already initialized for Next.js hot reload)
let app;
let db;
let isFirebaseOnline = false;

if (typeof window !== "undefined") {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    isFirebaseOnline = true;
    console.log("Firebase connected successfully.");
  } catch (error) {
    console.error("Firebase connection failed, fallback to local storage:", error);
  }
}

// Local storage fallback helper functions
const getLocalStorageData = (key) => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveLocalStorageData = (key, data) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const checkDbConnection = async () => {
  if (!isFirebaseOnline || !db) return false;
  try {
    // Attempt a quick read to verify rules / connectivity
    await getDocs(collection(db, "test_connectivity"));
    return true;
  } catch (error) {
    console.warn("Firestore connection check warning:", error.message);
    return false;
  }
};

export const dbService = {
  // --- COLLECTION LIST OPERATIONS ---
  async getCollections() {
    if (!isFirebaseOnline || !db) {
      return getLocalStorageData("collections");
    }
    try {
      const snap = await getDocs(collection(db, "collections"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveLocalStorageData("collections", data);
      return data;
    } catch (error) {
      console.warn("Firestore fetch error, reading from local storage:", error);
      return getLocalStorageData("collections");
    }
  },

  async addCollection(item) {
    if (!isFirebaseOnline || !db) {
      const local = getLocalStorageData("collections");
      const newItem = { ...item, id: `local_col_${Date.now()}` };
      local.push(newItem);
      saveLocalStorageData("collections", local);
      return newItem;
    }
    try {
      const docRef = await addDoc(collection(db, "collections"), item);
      const newItem = { ...item, id: docRef.id };
      const local = getLocalStorageData("collections");
      local.push(newItem);
      saveLocalStorageData("collections", local);
      return newItem;
    } catch (error) {
      console.warn("Firestore add error, writing to local storage:", error);
      const local = getLocalStorageData("collections");
      const newItem = { ...item, id: `local_col_${Date.now()}` };
      local.push(newItem);
      saveLocalStorageData("collections", local);
      return newItem;
    }
  },

  async updateCollection(id, updatedFields) {
    if (!isFirebaseOnline || !db || String(id).startsWith("local_col")) {
      const local = getLocalStorageData("collections");
      const updated = local.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      saveLocalStorageData("collections", updated);
      return { id, ...updatedFields };
    }
    try {
      const docRef = doc(db, "collections", id);
      await updateDoc(docRef, updatedFields);
      const local = getLocalStorageData("collections");
      const updated = local.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      saveLocalStorageData("collections", updated);
      return { id, ...updatedFields };
    } catch (error) {
      console.warn("Firestore update error, updating local storage:", error);
      const local = getLocalStorageData("collections");
      const updated = local.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      saveLocalStorageData("collections", updated);
      return { id, ...updatedFields };
    }
  },

  async deleteCollection(id) {
    if (!isFirebaseOnline || !db || String(id).startsWith("local_col")) {
      const local = getLocalStorageData("collections");
      const filtered = local.filter(item => item.id !== id);
      saveLocalStorageData("collections", filtered);
      return id;
    }
    try {
      const docRef = doc(db, "collections", id);
      await deleteDoc(docRef);
      const local = getLocalStorageData("collections");
      const filtered = local.filter(item => item.id !== id);
      saveLocalStorageData("collections", filtered);
      return id;
    } catch (error) {
      console.warn("Firestore delete error, removing from local storage:", error);
      const local = getLocalStorageData("collections");
      const filtered = local.filter(item => item.id !== id);
      saveLocalStorageData("collections", filtered);
      return id;
    }
  },

  // --- FIXED EXPENSES OPERATIONS ---
  async getExpenses() {
    if (!isFirebaseOnline || !db) {
      return getLocalStorageData("expenses");
    }
    try {
      const snap = await getDocs(collection(db, "fixed_expenses"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveLocalStorageData("expenses", data);
      return data;
    } catch (error) {
      console.warn("Firestore fetch error, reading from local storage:", error);
      return getLocalStorageData("expenses");
    }
  },

  async addExpense(item) {
    if (!isFirebaseOnline || !db) {
      const local = getLocalStorageData("expenses");
      const newItem = { ...item, id: `local_exp_${Date.now()}` };
      local.push(newItem);
      saveLocalStorageData("expenses", local);
      return newItem;
    }
    try {
      const docRef = await addDoc(collection(db, "fixed_expenses"), item);
      const newItem = { ...item, id: docRef.id };
      const local = getLocalStorageData("expenses");
      local.push(newItem);
      saveLocalStorageData("expenses", local);
      return newItem;
    } catch (error) {
      console.warn("Firestore add error, writing to local storage:", error);
      const local = getLocalStorageData("expenses");
      const newItem = { ...item, id: `local_exp_${Date.now()}` };
      local.push(newItem);
      saveLocalStorageData("expenses", local);
      return newItem;
    }
  },

  async updateExpense(id, updatedFields) {
    if (!isFirebaseOnline || !db || String(id).startsWith("local_exp")) {
      const local = getLocalStorageData("expenses");
      const updated = local.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      saveLocalStorageData("expenses", updated);
      return { id, ...updatedFields };
    }
    try {
      const docRef = doc(db, "fixed_expenses", id);
      await updateDoc(docRef, updatedFields);
      const local = getLocalStorageData("expenses");
      const updated = local.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      saveLocalStorageData("expenses", updated);
      return { id, ...updatedFields };
    } catch (error) {
      console.warn("Firestore update error, updating local storage:", error);
      const local = getLocalStorageData("expenses");
      const updated = local.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      saveLocalStorageData("expenses", updated);
      return { id, ...updatedFields };
    }
  },

  async deleteExpense(id) {
    if (!isFirebaseOnline || !db || String(id).startsWith("local_exp")) {
      const local = getLocalStorageData("expenses");
      const filtered = local.filter(item => item.id !== id);
      saveLocalStorageData("expenses", filtered);
      return id;
    }
    try {
      const docRef = doc(db, "fixed_expenses", id);
      await deleteDoc(docRef);
      const local = getLocalStorageData("expenses");
      const filtered = local.filter(item => item.id !== id);
      saveLocalStorageData("expenses", filtered);
      return id;
    } catch (error) {
      console.warn("Firestore delete error, removing from local storage:", error);
      const local = getLocalStorageData("expenses");
      const filtered = local.filter(item => item.id !== id);
      saveLocalStorageData("expenses", filtered);
      return id;
    }
  },

  // --- COMPANIES OPERATIONS ---
  async getCompanies() {
    if (!isFirebaseOnline || !db) {
      return getLocalStorageData("companies");
    }
    try {
      const snap = await getDocs(collection(db, "companies"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveLocalStorageData("companies", data);
      return data;
    } catch (error) {
      console.warn("Firestore fetch error, reading from local storage:", error);
      return getLocalStorageData("companies");
    }
  },

  async addCompany(item) {
    if (!isFirebaseOnline || !db) {
      const local = getLocalStorageData("companies");
      const newItem = { ...item, id: `local_comp_${Date.now()}` };
      local.push(newItem);
      saveLocalStorageData("companies", local);
      return newItem;
    }
    try {
      const docRef = await addDoc(collection(db, "companies"), item);
      const newItem = { ...item, id: docRef.id };
      const local = getLocalStorageData("companies");
      local.push(newItem);
      saveLocalStorageData("companies", local);
      return newItem;
    } catch (error) {
      console.warn("Firestore add error, writing to local storage:", error);
      const local = getLocalStorageData("companies");
      const newItem = { ...item, id: `local_comp_${Date.now()}` };
      local.push(newItem);
      saveLocalStorageData("companies", local);
      return newItem;
    }
  },

  async updateCompany(id, updatedFields) {
    if (!isFirebaseOnline || !db || String(id).startsWith("local_comp")) {
      const local = getLocalStorageData("companies");
      const updated = local.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      saveLocalStorageData("companies", updated);
      return { id, ...updatedFields };
    }
    try {
      const docRef = doc(db, "companies", id);
      await updateDoc(docRef, updatedFields);
      const local = getLocalStorageData("companies");
      const updated = local.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      saveLocalStorageData("companies", updated);
      return { id, ...updatedFields };
    } catch (error) {
      console.warn("Firestore update error, updating local storage:", error);
      const local = getLocalStorageData("companies");
      const updated = local.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      saveLocalStorageData("companies", updated);
      return { id, ...updatedFields };
    }
  },

  async deleteCompany(id) {
    if (!isFirebaseOnline || !db || String(id).startsWith("local_comp")) {
      const local = getLocalStorageData("companies");
      const filtered = local.filter(item => item.id !== id);
      saveLocalStorageData("companies", filtered);
      return id;
    }
    try {
      const docRef = doc(db, "companies", id);
      await deleteDoc(docRef);
      const local = getLocalStorageData("companies");
      const filtered = local.filter(item => item.id !== id);
      saveLocalStorageData("companies", filtered);
      return id;
    } catch (error) {
      console.warn("Firestore delete error, removing from local storage:", error);
      const local = getLocalStorageData("companies");
      const filtered = local.filter(item => item.id !== id);
      saveLocalStorageData("companies", filtered);
      return id;
    }
  }
};
