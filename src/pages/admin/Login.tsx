import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetKey, setResetKey] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login with:", { email, password });
      
      const { data: adminUser, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .single();

      console.log("Database query result:", { adminUser, error });

      if (error || !adminUser) {
        console.log("No user found or database error");
        setError("Invalid username or password");
        return;
      }

      console.log("Comparing passwords...", { 
        inputPassword: password, 
        storedHash: adminUser.password_hash 
      });

      const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
      console.log("Password comparison result:", isPasswordValid);

      if (isPasswordValid) {
        localStorage.setItem("admin", "true");
        localStorage.setItem("adminEmail", email);
        navigate("/admin");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);

    if (!email) {
      setResetError("Please enter the admin email above first.");
      return;
    }
    if (resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError("Passwords do not match.");
      return;
    }
    if (!resetKey) {
      setResetError("Reset key is required.");
      return;
    }

    try {
      setResetLoading(true);
      const { data, error } = await supabase.functions.invoke("reset_admin_password", {
        body: { email, newPassword: resetPassword },
        headers: { "x-reset-key": resetKey },
      });
      if (error) throw error;
      setResetMessage("Password has been reset. You can now sign in.");
      setResetPassword("");
      setResetConfirm("");
    } catch (err: any) {
      setResetError(err?.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Sign in to the admin portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Admin Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Reset admin password</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset admin password</DialogTitle>
                  <DialogDescription>
                    Enter a new password for the admin account. You will need the reset key.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {resetError && (
                    <Alert variant="destructive">
                      <AlertDescription>{resetError}</AlertDescription>
                    </Alert>
                  )}
                  {resetMessage && (
                    <Alert>
                      <AlertDescription>{resetMessage}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Admin Email</label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <Input value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} type="password" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm Password</label>
                    <Input value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} type="password" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reset Key</label>
                    <Input value={resetKey} onChange={(e) => setResetKey(e.target.value)} type="text" required />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={resetLoading}>
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}