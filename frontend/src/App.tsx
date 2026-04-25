import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import Navbar from './components/Navbar';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';

import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  user: User | null;
  onboarded: boolean | null;
  children: React.ReactNode;
}

const ProtectedRoute = ({ user, onboarded, children }: ProtectedRouteProps) => {
  if (!user) return <Navigate to="/login" />;
  if (onboarded === false) return <Navigate to="/onboarding" />;
  return <>{children}</>;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().onboarded) {
            setOnboarded(true);
          } else {
            setOnboarded(false);
          }
        } catch (error) {
          console.error("Firestore permission error or other error:", error);
          // If we can't read the profile, assume not onboarded or show error
          setOnboarded(false);
        }
      } else {
        onboarded !== null && setOnboarded(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Auth error:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Preparing your kitchen...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {user && onboarded === true && <Navbar user={user} />}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/onboarding" element={user && onboarded === false ? <Onboarding onComplete={() => setOnboarded(true)} /> : <Navigate to="/" />} />
            <Route path="/" element={<ProtectedRoute user={user} onboarded={onboarded}><Dashboard /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute user={user} onboarded={onboarded}><Upload /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute user={user} onboarded={onboarded}><Profile /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
