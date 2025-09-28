import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Flag,
  User,
  Star,
  MessageSquare,
  Clock
} from 'lucide-react';

interface Review {
  id: string;
  title: string;
  content: string;
  stars: number;
  status: string;
  created_at: string;
  user_id: string;
  hoa_id: string;
  moderation_reason?: string;
  hoas: {
    name: string;
  };
}

interface Flag {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_user_id: string;
  resolution_notes?: string;
}

interface MembershipRequest {
  id: string;
  user_id: string;
  hoa_id: string;
  status: string;
  requested_at: string;
  notes?: string;
  hoas: {
    name: string;
  };
}

export const ModerationDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderationReason, setModerationReason] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      const [reviewsRes, flagsRes, membershipRes] = await Promise.all([
        supabase
          .from('reviews')
          .select(`
            *,
            hoas (name)
          `)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true }),
        
        supabase
          .from('flags')
          .select('*')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true }),
        
        supabase
          .from('memberships')
          .select(`
            *,
            hoas (name)
          `)
          .eq('status', 'PENDING')
          .order('requested_at', { ascending: true })
      ]);

      setReviews(reviewsRes.data || []);
      setFlags(flagsRes.data || []);
      setMembershipRequests(membershipRes.data || []);

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

  const approveMembership = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({
          status: 'APPROVED',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: "Membership approved",
        description: "The membership request has been approved"
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
        <h2 className="text-2xl font-bold">Moderation Dashboard</h2>
        <p className="text-muted-foreground">Review and moderate community content</p>
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
              <Flag className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{flags.length}</p>
                <p className="text-sm text-muted-foreground">Active Flags</p>
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
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList>
          <TabsTrigger value="reviews">
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="flags">
            Flags ({flags.length})
          </TabsTrigger>
          <TabsTrigger value="memberships">
            Memberships ({membershipRequests.length})
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
                        For {review.hoas.name} • {new Date(review.created_at).toLocaleDateString()}
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
        
        <TabsContent value="flags" className="mt-6">
          <div className="space-y-4">
            {flags.map((flag) => (
              <Card key={flag.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-red-500" />
                        Content Flagged
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {flag.target_type} reported on {new Date(flag.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Reason:</strong> {flag.reason}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        View Content
                      </Button>
                      <Button size="sm">
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {flags.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active flags</h3>
                  <p className="text-muted-foreground">All content reports have been resolved</p>
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
                        For {request.hoas.name} • Requested {new Date(request.requested_at).toLocaleDateString()}
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
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveMembership(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
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
      </Tabs>
    </div>
  );
};