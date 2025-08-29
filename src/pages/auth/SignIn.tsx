import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase/client"; // reuse your existing client

export default function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
    else nav("/feed");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-sm text-neutral-600">Welcome back.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sky-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sky-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-sky-700 px-4 py-2 text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-4 text-sm">
        <Link to="/auth/signup" className="text-sky-900 underline">
          Need an account? Sign up
        </Link>
      </div>
    </main>
  );
}