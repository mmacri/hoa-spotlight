import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Heart, Share, Send, Plus, Eye, EyeOff, Flag, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

interface Post {
  id: string;
  hoa_id: string;
  author_user_id: string;
  title: string;
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    full_name: string;
  };
  comments_count?: number;
}

interface Comment {
  id: string;
  post_id: string;
  author_user_id: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  author?: {
    username: string;
    full_name: string;
  };
}

interface CommunityFeedProps {
  hoaId: string;
  isMember?: boolean;
  isAdmin?: boolean;
}

const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().trim().min(10, "Content must be at least 10 characters").max(2000, "Content must be less than 2000 characters"),
  visibility: z.enum(['PUBLIC', 'PRIVATE'])
});

const commentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(500, "Comment must be less than 500 characters")
});

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ 
  hoaId, 
  isMember = false,
  isAdmin = false 
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [postFormData, setPostFormData] = useState({
    title: '',
    content: '',
    visibility: 'PRIVATE' as 'PUBLIC' | 'PRIVATE'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadPosts();
  }, [hoaId]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('hoa_id', hoaId)
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const postsWithAuthor = (data || []).map(post => ({
        ...post,
        author: { username: 'Unknown User', full_name: 'Unknown User' }
      }));
      
      setPosts(postsWithAuthor);
    } catch (error: any) {
      toast({
        title: "Error loading posts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const commentsWithAuthor = (data || []).map(comment => ({
        ...comment,
        author: { username: 'Unknown User', full_name: 'Unknown User' }
      }));
      
      setComments(prev => ({ ...prev, [postId]: commentsWithAuthor }));
    } catch (error: any) {
      toast({
        title: "Error loading comments",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const validatePostForm = () => {
    try {
      postSchema.parse(postFormData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isMember) {
      toast({
        title: "Permission denied",
        description: "Only community members can create posts",
        variant: "destructive"
      });
      return;
    }

    if (!validatePostForm()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          ...postFormData,
          hoa_id: hoaId,
          author_user_id: user.id,
          status: 'PENDING' // Posts need approval by default
        }]);

      if (error) throw error;

      toast({
        title: "Post submitted",
        description: "Your post has been submitted for approval by community administrators",
      });

      setPostFormData({ title: '', content: '', visibility: 'PRIVATE' });
      setShowPostForm(false);
      setErrors({});
    } catch (error: any) {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !isMember) {
      toast({
        title: "Permission denied",
        description: "Only community members can comment",
        variant: "destructive"
      });
      return;
    }

    const commentContent = newComment[postId]?.trim();
    
    try {
      commentSchema.parse({ content: commentContent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid comment",
          description: error.errors[0]?.message || "Please enter a valid comment",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          author_user_id: user.id,
          content: commentContent,
          status: 'PENDING' // Comments need approval
        }]);

      if (error) throw error;

      toast({
        title: "Comment submitted",
        description: "Your comment has been submitted for approval",
      });

      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (error: any) {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleComments = async (postId: string) => {
    if (!showComments[postId] && !comments[postId]) {
      await loadComments(postId);
    }
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return <div className="text-center py-4">Loading community feed...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Feed</h2>
          <p className="text-muted-foreground">
            Share updates and connect with your community
          </p>
        </div>
        {isMember && (
          <Button onClick={() => setShowPostForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        )}
      </div>

      {showPostForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  value={postFormData.title}
                  onChange={(e) => setPostFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What would you like to share?"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="post-content">Content</Label>
                <Textarea
                  id="post-content"
                  value={postFormData.content}
                  onChange={(e) => setPostFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your thoughts, questions, or updates with the community..."
                  className={errors.content ? "border-red-500" : ""}
                  rows={4}
                />
                {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content}</p>}
              </div>

              <div>
                <Label htmlFor="post-visibility">Visibility</Label>
                <Select
                  value={postFormData.visibility}
                  onValueChange={(value: 'PUBLIC' | 'PRIVATE') => 
                    setPostFormData(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private (Members Only)</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Post
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowPostForm(false);
                    setPostFormData({ title: '', content: '', visibility: 'PRIVATE' });
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
              <p className="text-muted-foreground">
                {isMember ? 'Be the first to share something with your community!' : 'Join the community to see posts and participate in discussions.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(post.author?.full_name || post.author?.username || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-sm">
                        {post.author?.full_name || post.author?.username || 'Unknown User'}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </div>
                      {post.visibility === 'PUBLIC' && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                      {post.is_pinned && (
                        <Badge variant="default" className="text-xs">Pinned</Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    <div className="prose prose-sm max-w-none mb-4">
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {post.content}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(post.id)}
                        className="p-0 h-auto"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {comments[post.id]?.length || 0} Comments
                      </Button>
                    </div>
                    
                    {showComments[post.id] && (
                      <div className="mt-4 space-y-4">
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3">Comments</h4>
                          
                          {isMember && (
                            <div className="flex gap-2 mb-4">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(user?.email || 'U')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  value={newComment[post.id] || ''}
                                  onChange={(e) => setNewComment(prev => ({ 
                                    ...prev, 
                                    [post.id]: e.target.value 
                                  }))}
                                  placeholder="Add a comment..."
                                  className="text-sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!newComment[post.id]?.trim()}
                                >
                                  <Send className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            {comments[post.id]?.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No comments yet.</p>
                            ) : (
                              comments[post.id]?.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(comment.author?.full_name || comment.author?.username || 'U')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm">
                                        {comment.author?.full_name || comment.author?.username || 'Unknown User'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(comment.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};