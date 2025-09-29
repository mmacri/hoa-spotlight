import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CommunityMemberManagement } from './CommunityMemberManagement';
import { BulkMemberUpload } from './BulkMemberUpload';
import { CommentModerationDashboard } from './CommentModerationDashboard';
import { 
  CheckCircle, 
  XCircle, 
  User,
  Users,
  Star,
  MessageSquare,
  Clock,
  Shield,
  Activity,
  UserPlus,
  Upload
} from 'lucide-react';

interface Review {
  id: string;
  title: string;
  content: string;
  stars: number;
  status: string;
  created_at: string;
  user_id: string;
  moderation_reason?: string;
}

interface MembershipRequest {
  id: string;
  user_id: string;
  status: string;
  role: 'ADMIN' | 'MEMBER' | 'PRESIDENT';
  requested_at: string;
  notes?: string;
}

interface AuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  created_at: string;
  details: any;
}

interface CommunityModerationDashboardProps {
  hoaId: string;
  hoaName: string;
}

export const CommunityModerationDashboard: React.FC<CommunityModerationDashboardProps> = ({
  hoaId,
  hoaName
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderationReason, setModerationReason] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchModerationData();
  }, [hoaId]);

  const fetchModerationData = async () => {
    try {
      const [reviewsRes, membershipRes, auditRes] = await Promise.all([
        // Fetch pending reviews for this HOA
        supabase
          .from('reviews')
          .select('*')
          .eq('hoa_id', hoaId)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true }),
        
        // Fetch pending membership requests for this HOA
        supabase
          .from('memberships')
          .select('*')
          .eq('hoa_id', hoaId)
          .eq('status', 'PENDING')
          .order('requested_at', { ascending: true }),
        
        // Fetch recent audit logs for this HOA
        supabase
          .from('community_audit_logs')
          .select('*')
          .eq('hoa_id', hoaId)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      setReviews(reviewsRes.data || []);
      setMembershipRequests(membershipRes.data || []);
      setAuditLogs(auditRes.data || []);

    } catch (error: any) {
      toast({
        title: "Error loading moderation data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const moderateReview = async (reviewId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          status: action,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: action === 'REJECTED' ? moderationReason : null
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: `Review ${action.toLowerCase()}`,
        description: `The review has been ${action.toLowerCase()}`
      });

      setModerationReason('');
      setActiveReviewId(null);
      fetchModerationData();

    } catch (error: any) {
      toast({
        title: "Error moderating review",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const approveMembership = async (membershipId: string, role: 'ADMIN' | 'MEMBER' | 'PRESIDENT' = 'MEMBER') => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({
          status: 'APPROVED',
          role: role,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: "Membership approved",
        description: `User approved as ${role.toLowerCase()}`
      });

      fetchModerationData();

    } catch (error: any) {
      toast({
        title: "Error approving membership",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const rejectMembership = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({
          status: 'REJECTED',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: "Membership rejected",
        description: "The membership request has been rejected"
      });

      fetchModerationData();

    } catch (error: any) {
      toast({
        title: "Error rejecting membership",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatActionText = (action: string, targetType: string) => {
    const actionMap: Record<string, string> = {
      'MEMBERSHIP_APPROVED': 'Approved membership',
      'MEMBERSHIP_REJECTED': 'Rejected membership',
      'REVIEW_APPROVED': 'Approved review',
      'REVIEW_REJECTED': 'Rejected review'
    };
    return actionMap[action] || action;
  };

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
        <h2 className="text-2xl font-bold">{hoaName} - Community Management</h2>
        <p className="text-muted-foreground">Manage your community members and content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{reviews.length}</p>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{membershipRequests.length}</p>
                <p className="text-sm text-muted-foreground">Membership Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
                <p className="text-sm text-muted-foreground">Recent Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="reviews">
            <MessageSquare className="h-4 w-4 mr-2" />
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="memberships">
            <User className="h-4 w-4 mr-2" />
            Memberships ({membershipRequests.length})
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </TabsTrigger>
          <TabsTrigger value="bulk-upload">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Activity className="h-4 w-4 mr-2" />
            Audit Log ({auditLogs.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {review.title || 'Untitled Review'}
                        <Badge variant="outline">
                          {Array.from({ length: review.stars }, (_, i) => '★').join('')}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap">{review.content}</p>
                  
                  {activeReviewId === review.id && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Reason for rejection (optional)"
                        value={moderationReason}
                        onChange={(e) => setModerationReason(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => moderateReview(review.id, 'APPROVED')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (activeReviewId === review.id) {
                          moderateReview(review.id, 'REJECTED');
                        } else {
                          setActiveReviewId(review.id);
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    {activeReviewId === review.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveReviewId(null);
                          setModerationReason('');
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {reviews.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">No reviews pending moderation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="memberships" className="mt-6">
          <div className="space-y-4">
            {membershipRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Membership Request</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Requested {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {request.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground">{request.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveMembership(request.id, 'MEMBER')}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Approve as Member
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveMembership(request.id, 'ADMIN')}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Approve as Admin
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMembership(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {membershipRequests.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">All membership requests have been processed</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="mt-6">
          <CommunityMemberManagement 
            hoaId={hoaId} 
            hoaName={hoaName}
            isAdmin={true}
          />
        </TabsContent>
        
        <TabsContent value="bulk-upload" className="space-y-4 mt-6">
          <BulkMemberUpload hoaId={hoaId} onComplete={fetchModerationData} />
        </TabsContent>

        <TabsContent value="comments" className="space-y-4 mt-6">
          <CommentModerationDashboard hoaId={hoaId} />
        </TabsContent>
        
        <TabsContent value="audit" className="mt-6">
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {formatActionText(log.action, log.target_type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Action performed
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <details>
                              <summary className="cursor-pointer">View details</summary>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </time>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {auditLogs.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">Community actions will appear here</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};