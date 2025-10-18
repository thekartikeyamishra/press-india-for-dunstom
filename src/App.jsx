import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase.js';

// Pages
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';
import LegalPages from './pages/LegalPages.jsx';

// Profile & Verification
import ProfileSetup from './components/profile/ProfileSetup.jsx';
import ProfileVerification from './components/profile/ProfileVerification.jsx';

// Article Management
import ArticleEditor from './components/article/ArticleEditor.jsx';
import MyArticles from './pages/MyArticles.jsx';

// Grievance
import GrievanceForm from './components/grievance/GrievanceForm.jsx';
import MyGrievances from './pages/MyGrievances.jsx';

// Layout
import MainLayout from './components/layout/MainLayout.jsx';
import Loader from './components/common/Loader.jsx';
import SecretDeveloper from './components/common/SecretDeveloper.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <Loader />;

  return (
    <Router>
      <SecretDeveloper />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/auth" 
          element={!user ? <Auth /> : <Navigate to="/" />} 
        />
        
        {/* Legal Pages - Public */}
        <Route 
          path="/legal/:page" 
          element={<MainLayout><LegalPages /></MainLayout>} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={user ? <MainLayout><Dashboard /></MainLayout> : <Navigate to="/auth" />} 
        />
        
        <Route 
          path="/profile" 
          element={user ? <MainLayout><Profile /></MainLayout> : <Navigate to="/auth" />} 
        />
        
        <Route 
          path="/profile/setup" 
          element={user ? <ProfileSetup /> : <Navigate to="/auth" />} 
        />
        
        <Route 
          path="/profile/verification" 
          element={user ? <ProfileVerification /> : <Navigate to="/auth" />} 
        />
        
        {/* Article Routes */}
        <Route 
          path="/articles/new" 
          element={user ? <MainLayout><ArticleEditor /></MainLayout> : <Navigate to="/auth" />} 
        />
        
        <Route 
          path="/articles/my" 
          element={user ? <MainLayout><MyArticles /></MainLayout> : <Navigate to="/auth" />} 
        />
        
        <Route 
          path="/articles/edit/:id" 
          element={user ? <MainLayout><ArticleEditor /></MainLayout> : <Navigate to="/auth" />} 
        />
        
        {/* Grievance Routes */}
        <Route 
          path="/grievances/report" 
          element={user ? <MainLayout><GrievanceForm /></MainLayout> : <Navigate to="/auth" />} 
        />
        
        <Route 
          path="/grievances/my" 
          element={user ? <MainLayout><MyGrievances /></MainLayout> : <Navigate to="/auth" />} 
        />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;