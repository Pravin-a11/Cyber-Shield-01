import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { auth, db } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore(state => state.setAuth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'citizen' as 'citizen' | 'officer'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          let role = userData.role;
          
          // Auto-upgrade the admin email to officer if they are currently a citizen
          if (userCredential.user.email === 'hp949504@gmail.com' && role !== 'officer') {
            await setDoc(doc(db, 'users', userCredential.user.uid), { role: 'officer' }, { merge: true });
            role = 'officer';
          }

          setAuth({
            uid: userCredential.user.uid,
            email: userCredential.user.email!,
            name: userData.name,
            role: role,
            rank: userData.rank
          });
        } else {
          setError('User profile not found');
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.name });
        
        const userData = {
          uid: userCredential.user.uid,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          created_at: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        
        setAuth({
          uid: userCredential.user.uid,
          email: formData.email,
          name: formData.name,
          role: formData.role
        });
      }
    } catch (err: any) {
      if (err.code && err.code.startsWith('auth/')) {
        console.error('Auth error:', err);
        setError(err.message || 'Authentication failed');
      } else {
        handleFirestoreError(err, OperationType.WRITE, 'users');
        setError('A database error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/30 shadow-[0_0_30px_var(--accent-color)]/20">
            <Shield className="w-8 h-8 text-accent" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2 tracking-tight text-primary">
          {isLogin ? 'Welcome Back' : 'Join the Force'}
        </h2>
        <p className="text-secondary text-center mb-8 text-sm">
          {isLogin ? 'Access the CyberShield Omega intelligence network' : 'Register for the national cybercrime portal'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full cyber-input pl-11 bg-[var(--bg-primary)] border-border-custom text-primary"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'citizen' })}
                  className={cn(
                    "py-2 rounded-lg border transition-all text-sm font-medium",
                    formData.role === 'citizen' ? "bg-accent/10 border-accent text-accent" : "border-border-custom text-secondary"
                  )}
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'officer' })}
                  className={cn(
                    "py-2 rounded-lg border transition-all text-sm font-medium",
                    formData.role === 'officer' ? "bg-accent/10 border-accent text-accent" : "border-border-custom text-secondary"
                  )}
                >
                  Officer
                </button>
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-secondary" />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full cyber-input pl-11 bg-[var(--bg-primary)] border-border-custom text-primary"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-secondary" />
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full cyber-input pl-11 bg-[var(--bg-primary)] border-border-custom text-primary"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20"
            >
              {error}
            </motion.p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full cyber-button py-3 flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Login to Network' : 'Create Account'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-secondary hover:text-accent text-sm transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
