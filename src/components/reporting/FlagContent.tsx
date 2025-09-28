import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Flag, AlertTriangle } from 'lucide-react';

interface FlagContentProps {
  targetType: 'REVIEW' | 'POST' | 'COMMENT';
  targetId: string;
  className?: string;
}

const FLAG_REASONS = [
  'Inappropriate language',
  'Spam or promotional content',
  'False or misleading information',
  'Personal attacks or harassment',
  'Privacy violation',
  'Copyright infringement',
  'Other'
];

export const FlagContent: React.FC<FlagContentProps> = ({
  targetType,
  targetId,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFlag = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report content",
        variant: "destructive"
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for flagging this content",
        variant: "destructive"
      });
      return;
    }

    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for flagging this content",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('flags')
        .insert({
          target_type: targetType,
          target_id: targetId,
          reporter_user_id: user.id,
          reason: finalReason,
          status: 'PENDING'
        });

      if (error) throw error;

      toast({
        title: "Content flagged",
        description: "Thank you for your report. Our moderation team will review it."
      });

      setReason('');
      setCustomReason('');
      setIsOpen(false);

    } catch (error: any) {
      toast({
        title: "Error flagging content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-muted-foreground hover:text-destructive ${className}`}
        >
          <Flag className="h-4 w-4 mr-1" />
          Report
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            Report Content
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Help us maintain a safe and respectful community by reporting content that violates our guidelines.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {FLAG_REASONS.map((flagReason) => (
                  <SelectItem key={flagReason} value={flagReason}>
                    {flagReason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {reason === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Please specify</Label>
              <Textarea
                id="custom-reason"
                placeholder="Please describe the issue..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          <div className="flex space-x-2 pt-4">
            <Button 
              onClick={submitFlag} 
              disabled={loading || !reason}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};