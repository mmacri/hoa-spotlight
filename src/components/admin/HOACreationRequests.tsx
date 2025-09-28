import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HOACreationRequest {
  id: string;
  name: string;
  description_public: string;
  description_private: string;
  city: string;
  state: string;
  zip_code: string;
  unit_count: number;
  amenities: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requester_user_id: string;
  created_at: string;
  requester_profile?: {
    full_name: string;
    username: string;
  };
}

export const HOACreationRequests: React.FC = () => {
  const [requests, setRequests] = useState<HOACreationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('hoa_creation_requests')
        .select(`
          id,
          name,
          description_public,
          description_private,
          city,
          state,
          zip_code,
          unit_count,
          amenities,
          status,
          requester_user_id,
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
      console.error('Error fetching HOA creation requests:', error);
      toast({
        title: "Error",
        description: "Failed to load HOA creation requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('create_hoa_from_request', {
        request_id: requestId,
        admin_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "HOA creation request approved and HOA created"
      });
      
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve HOA creation request",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('hoa_creation_requests')
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
        description: "HOA creation request rejected"
      });
      
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject HOA creation request",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading HOA creation requests...</div>;
  }

  const pendingRequests = requests.filter(req => req.status === 'PENDING');
  const processedRequests = requests.filter(req => req.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">HOA Creation Requests</h2>
        
        {pendingRequests.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending HOA creation requests</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{request.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Requested by: {request.requester_profile?.full_name || request.requester_profile?.username || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Location</h4>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {request.city}, {request.state} {request.zip_code}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Units: {request.unit_count || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-1">
                      {request.amenities?.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      )) || <span className="text-sm text-muted-foreground">None specified</span>}
                    </div>
                  </div>
                </div>

                {request.description_public && (
                  <div>
                    <h4 className="font-semibold mb-2">Public Description</h4>
                    <p className="text-sm text-muted-foreground">{request.description_public}</p>
                  </div>
                )}

                {request.description_private && (
                  <div>
                    <h4 className="font-semibold mb-2">Private Description</h4>
                    <p className="text-sm text-muted-foreground">{request.description_private}</p>
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
                    Approve & Create HOA
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
          ))}
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
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.city}, {request.state}
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