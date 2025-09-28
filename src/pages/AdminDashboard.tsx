import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ModerationDashboard } from '@/components/moderation/ModerationDashboard';
import { HOACreationRequests } from '@/components/admin/HOACreationRequests';
import { BulkHOAUpload } from '@/components/admin/BulkHOAUpload';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Building2, Upload, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and moderate the HOAdoor platform
          </p>
        </div>

        <Tabs defaultValue="moderation" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="hoa-requests" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              HOA Requests
            </TabsTrigger>
            <TabsTrigger value="bulk-hoa" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk HOA Upload
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="moderation" className="mt-6">
            <ModerationDashboard />
          </TabsContent>

          <TabsContent value="hoa-requests" className="mt-6">
            <HOACreationRequests />
          </TabsContent>

          <TabsContent value="bulk-hoa" className="mt-6">
            <BulkHOAUpload />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">User management features coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};