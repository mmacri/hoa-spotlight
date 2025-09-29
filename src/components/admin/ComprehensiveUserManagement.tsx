import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Search, 
  Shield, 
  Crown, 
  User,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Edit,
  UserPlus,
  UserMinus,
  Settings,
  MapPin,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

interface HOACommunity {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  zip_code: string;
  unit_count: number;
  created_at: string;
}

interface Membership {
  id: string;
  user_id: string;
  hoa_id: string;
  role: 'MEMBER' | 'ADMIN' | 'PRESIDENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user?: UserProfile;
  hoa?: HOACommunity;
}

export const ComprehensiveUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [communities, setCommunities] = useState<HOACommunity[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Dialog states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', full_name: '', email: '', password: '' });
  const [newCommunity, setNewCommunity] = useState({
    name: '', city: '', state: '', zip_code: '', unit_count: '', 
    description_public: '', amenities: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, communitiesRes, membershipsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, is_admin, created_at')
          .order('full_name', { ascending: true }),
        
        supabase
          .from('hoas')
          .select('id, name, slug, city, state, zip_code, unit_count, created_at')
          .order('state', { ascending: true }),
        
        supabase
          .from('memberships')
          .select('id, user_id, hoa_id, role, status')
          .eq('status', 'APPROVED')
          .order('role', { ascending: false })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (communitiesRes.error) throw communitiesRes.error;
      if (membershipsRes.error) throw membershipsRes.error;
      
      setUsers(usersRes.data || []);
      setCommunities(communitiesRes.data || []);
      setMemberships(membershipsRes.data || []);

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

  const addUser = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: newUser.username,
            full_name: newUser.full_name
          });

        if (profileError) throw profileError;
      }

      toast({
        title: "Success",
        description: "User added successfully"
      });

      setNewUser({ username: '', full_name: '', email: '', password: '' });
      setShowAddUser(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully"
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

  const addCommunity = async () => {
    try {
      const amenitiesArray = newCommunity.amenities ? newCommunity.amenities.split(',').map(a => a.trim()) : [];
      
      const { error } = await supabase
        .from('hoas')
        .insert({
          name: newCommunity.name,
          slug: newCommunity.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          city: newCommunity.city,
          state: newCommunity.state,
          zip_code: newCommunity.zip_code,
          unit_count: parseInt(newCommunity.unit_count) || null,
          description_public: newCommunity.description_public,
          amenities: amenitiesArray
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Community added successfully"
      });

      setNewCommunity({
        name: '', city: '', state: '', zip_code: '', unit_count: '', 
        description_public: '', amenities: ''
      });
      setShowAddCommunity(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteCommunity = async (hoaId: string) => {
    try {
      const { error } = await supabase
        .from('hoas')
        .delete()
        .eq('id', hoaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Community deleted successfully"
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

  const promoteUser = async (membershipId: string, newRole: 'MEMBER' | 'ADMIN' | 'PRESIDENT') => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ role: newRole })
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'all' || community.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const filteredMemberships = memberships.filter(membership => {
    const user = users.find(u => u.id === membership.user_id);
    const community = communities.find(c => c.id === membership.hoa_id);
    
    const matchesSearch = !searchTerm || 
      user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCommunity = communityFilter === 'all' || membership.hoa_id === communityFilter;
    const matchesRole = roleFilter === 'all' || membership.role === roleFilter;
    const matchesState = stateFilter === 'all' || community?.state === stateFilter;
    
    return matchesSearch && matchesCommunity && matchesRole && matchesState;
  }).map(membership => ({
    ...membership,
    user: users.find(u => u.id === membership.user_id),
    hoa: communities.find(c => c.id === membership.hoa_id)
  }));

  const uniqueStates = [...new Set(communities.map(c => c.state))].filter(Boolean).sort();

  if (loading) {
    return <div className="text-center py-8">Loading user management data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Comprehensive User Management</h2>
        <p className="text-muted-foreground">
          Manage users, communities, and role assignments with powerful filtering and search
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <Building2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{communities.length}</p>
                <p className="text-sm text-muted-foreground">Communities</p>
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
              <Crown className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{memberships.filter(m => m.role === 'PRESIDENT').length}</p>
                <p className="text-sm text-muted-foreground">HOA Presidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Settings className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{memberships.filter(m => m.role === 'ADMIN').length}</p>
                <p className="text-sm text-muted-foreground">HOA Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="communities">
            <Building2 className="h-4 w-4 mr-2" />
            Communities ({communities.length})
          </TabsTrigger>
          <TabsTrigger value="memberships">
            <Settings className="h-4 w-4 mr-2" />
            Role Management ({memberships.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by name or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                    <Button onClick={addUser} className="w-full">Add User</Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(user.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="communities" className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={showAddCommunity} onOpenChange={setShowAddCommunity}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Community
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Community</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Community Name</Label>
                        <Input
                          id="name"
                          value={newCommunity.name}
                          onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
                          placeholder="Sunshine HOA"
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit_count">Unit Count</Label>
                        <Input
                          id="unit_count"
                          type="number"
                          value={newCommunity.unit_count}
                          onChange={(e) => setNewCommunity({...newCommunity, unit_count: e.target.value})}
                          placeholder="100"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={newCommunity.city}
                          onChange={(e) => setNewCommunity({...newCommunity, city: e.target.value})}
                          placeholder="Phoenix"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={newCommunity.state}
                          onChange={(e) => setNewCommunity({...newCommunity, state: e.target.value})}
                          placeholder="AZ"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip_code">Zip Code</Label>
                        <Input
                          id="zip_code"
                          value={newCommunity.zip_code}
                          onChange={(e) => setNewCommunity({...newCommunity, zip_code: e.target.value})}
                          placeholder="85001"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newCommunity.description_public}
                        onChange={(e) => setNewCommunity({...newCommunity, description_public: e.target.value})}
                        placeholder="Community description..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="amenities">Amenities (comma separated)</Label>
                      <Input
                        id="amenities"
                        value={newCommunity.amenities}
                        onChange={(e) => setNewCommunity({...newCommunity, amenities: e.target.value})}
                        placeholder="Pool, Gym, Tennis Court"
                      />
                    </div>
                    
                    <Button onClick={addCommunity} className="w-full">Add Community</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {filteredCommunities.map((community) => (
                <Card key={community.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{community.name}</h3>
                          <Badge variant="secondary">
                            <MapPin className="h-3 w-3 mr-1" />
                            {community.city}, {community.state}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {community.unit_count} units • Created {new Date(community.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Community</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this community? This will also delete all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCommunity(community.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="memberships" className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search members by name, community..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={communityFilter} onValueChange={setCommunityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by community" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Communities</SelectItem>
                  {communities.map(community => (
                    <SelectItem key={community.id} value={community.id}>{community.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="PRESIDENT">President</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredMemberships.map((membership) => {
                const RoleIcon = getRoleIcon(membership.role);
                return (
                  <Card key={membership.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">
                              {membership.user?.full_name || membership.user?.username || 'Unknown User'}
                            </h3>
                            <Badge variant={membership.role === 'PRESIDENT' ? 'default' : membership.role === 'ADMIN' ? 'secondary' : 'outline'}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {membership.role}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            Community: {membership.hoa?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Location: {membership.hoa?.city}, {membership.hoa?.state}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <Select
                            value={membership.role}
                            onValueChange={(newRole) => promoteUser(membership.id, newRole as 'MEMBER' | 'ADMIN' | 'PRESIDENT')}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="PRESIDENT">President</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};