import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Crown, 
  User,
  CheckCircle, 
  Clock, 
  XCircle
} from 'lucide-react';

interface RolePromotionRequestProps {
  hoaId: string;
  hoaName: string;
  currentRole: string;
  onRequestSubmitted?: () => void;
}

interface ExistingRequest {
  id: string;
  current_membership_role: string;
  requested_role: string;
  status: string;
  created_at: string;
  justification?: string;
  review_notes?: string;
}

export const RolePromotionRequest: React.FC<RolePromotionRequestProps> = ({
  hoaId,
  hoaName,
  currentRole,
  onRequestSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [requestedRole, setRequestedRole] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<ExistingRequest | null>(null);

  useEffect(() => {
    checkExistingRequest();
  }, [hoaId, user]);

  const checkExistingRequest = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('role_promotion_requests')
        .select('*')
        .eq('hoa_id', hoaId)
        .eq('requester_user_id', user.id)
        .eq('status', 'PENDING')
        .maybeSingle();

      if (!error && data) {
        setExistingRequest({
          id: data.id,
          current_membership_role: data.current_membership_role,
          requested_role: data.requested_role,
          status: data.status,
          created_at: data.created_at,
          justification: data.justification,
          review_notes: data.review_notes
        });
      }
    } catch (error) {
      // No existing request found
    }
  };

  const submitRequest = async () => {
    if (!user || !requestedRole) {
      toast({
        title: "Validation error",
        description: "Please select a role to request",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('role_promotion_requests')
        .insert([{
          requester_user_id: user.id,
          hoa_id: hoaId,
          current_membership_role: currentRole as any,
          requested_role: requestedRole as any,
          justification: justification.trim() || null,
          status: 'PENDING' as any
        }]);

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: "Your role promotion request has been sent to the HOA administrators"
      });

      setRequestedRole('');
      setJustification('');
      onRequestSubmitted?.();
      checkExistingRequest();

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

  const getAvailableRoles = () => {
    const roles = [];
    if (currentRole === 'MEMBER') {
      roles.push({ value: 'ADMIN', label: 'Administrator' });
      roles.push({ value: 'PRESIDENT', label: 'President' });
    } else if (currentRole === 'ADMIN') {
      roles.push({ value: 'PRESIDENT', label: 'President' });
    }
    return roles;
  };

  const renderExistingRequest = () => {
    if (!existingRequest) return null;

    const RequestedIcon = getRoleIcon(existingRequest.requested_role);

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-orange-500" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold">Role Promotion Request Pending</h3>
                <Badge variant="secondary">PENDING</Badge>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-muted-foreground">Requesting:</span>
                <RequestedIcon className="h-4 w-4" />
                <Badge variant="outline">{existingRequest.requested_role}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your request is being reviewed by HOA administrators
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Submitted: {new Date(existingRequest.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {existingRequest.justification && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Your Justification:</p>
              <p className="text-sm text-muted-foreground">{existingRequest.justification}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const availableRoles = getAvailableRoles();

  if (existingRequest) {
    return renderExistingRequest();
  }

  if (availableRoles.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Highest Role Achieved</h3>
          <p className="text-muted-foreground">
            You already have the highest available role in this community.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Request Role Promotion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Request a promotion to a higher role in {hoaName}. Your request will be reviewed by community administrators.
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="current-role">Current Role</Label>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <Badge variant="outline">{currentRole}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="requested-role">Requested Role</Label>
          <Select value={requestedRole} onValueChange={setRequestedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role to request" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => {
                const RoleIcon = getRoleIcon(role.value);
                return (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center space-x-2">
                      <RoleIcon className="h-4 w-4" />
                      <span>{role.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="justification">Justification</Label>
          <Textarea
            id="justification"
            placeholder="Explain why you should be promoted to this role..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={4}
          />
        </div>
        
        <Button 
          onClick={submitRequest} 
          disabled={loading || !user || !requestedRole}
          className="w-full"
        >
          {loading ? 'Submitting...' : 'Submit Promotion Request'}
        </Button>
        
        {!user && (
          <p className="text-xs text-muted-foreground text-center">
            You must be signed in to request a role promotion
          </p>
        )}
      </CardContent>
    </Card>
  );
};