import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Supabase from "../lib/supabase";

export default function Signup({ setCurrentUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [role, setRole] = useState("user");
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    // Basic validation
    if (!email || !password || !fullname) {
      toast.error("Please provide fullname, email and password.");
      return;
    }

    // If Supabase is configured, try to sign up there and write to public.users
    if (Supabase) {
      (async () => {
        try {
          // Sign up with metadata so role is stored in auth.users.user_metadata
          const { data, error } = await Supabase.auth.signUp({ 
            email, 
            password,
            options: {
              data: { role, fullname }
            }
          });
          if (error) {
            console.error('Supabase signUp error object:', error);
            toast.error(error.message || "Signup failed (check console)");
            return;
          }

          // Insert into public.users with fullname and role
          const user = data?.user || data;
          if (user && user.id) {
            const { error: insertErr } = await Supabase.from('users').insert([
              {
                id: user.id,
                email,
                fullname,
                role,
              }
            ]);

            if (insertErr) {
              console.warn('Insert into public.users failed:', insertErr.message);
              // continue anyway — user can still log in
            }
          }

          const uiUser = { email, fullname, role, isAdmin: role === 'admin' };
          localStorage.setItem("currentUser", JSON.stringify(uiUser));
          if (setCurrentUser) setCurrentUser(uiUser);
          toast.success("Account created! Welcome ✨", { style: { background: "#1f1f1f", color: "#fff" } });
          // If new account was created with admin role, redirect to admin dashboard
          if (uiUser.isAdmin) navigate('/admin');
          else navigate("/");
        } catch (err) {
          console.error(err);
          toast.error("Signup error");
        }
      })();
      return;
    }

    // Fallback: localStorage-based signup for dev/testing
    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find((u) => u.email === email)) {
      toast.error("User already exists. Try logging in.");
      return;
    }
    const user = { email, password, fullname, role };
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(user));
    if (setCurrentUser) setCurrentUser(user);
    toast.success("Account created! Welcome ✨", { style: { background: "#1f1f1f", color: "#fff" } });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-6">
      <form onSubmit={handleSignup} className="w-full max-w-md bg-neutral-800/70 backdrop-blur-xl rounded-2xl p-8 border border-orange-400/30">
        <h2 className="text-2xl font-bold text-orange-400 mb-4">Create Account</h2>
        <label className="block mb-2 text-gray-300">Full name</label>
        <input value={fullname} onChange={(e)=>setFullname(e.target.value)} className="w-full p-3 mb-4 rounded-xl bg-neutral-900 text-gray-200 border border-orange-400/20" placeholder="Your full name" />

        <label className="block mb-2 text-gray-300">Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-3 mb-4 rounded-xl bg-neutral-900 text-gray-200 border border-orange-400/20" placeholder="you@example.com" />

        <label className="block mb-2 text-gray-300">Password</label>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className="w-full p-3 mb-4 rounded-xl bg-neutral-900 text-gray-200 border border-orange-400/20" placeholder="Choose a password" />

        <label className="block mb-2 text-gray-300">Role</label>
        <select value={role} onChange={(e)=>setRole(e.target.value)} className="w-full p-3 mb-6 rounded-xl bg-neutral-900 text-gray-200 border border-orange-400/20">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button className="w-full bg-orange-400 text-neutral-900 px-5 py-3 rounded-xl font-semibold">Sign Up</button>
      </form>
    </div>
  );
}
