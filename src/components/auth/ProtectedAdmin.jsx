// E:\press-india\src\components\auth\ProtectedAdmin.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import toast from "react-hot-toast";

/**
 * ProtectedAdmin — Route guard for admin-only access
 * --------------------------------------------------
 * Wraps around sensitive admin pages such as:
 * <ProtectedAdmin><AdminDashboard /></ProtectedAdmin>
 *
 * ✅ Checks Firebase Authentication
 * ✅ Confirms admin role from Firestore `users/{uid}`
 * ✅ Handles loading state gracefully
 * ✅ Shows friendly error for unauthorized users
 */

const ProtectedAdmin = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Watch for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      try {
        // Fetch user document to check role
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.role && String(data.role).toLowerCase() === "admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        toast.error("Error verifying admin privileges");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // While verifying admin status
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-600">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Verifying admin privileges...</p>
      </div>
    );
  }

  // Not signed in → redirect to login
  if (!user) {
    toast.error("Please log in to access this page");
    return <Navigate to="/auth" replace />;
  }

  // Not an admin → redirect to homepage
  if (!isAdmin) {
    toast.error("Access denied — admin only");
    return <Navigate to="/" replace />;
  }

  // Authorized → render admin content
  return <>{children}</>;
};

export default ProtectedAdmin;
