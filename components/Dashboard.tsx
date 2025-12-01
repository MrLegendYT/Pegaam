import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Plus, Users, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import Logo from './Logo';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const docRef = await db.collection("rooms").add({
        name: roomName,
        ownerId: auth.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        joiners: [auth.currentUser.uid],
        joinerCount: 1
      });
      navigate(`/room/${docRef.id}`);
    } catch (err) {
      setError("Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    setError('');

    try {
      const roomRef = db.collection("rooms").doc(roomCode.trim());
      const roomSnap = await roomRef.get();

      if (roomSnap.exists) {
        await roomRef.update({
            joiners: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid),
            // Firestore increment is safer but for simplicity just using array update which triggers listener in Room
        });
        navigate(`/room/${roomCode.trim()}`);
      } else {
        setError("Invalid Room Code. Please check and try again.");
      }
    } catch (err) {
      setError("Failed to join room.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => auth.signOut();

  return (
    <div className="min-h-[100dvh] bg-dark-900 text-white flex flex-col">
      <header className="p-4 flex justify-between items-center bg-dark-800 border-b border-dark-700 sticky top-0 z-10 safe-area-top">
        <Logo />
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
                <img 
                    src={auth.currentUser?.photoURL || ''} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border border-dark-700"
                />
                <span className="text-sm font-medium">{auth.currentUser?.displayName}</span>
            </div>
            <button 
                onClick={handleSignOut}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-gray-400 hover:text-white active:scale-95"
                title="Sign Out"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 safe-area-bottom">
        {view === 'main' && (
          <div className="w-full max-w-lg space-y-6 animate-fade-in-up">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-display font-bold mb-2">Let's Start</h1>
              <p className="text-gray-400">Create a new space or join an existing one.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setView('create')}
                className="group relative h-40 bg-gradient-to-br from-accent to-rose-700 rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-accent/20 transition-all transform hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Create Room</h3>
                  <p className="text-white/80 text-sm">Start a new group chat</p>
                </div>
              </button>

              <button 
                onClick={() => setView('join')}
                className="group relative h-40 bg-dark-800 border border-dark-700 rounded-2xl p-6 flex flex-col justify-between hover:border-accent transition-all transform hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="bg-dark-700 w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 group-hover:text-accent transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Join Room</h3>
                  <p className="text-gray-400 text-sm group-hover:text-white transition-colors">Enter a room code</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="w-full max-w-md animate-fade-in-right">
             <button onClick={() => setView('main')} className="mb-6 text-sm text-gray-400 hover:text-white flex items-center gap-1 p-2 -ml-2 rounded-lg hover:bg-dark-800 transition-colors">
                ← Back
             </button>
             <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 shadow-xl">
                <h2 className="text-2xl font-bold mb-6">Create New Room</h2>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Room Name</label>
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white focus:border-accent focus:outline-none text-base"
                            placeholder="e.g. Friday Hangout"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-lg font-medium shadow-lg shadow-accent/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5"/> : (
                           <>Create & Enter <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </form>
             </div>
          </div>
        )}

        {view === 'join' && (
          <div className="w-full max-w-md animate-fade-in-right">
             <button onClick={() => setView('main')} className="mb-6 text-sm text-gray-400 hover:text-white flex items-center gap-1 p-2 -ml-2 rounded-lg hover:bg-dark-800 transition-colors">
                ← Back
             </button>
             <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 shadow-xl">
                <h2 className="text-2xl font-bold mb-6">Join Room</h2>
                {error && <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleJoinRoom} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Room Code</label>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white focus:border-accent focus:outline-none font-mono text-base"
                            placeholder="Paste code here"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-white text-dark-900 hover:bg-gray-200 py-3 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5"/> : (
                           <>Join Room <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </form>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;