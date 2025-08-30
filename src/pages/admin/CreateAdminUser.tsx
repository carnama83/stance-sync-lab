import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, CheckCircle } from "lucide-react";

export default function CreateAdminUser() {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // We stored the admin's email at login
  const adminEmail = localStorage.getItem("adminEmail") || "";
  const [adminPassword, setAdminPassword] = useState("");

  async function handleCreate() {
    setError(null);
    setConfirmMsg(null);

    if (!adminEmail) {
      setError("Missing admin session. Please log out and log in again.");
      return;
    }
    if (!newEmail || !newPassword) {
      setError("Provide new admin email and password.");
      return;
    }
    if (!adminPassword) {
      setError("Please confirm your admin password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("admin_create_admin" as any, {
        p_admin_email: adminEmail,
        p_admin_password: adminPassword,
        p_email: newEmail,
        p_password: newPassword,
      });

      if (error) {
        setError(error.message || "Failed to create admin.");
        return;
      }
      if (data) {
        setConfirmMsg("Admin user created/updated successfully.");
        setNewEmail("");
        setNewPassword("");
        setAdminPassword("");
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <CardTitle>Create Admin User</CardTitle>
          </div>
          <CardDescription>
            Create a new administrator account for the admin portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {confirmMsg && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{confirmMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="current-admin-email" className="text-sm font-medium">
                Your Admin Email
              </label>
              <Input
                id="current-admin-email"
                type="email"
                value={adminEmail}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password-confirm" className="text-sm font-medium">
                Confirm Your Admin Password
              </label>
              <Input
                id="admin-password-confirm"
                type="password"
                placeholder="Your admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-admin-email" className="text-sm font-medium">
                New Admin Email
              </label>
              <Input
                id="new-admin-email"
                type="email"
                placeholder="new-admin@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-admin-password" className="text-sm font-medium">
                New Admin Password
              </label>
              <Input
                id="new-admin-password"
                type="password"
                placeholder="Choose a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Admin..." : "Create / Update Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}