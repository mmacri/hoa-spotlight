import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Shield, 
  Crown, 
  User,
  Building2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

interface AllRequests {
  membershipRequests: any[];
  hoaCreationRequests: any[];
  rolePromotionRequests: any[];
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allRequests, setAllRequests] = useState<AllRequests>({
    membershipRequests: [],
    hoaCreationRequests: [],
    rolePromotionRequests: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, membershipRes, hoaRequestsRes, rolePromotionRes] = await Promise.all([
        // Fetch all users with their profiles
        supabase
          .from('profiles')
          .select(`
            id,
            username,
            full_name,
            is_admin,
            created_at
          `)
          .order('created_at', { ascending: false }),
        
        // Fetch all pending membership requests
        supabase
          .from('memberships')
          .select(`
            id,
            user_id,
            hoa_id,
            role,
            status,
            requested_at,
            hoa:hoas(name),
            user:profiles(full_name, username)
          `)
          .eq('status', 'PENDING')
          .order('requested_at', { ascending: true }),
        
        // Fetch all pending HOA creation requests
        supabase
          .from('hoa_creation_requests')
          .select(`
            id,
            name,
            requester_user_id,
            status,
            created_at,
            city,
            state,
            requester:profiles(full_name, username)
          `)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true }),
        
        // Fetch all pending role promotion requests
        supabase
          .from('role_promotion_requests')
          .select(`
            id,
            requester_user_id,
            hoa_id,
            current_membership_role,
            requested_role,
            status,
            created_at,
            hoa:hoas(name),
            requester:profiles(full_name, username)
          `)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true })
      ]);

      if (usersRes.error) throw usersRes.error;
      
      setUsers(usersRes.data || []);
      setAllRequests({
        membershipRequests: membershipRes.data || [],
        hoaCreationRequests: hoaRequestsRes.data || [],
        rolePromotionRequests: rolePromotionRes.data || []
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load user management data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'promoted to' : 'removed from'} admin`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PRESIDENT':
        return Crown;
      case 'ADMIN':
        return Shield;
      default:
        return User;
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPendingRequests = 
    allRequests.membershipRequests.length + 
    allRequests.hoaCreationRequests.length + 
    allRequests.rolePromotionRequests.length;

  if (loading) {
    return <div className="text-center py-8">Loading user management data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">User Management</h2>
        <p className="text-muted-foreground">
          Manage platform users and review pending requests
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.is_admin).length}</p>
                <p className="text-sm text-muted-foreground">Platform Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalPendingRequests}</p>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{allRequests.hoaCreationRequests.length}</p>
                <p className="text-sm text-muted-foreground">HOA Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            All Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="membership-requests">
            <User className="h-4 w-4 mr-2" />
            Memberships ({allRequests.membershipRequests.length})
          </TabsTrigger>
          <TabsTrigger value="role-requests">
            <Shield className="h-4 w-4 mr-2" />
            Role Requests ({allRequests.rolePromotionRequests.length})
          </TabsTrigger>
          <TabsTrigger value="hoa-requests">
            <Building2 className="h-4 w-4 mr-2" />
            HOA Requests ({allRequests.hoaCreationRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">
                            {user.full_name || user.username || 'No name'}
                          </h3>
                          {user.is_admin && (
                            <Badge variant="destructive">
                              <Shield className="h-3 w-3 mr-1" />
                              Platform Admin
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          @{user.username} • Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>

                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant={user.is_admin ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="membership-requests" className="mt-6">
          <div className="space-y-4">
            {allRequests.membershipRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {request.user?.full_name || request.user?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requesting to join: {request.hoa?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {allRequests.membershipRequests.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending membership requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="role-requests" className="mt-6">
          <div className="space-y-4">
            {allRequests.rolePromotionRequests.map((request) => {
              const FromIcon = getRoleIcon(request.current_membership_role);
              const ToIcon = getRoleIcon(request.requested_role);
              
              return (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {request.requester?.full_name || request.requester?.username || 'Unknown User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          In: {request.hoa?.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <FromIcon className="h-4 w-4" />
                          <span className="text-sm">{request.current_membership_role}</span>
                          <span className="text-muted-foreground">→</span>
                          <ToIcon className="h-4 w-4" />
                          <span className="text-sm">{request.requested_role}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {allRequests.rolePromotionRequests.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending role promotion requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="hoa-requests" className="mt-6">
          <div className="space-y-4">
            {allRequests.hoaCreationRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{request.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested by: {request.requester?.full_name || request.requester?.username || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Location: {request.city}, {request.state}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {allRequests.hoaCreationRequests.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending HOA creation requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};