import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Supabase from "../lib/supabase";

export default function Login({ setCurrentUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please provide email and password.");
      return;
    }

    // If Supabase is configured, use Supabase Auth
    if (Supabase) {
      (async () => {
        try {
          const { data, error } = await Supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('Supabase login error:', error);
            toast.error(error.message || "Login failed");
            return;
          }

          // Fetch user profile from public.users to get fullname and role
          const user = data?.user;
          if (user && user.id) {
            let profileData = null;
            try {
              const { data, error: profileErr } = await Supabase
                .from('users')
                .select('email, fullname, role')
                .eq('id', user.id)
                .single();
              if (profileErr) {
                console.warn('Could not fetch profile:', profileErr.message);
              } else {
                profileData = data;
              }
            } catch (err) {
              console.error('Profile fetch exception', err);
            }

            // Determine role: try profile data first, then check auth metadata, default to 'user'
            let role = profileData?.role || user.user_metadata?.role || 'user';
            const uiUser = {
              id: user.id,
              email: profileData?.email || email,
              fullname: profileData?.fullname || '',
              role,
              isAdmin: role === 'admin',
            };

            localStorage.setItem('currentUser', JSON.stringify(uiUser));
            if (setCurrentUser) setCurrentUser(uiUser);
            toast.success('Welcome back! ✨', { style: { background: '#1f1f1f', color: '#fff' } });
            // redirect admin users to admin dashboard
            if (uiUser.isAdmin) navigate('/admin');
            else navigate('/');
          }
        } catch (err) {
          console.error(err);
          toast.error('Login error');
        }
      })();
      return;
    }

    // Fallback: localStorage-based login for dev/testing
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
      localStorage.setItem('currentUser', JSON.stringify(found));
      if (setCurrentUser) setCurrentUser(found);
      toast.success('Welcome back! ✨', { style: { background: '#1f1f1f', color: '#fff' } });
      navigate('/');
    } else {
      toast.error('Invalid credentials — try signing up.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-6">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-neutral-800/70 backdrop-blur-xl rounded-2xl p-8 border border-orange-400/30">
        <h2 className="text-2xl font-bold text-orange-400 mb-4">Log In</h2>
        <label className="block mb-2 text-gray-300">Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-3 mb-4 rounded-xl bg-neutral-900 text-gray-200 border border-orange-400/20" placeholder="user@example.com" />
        <label className="block mb-2 text-gray-300">Password</label>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className="w-full p-3 mb-6 rounded-xl bg-neutral-900 text-gray-200 border border-orange-400/20" placeholder="••••••••••••" />
        <button className="w-full bg-orange-400 text-neutral-900 px-5 py-3 rounded-xl font-semibold">Login</button>
      </form>
    </div>
  );
}
