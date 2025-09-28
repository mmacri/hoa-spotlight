import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, Shield, Crown, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RolePromotionRequest {
  id: string;
  requester_user_id: string;
  hoa_id: string;
  current_membership_role: string;
  requested_role: string;
  justification?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  requester_profile?: {
    full_name: string;
    username: string;
  };
}

export const RolePromotionRequests: React.FC = () => {
  const [requests, setRequests] = useState<RolePromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('role_promotion_requests')
        .select(`
          id,
          requester_user_id,
          hoa_id,
          current_membership_role,
          requested_role,
          justification,
          status,
          created_at,
          reviewed_by,
          reviewed_at,
          review_notes
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', request.requester_user_id)
            .single();
          
          return {
            ...request,
            requester_profile: profile
          };
        })
      );
      
      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching role promotion requests:', error);
      toast({
        title: "Error",
        description: "Failed to load role promotion requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('approve_role_promotion', {
        request_id: requestId,
        admin_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role promotion request approved"
      });
      
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve role promotion request",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('role_promotion_requests')
        .update({
          status: 'REJECTED',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[requestId]
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role promotion request rejected"
      });
      
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject role promotion request",
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
      case 'MEMBER':
      default:
        return User;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'PRESIDENT':
        return 'default' as const;
      case 'ADMIN':
        return 'secondary' as const;
      case 'MEMBER':
      default:
        return 'outline' as const;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading role promotion requests...</div>;
  }

  const pendingRequests = requests.filter(req => req.status === 'PENDING');
  const processedRequests = requests.filter(req => req.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Role Promotion Requests</h2>
        
        {pendingRequests.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending role promotion requests</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {pendingRequests.map((request) => {
          const FromRoleIcon = getRoleIcon(request.current_membership_role);
            const ToRoleIcon = getRoleIcon(request.requested_role);
            
            return (
              <Card key={request.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">Role Promotion Request</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Requested by: {request.requester_profile?.full_name || request.requester_profile?.username || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <FromRoleIcon className="h-5 w-5" />
                      <Badge variant={getRoleBadgeVariant(request.current_membership_role)}>
                        {request.current_membership_role}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="flex items-center space-x-2">
                      <ToRoleIcon className="h-5 w-5" />
                      <Badge variant={getRoleBadgeVariant(request.requested_role)}>
                        {request.requested_role}
                      </Badge>
                    </div>
                  </div>

                  {request.justification && (
                    <div>
                      <h4 className="font-semibold mb-2">Justification</h4>
                      <p className="text-sm text-muted-foreground">{request.justification}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Review Notes (Optional)</h4>
                    <Textarea
                      placeholder="Add notes about this approval/rejection..."
                      value={reviewNotes[request.id] || ''}
                      onChange={(e) => setReviewNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => handleApprove(request.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Promotion
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Processed Requests</h3>
          <div className="grid gap-2">
            {processedRequests.slice(0, 5).map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {request.current_membership_role} → {request.requested_role}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.requester_profile?.full_name || request.requester_profile?.username || 'Unknown'}
                    </p>
                  </div>
                  <Badge 
                    variant={request.status === 'APPROVED' ? 'default' : 'destructive'}
                  >
                    {request.status === 'APPROVED' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {request.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};