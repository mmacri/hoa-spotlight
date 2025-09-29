import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  FileText, 
  Calendar, 
  MessageSquare,
  Shield,
  Crown,
  User,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Activity,
  Trash2,
  Filter
} from 'lucide-react';

interface HOADetails {
  id: string;
  name: string;
  description_private: string;
  city: string;
  state: string;
  zip_code: string;
}

interface MembershipRequest {
  id: string;
  user_id: string;
  role: string;
  status: string;
  requested_at: string;
  notes: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

interface RolePromotionRequest {
  id: string;
  requester_user_id: string;
  current_membership_role: string;
  requested_role: string;
  status: string;
  justification: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

interface Review {
  id: string;
  user_id: string;
  stars: number;
  title: string;
  content: string;
  status: string;
  created_at: string;
  is_anonymous: boolean;
}

interface CommunityAuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

interface Membership {
  status: string;
  role: string;
}

export const CommunityDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [hoa, setHoa] = useState<HOADetails | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
  const [rolePromotionRequests, setRolePromotionRequests] = useState<RolePromotionRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [auditLogs, setAuditLogs] = useState<CommunityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    if (slug && user) {
      fetchCommunityData();
    }
  }, [slug, user]);

  const fetchCommunityData = async () => {
    try {
      // Check if user is platform admin first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user!.id)
        .single();

      const isUserPlatformAdmin = profileData?.is_admin || false;
      setIsPlatformAdmin(isUserPlatformAdmin);

      // Get HOA details
      const { data: hoaData, error: hoaError } = await supabase
        .from('hoas')
        .select('id, name, description_private, city, state, zip_code')
        .eq('slug', slug)
        .single();

      if (hoaError) throw hoaError;
      setHoa(hoaData);

      // Check membership status - must be admin/president OR platform admin
      if (!isUserPlatformAdmin) {
        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select('status, role')
          .eq('hoa_id', hoaData.id)
          .eq('user_id', user!.id)
          .single();

        if (membershipError || !membershipData || 
            membershipData.status !== 'APPROVED' ||
            !['ADMIN', 'PRESIDENT'].includes(membershipData.role)) {
          return; // User is not authorized
        }

        setMembership(membershipData);
      } else {
        // Platform admin gets full access
        setMembership({ status: 'APPROVED', role: 'PLATFORM_ADMIN' });
      }

      // Fetch management data - simple queries without joins first
      const [membershipRequestsRes, rolePromotionRequestsRes, reviewsRes, auditLogsRes] = await Promise.all([
        supabase
          .from('memberships')
          .select('id, user_id, role, status, requested_at, notes')
          .eq('hoa_id', hoaData.id)
          .eq('status', 'PENDING')
          .order('requested_at', { ascending: true }),
        
        supabase
          .from('role_promotion_requests')
          .select('id, requester_user_id, current_membership_role, requested_role, status, justification, created_at')
          .eq('hoa_id', hoaData.id)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true }),
        
        supabase
          .from('reviews')
          .select('*')
          .eq('hoa_id', hoaData.id)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false }),
        
        supabase
          .from('community_audit_logs')
          .select('*')
          .eq('hoa_id', hoaData.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      setMembershipRequests(membershipRequestsRes.data || []);
      setRolePromotionRequests(rolePromotionRequestsRes.data || []);
      setReviews(reviewsRes.data || []);
      setAuditLogs(auditLogsRes.data || []);

      // Fetch user profiles separately for display
      const userIds = [...new Set([
        ...(membershipRequestsRes.data || []).map(r => r.user_id),
        ...(rolePromotionRequestsRes.data || []).map(r => r.requester_user_id)
      ])];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);

        // Enrich membership requests with profile data
        const enrichedMembershipRequests = (membershipRequestsRes.data || []).map(request => ({
          ...request,
          profiles: profiles?.find(p => p.id === request.user_id)
        }));

        // Enrich role promotion requests with profile data
        const enrichedRolePromotionRequests = (rolePromotionRequestsRes.data || []).map(request => ({
          ...request,
          profiles: profiles?.find(p => p.id === request.requester_user_id)
        }));

        setMembershipRequests(enrichedMembershipRequests);
        setRolePromotionRequests(enrichedRolePromotionRequests);
      }

    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveMembershipRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ 
          status: 'APPROVED', 
          approved_by: user!.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership request approved"
      });

      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const rejectMembershipRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ status: 'REJECTED' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership request rejected"
      });

      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const moderateReview = async (reviewId: string, action: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          status: action,
          moderated_by: user!.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: reason || null
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Review ${action.toLowerCase()}`
      });

      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">Loading community dashboard...</div>
        </div>
      </div>
    );
  }

  if (!membership || (!['ADMIN', 'PRESIDENT', 'PLATFORM_ADMIN'].includes(membership.role))) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You need to be a community admin, president, or platform admin to access this dashboard.
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{hoa?.name} - Community Dashboard</h1>
              <p className="text-muted-foreground">
                {isPlatformAdmin 
                  ? "Managing as Platform Administrator" 
                  : `Manage your community as ${membership.role.toLowerCase()}`}
              </p>
            </div>
            {isPlatformAdmin && (
              <div className="flex gap-2">
                <Link to="/admin">
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Platform Admin
                  </Button>
                </Link>
                <Link to={`/community/${slug}`}>
                  <Button variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    Community Portal
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{membershipRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{rolePromotionRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Role Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <Building2 className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">{hoa?.city}, {hoa?.state}</p>
                  <p className="text-sm text-muted-foreground">{hoa?.zip_code}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="memberships" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="memberships">
              <Users className="h-4 w-4 mr-2" />
              Memberships ({membershipRequests.length})
            </TabsTrigger>
            <TabsTrigger value="role-requests">
              <Shield className="h-4 w-4 mr-2" />
              Role Requests ({rolePromotionRequests.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <MessageSquare className="h-4 w-4 mr-2" />
              Review Moderation ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Activity className="h-4 w-4 mr-2" />
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="memberships" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pending Membership Requests</h3>
              
              {membershipRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {request.profiles?.full_name || request.profiles?.username || 'Unknown User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Requesting role: {request.role}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                        {request.notes && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            {request.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => approveMembershipRequest(request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectMembershipRequest(request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {membershipRequests.length === 0 && (
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
              <h3 className="text-lg font-semibold">Role Promotion Requests</h3>
              
              {rolePromotionRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {request.profiles?.full_name || request.profiles?.username || 'Unknown User'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{request.current_membership_role}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="default">{request.requested_role}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                        {request.justification && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Justification:</p>
                            <p className="text-sm p-2 bg-muted rounded">
                              {request.justification}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm">
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {rolePromotionRequests.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending role promotion requests</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pending Review Moderation</h3>
              
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < review.stars ? "text-yellow-400" : "text-gray-300"}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {review.is_anonymous ? 'Anonymous' : 'Public'} Review
                            </span>
                          </div>
                          <h4 className="font-medium mt-1">{review.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => moderateReview(review.id, 'APPROVED')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => moderateReview(review.id, 'REJECTED')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{review.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {reviews.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews pending moderation</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Community Activity Log</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search activity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                {auditLogs
                  .filter(log => 
                    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.target_type.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <Activity className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">
                                {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Target: {log.target_type}
                              </p>
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
                    <CardContent className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No community activity logged yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};