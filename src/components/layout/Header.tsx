import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";

type ProfilePublic = {
  display_handle: string | null;
  avatar_url: string | null;
};

export default function Header() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const [isAuthed, setIsAuthed] = useState(false);
  const [handle, setHandle] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      setIsAuthed(!!user);

      if (user) {
        // Privacy-aligned: fetch only public profile columns
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_handle, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (!mounted) return;
        setHandle(prof?.display_handle ?? null);
        setAvatarUrl(prof?.avatar_url ?? null);
      } else {
        setHandle(null);
        setAvatarUrl(null);
      }
    }

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const user = session?.user ?? null;
      setIsAuthed(!!user);
      if (!user) {
        setHandle(null);
        setAvatarUrl(null);
      } else {
        supabase
          .from("profiles")
          .select("display_handle, avatar_url")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data: prof }) => {
            if (!mounted) return;
            setHandle(prof?.display_handle ?? null);
            setAvatarUrl(prof?.avatar_url ?? null);
          });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    nav("/");
  }

  const link = "text-sky-900 hover:text-sky-950 hover:underline";
  const cta  = "rounded-2xl border border-sky-400 text-sky-900 px-3 py-1 shadow-sm hover:bg-sky-100";

  return (
    <header className="sticky top-0 z-20 w-full border-b border-sky-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight">Website V2</Link>

        <nav className="flex items-center gap-6 text-sm" aria-label="Primary">
          <Link className={link} to="/feed" aria-current={pathname === "/feed" ? "page" : undefined}>Feed</Link>
          <Link className={link} to="/pulse" aria-current={pathname === "/pulse" ? "page" : undefined}>Community Pulse</Link>

          {isAuthed ? (
            <>
              <Link className={link} to="/inbox">Inbox</Link>
              <Link className={link} to="/settings/profile">Profile</Link>

              {/* Handle (no email) to respect privacy defaults */}
              {handle && (
                <span className="hidden sm:inline text-neutral-600" aria-label="Signed in as">
                  {handle}
                </span>
              )}
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Your avatar"
                  className="hidden h-6 w-6 rounded-full sm:inline"
                />
              )}

              <button
                onClick={handleSignOut}
                className="rounded-2xl bg-sky-700 px-3 py-1 text-white hover:bg-sky-800"
                aria-label="Log out"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className={link} to="/auth/signin">Log in</Link>
              <Link className={cta} to="/auth/signup">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}