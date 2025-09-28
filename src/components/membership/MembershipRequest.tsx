import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle,
  Link as LinkIcon
} from 'lucide-react';

interface MembershipRequestProps {
  hoaId: string;
  hoaName: string;
  onRequestSubmitted?: () => void;
}

interface ExistingMembership {
  status: string;
  role: string;
  requested_at: string;
  approved_at?: string;
}

export const MembershipRequest: React.FC<MembershipRequestProps> = ({
  hoaId,
  hoaName,
  onRequestSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingMembership, setExistingMembership] = useState<ExistingMembership | null>(null);

  React.useEffect(() => {
    checkExistingMembership();
  }, [hoaId, user]);

  const checkExistingMembership = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('status, role, requested_at, approved_at')
        .eq('hoa_id', hoaId)
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setExistingMembership(data);
      }
    } catch (error) {
      // No existing membership found
    }
  };

  const submitRequest = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to request membership",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          hoa_id: hoaId,
          notes: notes.trim() || null,
          status: 'PENDING',
          role: 'MEMBER'
        });

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: "Your membership request has been sent to the HOA administrators"
      });

      setNotes('');
      onRequestSubmitted?.();
      checkExistingMembership(); // Refresh membership status

    } catch (error: any) {
      toast({
        title: "Error submitting request",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMembershipStatus = () => {
    if (!existingMembership) return null;

    const statusConfig = {
      PENDING: {
        icon: Clock,
        variant: 'secondary' as const,
        title: 'Request Pending',
        description: 'Your membership request is being reviewed by HOA administrators'
      },
      APPROVED: {
        icon: CheckCircle,
        variant: 'default' as const,
        title: 'Membership Active',
        description: 'You are an approved member of this community'
      },
      REJECTED: {
        icon: XCircle,
        variant: 'destructive' as const,
        title: 'Request Rejected',
        description: 'Your membership request was not approved'
      }
    };

    const config = statusConfig[existingMembership.status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <Icon className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold">{config.title}</h3>
                <Badge variant={config.variant}>{existingMembership.status}</Badge>
                {existingMembership.role !== 'MEMBER' && (
                  <Badge variant="outline">{existingMembership.role}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{config.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Requested: {new Date(existingMembership.requested_at).toLocaleDateString()}
                {existingMembership.approved_at && (
                  <> • Approved: {new Date(existingMembership.approved_at).toLocaleDateString()}</>
                )}
              </p>
            </div>
          </div>
          
          {existingMembership.status === 'APPROVED' && (
            <div className="mt-4">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      const slug = hoaName.toLowerCase().replace(/\s+/g, '-');
                      window.location.href = `/community/${slug}`;
                    }}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Access Community Portal
                  </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (existingMembership && existingMembership.status !== 'REJECTED') {
    return renderMembershipStatus();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Request Membership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Join the {hoaName} private community to access exclusive content, participate in discussions, 
          and stay updated with community events and documents.
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Tell the HOA administrators why you'd like to join this community..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={submitRequest} 
            disabled={loading || !user}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
          
          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              You must be signed in to request membership
            </p>
          )}
        </div>
        
        {existingMembership?.status === 'REJECTED' && (
          <div className="mt-4">
            <Badge variant="destructive" className="mb-2">Previous Request Rejected</Badge>
            <p className="text-xs text-muted-foreground">
              You can submit a new request if your circumstances have changed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};