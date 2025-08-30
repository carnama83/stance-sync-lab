import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import UserManagement from "./UserManagement";
import NewsSourcesManagement from "./NewsSourcesManagement";
import CreateAdminUser from "./CreateAdminUser";

export default function AdminPortal() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin");
    if (!isAdmin) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminEmail");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Admin Portal</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="sources">News Sources</TabsTrigger>
            <TabsTrigger value="create-admin">Create Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="sources" className="mt-6">
            <NewsSourcesManagement />
          </TabsContent>
          
          <TabsContent value="create-admin" className="mt-6">
            <CreateAdminUser />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}