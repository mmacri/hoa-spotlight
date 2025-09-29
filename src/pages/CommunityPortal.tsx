import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EventManagement } from '@/components/events/EventManagement';
import { CommunityResourcesManager } from '@/components/community/CommunityResourcesManager';
import { DocumentManagement } from '@/components/community/DocumentManagement';
import { 
  Users, 
  FileText, 
  Calendar, 
  MessageSquare,
  Plus,
  Upload,
  Download,
  Shield,
  User,
  Clock,
  MapPin,
  Star,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Lock,
  ExternalLink,
  BookOpen
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
  visibility: 'PRIVATE' | 'PUBLIC';
}

interface Review {
  id: string;
  user_id: string;
  hoa_id: string;
  stars: number;
  title?: string;
  content?: string;
  is_anonymous: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

interface AdminResponse {
  id: string;
  review_id: string;
  responder_user_id: string;
  content: string;
  created_at: string;
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [adminResponses, setAdminResponses] = useState<AdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', visibility: 'PRIVATE' as 'PRIVATE' | 'PUBLIC' });
  const [activeTab, setActiveTab] = useState('overview');

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
      const [documentsRes, eventsRes, postsRes, reviewsRes] = await Promise.all([
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
          .order('created_at', { ascending: false }),

        supabase
          .from('reviews')
          .select('*')
          .eq('hoa_id', hoaData.id)
          .eq('status', 'APPROVED')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      setDocuments(documentsRes.data || []);
      setEvents(eventsRes.data || []);
      setPosts(postsRes.data || []);
      setReviews(reviewsRes.data || []);

      // Fetch admin responses for reviews
      if (reviewsRes.data && reviewsRes.data.length > 0) {
        const { data: responsesData } = await supabase
          .from('admin_responses')
          .select('*')
          .in('review_id', reviewsRes.data.map(r => r.id));
        
        setAdminResponses(responsesData || []);
      }

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
    console.log('createPost called', { 
      title: newPost.title, 
      content: newPost.content, 
      user: !!user, 
      hoa: !!hoa,
      titleTrimmed: newPost.title.trim(),
      contentTrimmed: newPost.content.trim()
    });
    
    if (!newPost.title.trim() || !newPost.content.trim() || !user || !hoa) {
      console.log('Early return hit', {
        noTitle: !newPost.title.trim(),
        noContent: !newPost.content.trim(),
        noUser: !user,
        noHoa: !hoa
      });
      
      toast({
        title: "Missing information",
        description: "Please fill in both title and content",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Attempting to insert post', {
        hoa_id: hoa.id,
        author_user_id: user.id,
        title: newPost.title,
        content: newPost.content,
        visibility: newPost.visibility
      });
      
      const { error } = await supabase
        .from('posts')
        .insert({
          hoa_id: hoa.id,
          author_user_id: user.id,
          title: newPost.title,
          content: newPost.content,
          visibility: newPost.visibility
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Post created successfully');
      toast({
        title: "Post created",
        description: "Your post has been submitted for approval"
      });

      setNewPost({ title: '', content: '', visibility: 'PRIVATE' });
      setShowNewPost(false);
      fetchCommunityData();

    } catch (error: any) {
      console.error('Error in createPost:', error);
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const isAdminOrPresident = membership?.role === 'ADMIN' || membership?.role === 'PRESIDENT';

  const handleDocumentAdded = () => {
    setShowDocumentForm(false);
    fetchCommunityData();
  };

  const handleEventAdded = () => {
    setShowEventForm(false);
    fetchCommunityData();
  };

  const handleResourceAdded = () => {
    setShowResourceForm(false);
    fetchCommunityData();
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

  const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.stars, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{hoa?.name} Community Portal</h1>
            <p className="text-muted-foreground">
              Welcome to your private community space
            </p>
          </div>
          {isAdminOrPresident && (
            <Link to={`/community/${slug}/dashboard`}>
              <Button>
                <Shield className="h-4 w-4 mr-2" />
                Community Dashboard
              </Button>
            </Link>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forum">Forum</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Community Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Community Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({reviews.length} reviews)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on community feedback
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">{posts.length}</span> forum posts
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{events.length}</span> upcoming events
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{documents.length}</span> documents
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => { setActiveTab('forum'); setShowNewPost(true); }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      New Post
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setActiveTab('events')}>
                      <Calendar className="h-4 w-4 mr-2" />
                      View Events
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setActiveTab('documents')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Browse Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Latest Posts Preview */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Latest Forum Posts</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('forum')}>View All</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {posts.slice(0, 4).map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm truncate flex-1">{post.title}</h4>
                        {post.is_pinned && <Badge variant="secondary" className="ml-2">Pinned</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
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
                    <div>
                      <Label htmlFor="visibility">Visibility</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="visibility"
                            checked={newPost.visibility === 'PRIVATE'}
                            onChange={() => setNewPost(prev => ({ ...prev, visibility: 'PRIVATE' }))}
                            className="text-primary"
                          />
                          <Lock className="h-4 w-4" />
                          <span className="text-sm">Private Community</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="visibility"
                            checked={newPost.visibility === 'PUBLIC'}
                            onChange={() => setNewPost(prev => ({ ...prev, visibility: 'PUBLIC' }))}
                            className="text-primary"
                          />
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">Public Feed</span>
                        </label>
                      </div>
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
                            {post.visibility === 'PUBLIC' && (
                              <Badge variant="outline" className="gap-1">
                                <Globe className="h-3 w-3" />
                                Public
                              </Badge>
                            )}
                            {post.visibility === 'PRIVATE' && (
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Private
                              </Badge>
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

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Community Reviews</h2>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {reviews.filter(r => r.stars >= 4).length} Positive
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <ThumbsDown className="h-3 w-3" />
                    {reviews.filter(r => r.stars <= 2).length} Negative
                  </Badge>
                </div>
              </div>

              {/* Reviews Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Community Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    {[5, 4, 3, 2, 1].map(stars => (
                      <div key={stars} className="space-y-1">
                        <div className="flex justify-center">
                          {Array.from({ length: stars }, (_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <div className="text-sm font-medium">
                          {reviews.filter(r => r.stars === stars).length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stars} star{stars !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reviews */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Reviews</h3>
                {reviews.map((review) => {
                  const response = adminResponses.find(r => r.review_id === review.id);
                  return (
                    <Card key={review.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {review.is_anonymous ? 'Anonymous' : 'HOA Member'}
                              </p>
                              <div className="flex items-center space-x-2">
                                <div className="flex">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={review.stars >= 4 ? "default" : review.stars <= 2 ? "destructive" : "secondary"}>
                            {review.stars >= 4 ? "Positive" : review.stars <= 2 ? "Negative" : "Neutral"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {review.title && (
                          <h4 className="font-semibold mb-2">{review.title}</h4>
                        )}
                        {review.content && (
                          <p className="text-muted-foreground mb-4">{review.content}</p>
                        )}
                        {response && (
                          <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                            <div className="flex items-center space-x-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">HOA Response</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(response.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{response.content}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                
                {reviews.length === 0 && (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">
                      Community reviews will appear here when submitted
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Document Library</h2>
                {isAdminOrPresident && (
                  <Button onClick={() => setShowDocumentForm(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                )}
              </div>

              {showDocumentForm && (
                <DocumentManagement
                  hoaId={hoa!.id}
                  isAdmin={isAdminOrPresident}
                  onDocumentAdded={handleDocumentAdded}
                  onCancel={() => setShowDocumentForm(false)}
                />
              )}

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
                <h2 className="text-2xl font-semibold">Community Events</h2>
                {isAdminOrPresident && !showEventForm && (
                  <Button onClick={() => setShowEventForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </div>

              {showEventForm ? (
                <EventManagement
                  hoaId={hoa!.id}
                  isAdmin={isAdminOrPresident}
                />
              ) : (
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
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Community Resources</h2>
                {isAdminOrPresident && !showResourceForm && (
                  <Button onClick={() => setShowResourceForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                )}
              </div>

              {showResourceForm ? (
                <CommunityResourcesManager
                  hoaId={hoa!.id}
                  isAdmin={isAdminOrPresident}
                />
              ) : (
                <div className="space-y-6">
                  {/* Resource Categories */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ExternalLink className="h-5 w-5 text-blue-500" />
                          Important Links
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            HOA Management Portal
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Maintenance Requests
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Payment Portal
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-green-500" />
                          Forms & Documents
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Architectural Request Form
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            HOA Bylaws
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Community Guidelines
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-500" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="font-medium">Management Office</p>
                            <p className="text-muted-foreground">Mon-Fri 9AM-5PM</p>
                            <p className="text-muted-foreground">(555) 123-4567</p>
                          </div>
                          <Separator />
                          <div>
                            <p className="font-medium">Emergency Maintenance</p>
                            <p className="text-muted-foreground">24/7 Available</p>
                            <p className="text-muted-foreground">(555) 987-6543</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Community Guidelines */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-orange-500" />
                        Community Guidelines
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <ul className="space-y-2">
                          <li>Respect your neighbors and maintain community standards</li>
                          <li>Follow architectural guidelines for any modifications</li>
                          <li>Keep common areas clean and accessible</li>
                          <li>Report maintenance issues promptly through proper channels</li>
                          <li>Participate in community meetings and votes when possible</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {hoa?.description_private && (
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
                          
                          <div>
                            <h4 className="font-semibold mb-2">Private Community Description</h4>
                            <p className="text-muted-foreground">{hoa.description_private}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};