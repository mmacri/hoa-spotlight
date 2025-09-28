import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  FileText, 
  Calendar, 
  MessageSquare,
  Plus,
  Upload,
  Download,
  Clock,
  MapPin,
  User
} from 'lucide-react';

interface HOADetails {
  id: string;
  name: string;
  description_private: string;
}

interface Document {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  uploaded_by: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author_user_id: string;
  created_at: string;
  is_pinned: boolean;
}

interface Membership {
  status: string;
  role: string;
}

export const CommunityPortal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [hoa, setHoa] = useState<HOADetails | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  useEffect(() => {
    if (slug && user) {
      fetchCommunityData();
    }
  }, [slug, user]);

  const fetchCommunityData = async () => {
    try {
      // Get HOA details
      const { data: hoaData, error: hoaError } = await supabase
        .from('hoas')
        .select('id, name, description_private')
        .eq('slug', slug)
        .single();

      if (hoaError) throw hoaError;
      setHoa(hoaData);

      // Check membership status
      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select('status, role')
        .eq('hoa_id', hoaData.id)
        .eq('user_id', user!.id)
        .single();

      if (membershipError || !membershipData || membershipData.status !== 'APPROVED') {
        return; // User is not an approved member
      }

      setMembership(membershipData);

      // Fetch community data
      const [documentsRes, eventsRes, postsRes] = await Promise.all([
        supabase
          .from('documents')
          .select('*')
          .eq('hoa_id', hoaData.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('events')
          .select('*')
          .eq('hoa_id', hoaData.id)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true }),
        
        supabase
          .from('posts')
          .select('*')
          .eq('hoa_id', hoaData.id)
          .eq('visibility', 'PRIVATE')
          .eq('status', 'APPROVED')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
      ]);

      setDocuments(documentsRes.data || []);
      setEvents(eventsRes.data || []);
      setPosts(postsRes.data || []);

    } catch (error: any) {
      toast({
        title: "Error loading community",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !user || !hoa) return;

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          hoa_id: hoa.id,
          author_user_id: user.id,
          title: newPost.title,
          content: newPost.content,
          visibility: 'PRIVATE'
        });

      if (error) throw error;

      toast({
        title: "Post created",
        description: "Your post has been submitted for approval"
      });

      setNewPost({ title: '', content: '' });
      setShowNewPost(false);
      fetchCommunityData();

    } catch (error: any) {
      toast({
        title: "Error creating post",
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
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!membership || membership.status !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
            <p className="text-muted-foreground">
              You need to be an approved member to access this community portal.
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
          <h1 className="text-3xl font-bold mb-2">{hoa?.name} Community Portal</h1>
          <p className="text-muted-foreground">
            Welcome to your private community space
          </p>
        </div>

        <Tabs defaultValue="forum" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forum">Forum</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="info">Community Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="forum" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Community Forum</h2>
                <Button onClick={() => setShowNewPost(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>

              {showNewPost && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Post</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newPost.title}
                        onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter post title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Share your thoughts with the community..."
                        rows={4}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={createPost}>Post</Button>
                      <Button variant="outline" onClick={() => setShowNewPost(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {post.title}
                            {post.is_pinned && (
                              <Badge variant="secondary">Pinned</Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <User className="h-4 w-4 mr-1" />
                            Community Member
                            <span className="mx-2">•</span>
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </CardContent>
                  </Card>
                ))}
                
                {posts.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start the conversation with your community
                    </p>
                    <Button onClick={() => setShowNewPost(true)}>
                      Create First Post
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Document Library</h2>
                {(membership.role === 'ADMIN' || membership.role === 'PRESIDENT') && (
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </div>

              <div className="grid gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-semibold">{doc.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {doc.description}
                            </p>
                            <div className="text-xs text-muted-foreground mt-1">
                              {doc.file_type} • {(doc.file_size / 1024).toFixed(1)} KB • 
                              {new Date(doc.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {documents.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No documents available</h3>
                    <p className="text-muted-foreground">
                      Community documents will appear here when uploaded
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Upcoming Events</h2>
                {(membership.role === 'ADMIN' || membership.role === 'PRESIDENT') && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </div>

              <div className="grid gap-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary text-primary-foreground rounded-lg p-3 text-center min-w-[60px]">
                          <div className="text-sm font-medium">
                            {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-lg font-bold">
                            {new Date(event.starts_at).getDate()}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1 mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(event.starts_at).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                            {event.location && (
                              <>
                                <span className="mx-2">•</span>
                                <MapPin className="h-4 w-4 mr-1" />
                                {event.location}
                              </>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-muted-foreground">{event.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {events.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                    <p className="text-muted-foreground">
                      Community events will be announced here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Your Membership</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{membership.role}</Badge>
                      <Badge variant="secondary">{membership.status}</Badge>
                    </div>
                  </div>
                  
                  {hoa?.description_private && (
                    <div>
                      <h4 className="font-semibold mb-2">Private Community Description</h4>
                      <p className="text-muted-foreground">{hoa.description_private}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};