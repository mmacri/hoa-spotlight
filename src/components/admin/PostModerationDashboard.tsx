import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  Globe,
  Lock,
  Clock,
  User,
  Building2,
  Trash2
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  author_user_id: string;
  hoa_id: string;
  is_pinned: boolean;
  hoa?: {
    name: string;
    slug: string;
  };
  author?: {
    username: string;
    full_name: string;
  };
}

interface PostModerationDashboardProps {
  hoaId?: string; // If provided, only show posts for this HOA
  showAllCommunities?: boolean; // If true, show posts from all communities
}

export const PostModerationDashboard: React.FC<PostModerationDashboardProps> = ({
  hoaId,
  showAllCommunities = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'PUBLIC' | 'PRIVATE'>('all');
  const [moderationReason, setModerationReason] = useState<Record<string, string>>({});
  const [activePostId, setActivePostId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, [hoaId, showAllCommunities, statusFilter]);

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          hoa:hoas(name, slug)
        `)
        .order('created_at', { ascending: false });

      // Filter by HOA if specified
      if (hoaId && !showAllCommunities) {
        query = query.eq('hoa_id', hoaId);
      }

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'PENDING' | 'APPROVED' | 'REJECTED');
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      // Fetch author profiles separately
      const authorIds = [...new Set((postsData || []).map(post => post.author_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', authorIds);

      const enrichedPosts = (postsData || []).map(post => ({
        ...post,
        author: profiles?.find(p => p.id === post.author_user_id) || 
                { username: 'Unknown User', full_name: 'Unknown User' }
      }));

      setPosts(enrichedPosts);
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

  const moderatePost = async (postId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const updateData: any = {
        status: action,
        moderated_by: user?.id,
        moderated_at: new Date().toISOString()
      };

      if (action === 'REJECTED' && moderationReason[postId]) {
        updateData.moderation_reason = moderationReason[postId];
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: `Post ${action.toLowerCase()}`,
        description: `The post has been ${action.toLowerCase()}`
      });

      setModerationReason(prev => ({ ...prev, [postId]: '' }));
      setActivePostId(null);
      loadPosts();

    } catch (error: any) {
      toast({
        title: "Error moderating post",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "The post has been permanently deleted"
      });

      loadPosts();
    } catch (error: any) {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const togglePin = async (postId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: !isPinned })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: isPinned ? "Post unpinned" : "Post pinned",
        description: `The post has been ${isPinned ? 'unpinned' : 'pinned'}`
      });

      loadPosts();
    } catch (error: any) {
      toast({
        title: "Error updating post",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.hoa?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVisibility = visibilityFilter === 'all' || post.visibility === visibilityFilter;
    
    return matchesSearch && matchesVisibility;
  });

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
        <h2 className="text-2xl font-bold">Post Moderation</h2>
        <p className="text-muted-foreground">
          {showAllCommunities ? 'Manage posts from all communities' : 'Manage community posts'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search posts, authors, or communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={visibilityFilter} onValueChange={(value: typeof visibilityFilter) => setVisibilityFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
            <SelectItem value="PRIVATE">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{filteredPosts.length}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{posts.filter(p => p.status === 'PENDING').length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{posts.filter(p => p.status === 'APPROVED').length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{posts.filter(p => p.visibility === 'PUBLIC').length}</p>
                <p className="text-sm text-muted-foreground">Public Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <Badge variant={getStatusColor(post.status) as any}>
                      {post.status}
                    </Badge>
                    {post.visibility === 'PUBLIC' && (
                      <Badge variant="outline">
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    )}
                    {post.visibility === 'PRIVATE' && (
                      <Badge variant="outline">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                    {post.is_pinned && (
                      <Badge variant="default">Pinned</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author?.full_name || post.author?.username || 'Unknown User'}
                    </div>
                    {showAllCommunities && post.hoa && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {post.hoa.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {post.content.length > 200 
                    ? `${post.content.substring(0, 200)}...` 
                    : post.content}
                </p>
              </div>
              
              {activePostId === post.id && post.status === 'PENDING' && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Reason for rejection (optional)"
                    value={moderationReason[post.id] || ''}
                    onChange={(e) => setModerationReason(prev => ({
                      ...prev,
                      [post.id]: e.target.value
                    }))}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {post.status === 'PENDING' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => moderatePost(post.id, 'APPROVED')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (activePostId === post.id) {
                          moderatePost(post.id, 'REJECTED');
                        } else {
                          setActivePostId(post.id);
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                
                {post.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePin(post.id, post.is_pinned)}
                  >
                    {post.is_pinned ? 'Unpin' : 'Pin'} Post
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deletePost(post.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                
                {activePostId === post.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActivePostId(null);
                      setModerationReason(prev => ({ ...prev, [post.id]: '' }));
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPosts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                {searchTerm || visibilityFilter !== 'all' || statusFilter !== 'PENDING'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No posts match the current filters'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredPosts.length} of {posts.length} posts
      </div>
    </div>
  );
};