import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ModerationDashboard } from '@/components/moderation/ModerationDashboard';
import { HOACreationRequests } from '@/components/admin/HOACreationRequests';
import { RolePromotionRequests } from '@/components/admin/RolePromotionRequests';
import { UserManagement } from '@/components/admin/UserManagement';
import { BulkHOAUpload } from '@/components/admin/BulkHOAUpload';
import { DeletionManagement } from '@/components/admin/DeletionManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Building2, Upload, Users, Search, MapPin, ExternalLink, Crown, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HOACommunity {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  zip_code: string;
  unit_count: number;
  created_at: string;
  description_public: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [communities, setCommunities] = useState<HOACommunity[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<HOACommunity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(false);

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

  const fetchAllCommunities = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hoas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
      setFilteredCommunities(data || []);
    } catch (error: any) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllCommunities();
    }
  }, [isAdmin]);

  useEffect(() => {
    let filtered = communities;

    // Filter by search term (name, city, state, zip)
    if (searchTerm) {
      filtered = filtered.filter(community => 
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.zip_code?.includes(searchTerm)
      );
    }

    // Filter by state
    if (stateFilter) {
      filtered = filtered.filter(community => community.state === stateFilter);
    }

    setFilteredCommunities(filtered);
  }, [searchTerm, stateFilter, communities]);

  const getUniqueStates = () => {
    return Array.from(new Set(communities.map(c => c.state).filter(Boolean))).sort();
  };
  
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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              All Communities
            </TabsTrigger>
            <TabsTrigger value="hoa-requests" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              HOA Requests
            </TabsTrigger>
            <TabsTrigger value="role-requests" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Requests
            </TabsTrigger>
            <TabsTrigger value="bulk-hoa" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk HOA Upload
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="deletion" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Deletion Management
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="moderation" className="mt-6">
            <ModerationDashboard />
          </TabsContent>

          <TabsContent value="communities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  All HOA Communities ({filteredCommunities.length})
                </CardTitle>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search communities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="px-3 py-1 border border-input rounded-md text-sm bg-background"
                  >
                    <option value="">All States</option>
                    {getUniqueStates().map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading communities...</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCommunities.map((community) => (
                      <Card key={community.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{community.name}</CardTitle>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {community.city}, {community.state} {community.zip_code}
                              </div>
                            </div>
                            <Badge variant="outline">{community.unit_count} units</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {community.description_public && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {community.description_public}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/hoa/${community.slug}`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Star className="h-3 w-3" />
                                Public Page
                              </Button>
                            </Link>
                            <Link to={`/community/${community.slug}`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Shield className="h-3 w-3" />
                                Private Portal
                              </Button>
                            </Link>
                            <Link to={`/community/${community.slug}/dashboard`}>
                              <Button variant="default" size="sm" className="gap-1">
                                <Crown className="h-3 w-3" />
                                Admin Dashboard
                              </Button>
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(community.created_at).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {!loading && filteredCommunities.length === 0 && (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No communities found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || stateFilter ? 'Try adjusting your search filters' : 'No HOA communities have been created yet'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hoa-requests" className="mt-6">
            <HOACreationRequests />
          </TabsContent>

          <TabsContent value="role-requests" className="mt-6">
            <RolePromotionRequests />
          </TabsContent>

          <TabsContent value="bulk-hoa" className="mt-6">
            <BulkHOAUpload />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="deletion" className="mt-6">
            <DeletionManagement />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditLogViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};