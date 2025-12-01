import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import firebase from 'firebase/compat/app';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Room from './components/Room';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route path="/room/:roomId" element={user ? <Room /> : <Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
};

export default App;