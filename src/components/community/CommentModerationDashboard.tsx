import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, MessageSquare, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  author_user_id: string;
  post_id: string;
  author_profile?: {
    full_name: string;
    username: string;
  };
  post_info?: {
    title: string;
    hoa_id: string;
  };
}

interface CommentModerationDashboardProps {
  hoaId: string;
}

export const CommentModerationDashboard: React.FC<CommentModerationDashboardProps> = ({ hoaId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderationReason, setModerationReason] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [hoaId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          status,
          created_at,
          author_user_id,
          post_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter comments by HOA and fetch additional data
      const commentsWithData = await Promise.all(
        (data || []).map(async (comment) => {
          // Get post info
          const { data: post } = await supabase
            .from('posts')
            .select('title, hoa_id')
            .eq('id', comment.post_id)
            .single();
          
          // Skip if post doesn't belong to the HOA
          if (!post || post.hoa_id !== hoaId) {
            return null;
          }
          
          // Get author profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', comment.author_user_id)
            .single();
          
          return {
            ...comment,
            author_profile: profile,
            post_info: post
          };
        })
      );
      
      // Filter out null entries
      const filteredComments = commentsWithData.filter(comment => comment !== null);
      setComments(filteredComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const moderateComment = async (commentId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          status: newStatus,
          // Note: We'd need to add moderated_by and moderated_at columns to track this
        })
        .eq('id', commentId);

      if (error) throw error;

      // Log the action
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user) {
        await supabase.rpc('log_community_action', {
          p_hoa_id: hoaId,
          p_actor_user_id: currentUser.data.user.id,
          p_action: newStatus === 'APPROVED' ? 'COMMENT_APPROVED' : 'COMMENT_REJECTED',
          p_target_type: 'COMMENT',
          p_target_id: commentId,
          p_details: {
            reason: moderationReason[commentId] || '',
            previous_status: comments.find(c => c.id === commentId)?.status
          }
        });
      }

      toast({
        title: "Success",
        description: `Comment ${newStatus.toLowerCase()} successfully`
      });

      fetchComments();
      setModerationReason(prev => ({ ...prev, [commentId]: '' }));
    } catch (error) {
      console.error('Error moderating comment:', error);
      toast({
        title: "Error",
        description: "Failed to moderate comment",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading comments...</div>;
  }

  const pendingComments = comments.filter(c => c.status === 'PENDING');
  const approvedComments = comments.filter(c => c.status === 'APPROVED');
  const rejectedComments = comments.filter(c => c.status === 'REJECTED');

  const CommentCard: React.FC<{ comment: Comment; showModerationActions?: boolean }> = ({ 
    comment, 
    showModerationActions = false 
  }) => (
    <Card key={comment.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {comment.author_profile?.full_name || comment.author_profile?.username || 'Anonymous'}
            </span>
            <Badge variant="outline" className="text-xs">
              {comment.post_info?.title}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                comment.status === 'APPROVED' ? 'default' :
                comment.status === 'REJECTED' ? 'destructive' : 
                'secondary'
              }
            >
              {comment.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
              {comment.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
              {comment.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
              {comment.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm">{comment.content}</p>
        </div>

        {showModerationActions && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Moderation Notes (Optional)</label>
              <Textarea
                placeholder="Add notes about this approval/rejection..."
                value={moderationReason[comment.id] || ''}
                onChange={(e) => setModerationReason(prev => ({ 
                  ...prev, 
                  [comment.id]: e.target.value 
                }))}
                className="min-h-[60px]"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => moderateComment(comment.id, 'APPROVED')}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                variant="destructive"
                onClick={() => moderateComment(comment.id, 'REJECTED')}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Comment Moderation</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>{pendingComments.length} Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{approvedComments.length} Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>{rejectedComments.length} Rejected</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingComments.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedComments.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedComments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingComments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending comments to review</p>
              </CardContent>
            </Card>
          ) : (
            pendingComments.map(comment => (
              <CommentCard 
                key={comment.id} 
                comment={comment} 
                showModerationActions={true} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedComments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approved comments</p>
              </CardContent>
            </Card>
          ) : (
            approvedComments.slice(0, 10).map(comment => (
              <CommentCard key={comment.id} comment={comment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {rejectedComments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rejected comments</p>
              </CardContent>
            </Card>
          ) : (
            rejectedComments.slice(0, 10).map(comment => (
              <CommentCard key={comment.id} comment={comment} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};