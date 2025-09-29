import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Crown, Trash2, Search, UserMinus, UserPlus, Edit } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN' | 'PRESIDENT';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  approved_at: string;
  created_at: string;
  user_profile?: {
    username: string;
    full_name: string;
  };
}

interface CommunityMemberManagementProps {
  hoaId: string;
  hoaName: string;
  isAdmin?: boolean;
  isPlatformAdmin?: boolean;
}

export const CommunityMemberManagement: React.FC<CommunityMemberManagementProps> = ({
  hoaId,
  hoaName,
  isAdmin = false,
  isPlatformAdmin = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [hoaId]);

  const loadMembers = async () => {
    try {
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('hoa_id', hoaId)
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = (memberships || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', userIds);

      const enrichedMembers = (memberships || []).map(member => ({
        ...member,
        user_profile: profiles?.find(p => p.id === member.user_id)
      }));

      setMembers(enrichedMembers);
    } catch (error: any) {
      toast({
        title: "Error loading members",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (membershipId: string, newRole: 'MEMBER' | 'ADMIN' | 'PRESIDENT') => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ role: newRole })
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `Member role updated to ${newRole.toLowerCase()}`
      });

      loadMembers();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const removeMember = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Member has been removed from the community"
      });

      loadMembers();
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const inviteNewMember = async () => {
    if (!newMemberEmail.trim()) return;

    setInviting(true);
    try {
      // First check if user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newMemberEmail)
        .single();

      if (profileError) {
        toast({
          title: "User not found",
          description: "No user found with that email. They need to register first.",
          variant: "destructive"
        });
        return;
      }

      // Check if already a member
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id')
        .eq('hoa_id', hoaId)
        .eq('user_id', profile.id)
        .single();

      if (existingMembership) {
        toast({
          title: "Already a member",
          description: "This user is already a member of this community",
          variant: "destructive"
        });
        return;
      }

      // Create membership
      const { error } = await supabase
        .from('memberships')
        .insert({
          hoa_id: hoaId,
          user_id: profile.id,
          role: newMemberRole,
          status: 'APPROVED',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Member added",
        description: `User has been added as ${newMemberRole.toLowerCase()}`
      });

      setNewMemberEmail('');
      loadMembers();

    } catch (error: any) {
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setInviting(false);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PRESIDENT':
        return 'default';
      case 'ADMIN':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchTerm || 
      member.user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user_profile?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Community Members</h2>
        <p className="text-muted-foreground">Manage members of {hoaName}</p>
      </div>

      {/* Add New Member */}
      {(isAdmin || isPlatformAdmin) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter user email/username"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={newMemberRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setNewMemberRole(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={inviteNewMember} disabled={inviting || !newMemberEmail.trim()}>
                {inviting ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="PRESIDENT">Presidents</SelectItem>
            <SelectItem value="ADMIN">Admins</SelectItem>
            <SelectItem value="MEMBER">Members</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {filteredMembers.map((member) => {
          const RoleIcon = getRoleIcon(member.role);
          const canManage = (isAdmin || isPlatformAdmin) && member.user_id !== user?.id;
          
          return (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <RoleIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">
                          {member.user_profile?.full_name || member.user_profile?.username || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Member since {new Date(member.approved_at || member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getRoleColor(member.role) as any}>
                      {member.role}
                    </Badge>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(newRole: 'MEMBER' | 'ADMIN' | 'PRESIDENT') => updateMemberRole(member.id, newRole)}
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

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this member from the community? 
                              They will lose access to all community features.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeMember(member.id)}>
                              Remove Member
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'This community has no members yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredMembers.length} of {members.length} members
      </div>
    </div>
  );
};