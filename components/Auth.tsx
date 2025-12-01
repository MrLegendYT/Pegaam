import React, { useState } from 'react';
import { auth } from "../firebase";
import { uploadImageToImgBB } from "../services/imgbb";
import { Loader2, Upload, Mail, Lock, User } from "lucide-react";
import Logo from "./Logo";

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        // Signup Flow
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        let photoURL = '';

        if (profileImage) {
          photoURL = await uploadImageToImgBB(profileImage);
        } else {
            // Default placeholder if no image
            photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff4b5c&color=fff`;
        }

        if (userCredential.user) {
          await userCredential.user.updateProfile({
            displayName: name || 'User',
            photoURL: photoURL
          });
        }
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-dark-900 text-white">
      <div className="mb-8 animate-fade-in-down">
        <Logo className="scale-125" />
      </div>

      <div className="w-full max-w-md bg-dark-800 rounded-2xl p-8 shadow-2xl border border-dark-700">
        <h2 className="text-2xl font-display font-bold mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="flex justify-center mb-6">
                <label className="cursor-pointer group relative w-24 h-24 rounded-full bg-dark-700 border-2 border-dashed border-dark-700 hover:border-accent flex flex-col items-center justify-center transition-all overflow-hidden">
                   {profileImage ? (
                     <img src={URL.createObjectURL(profileImage)} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                     <>
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-accent mb-1" />
                        <span className="text-[10px] text-gray-400">Photo</span>
                     </>
                   )}
                   <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setProfileImage(e.target.files?.[0] || null)} 
                   />
                </label>
              </div>

              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Display Name"
                  className="w-full bg-dark-900 border border-dark-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-base"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-dark-900 border border-dark-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-dark-900 border border-dark-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-lg shadow-lg shadow-accent/20 transition-all flex items-center justify-center mt-6 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent hover:text-white font-medium transition-colors"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;