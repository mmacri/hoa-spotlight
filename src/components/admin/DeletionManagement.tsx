import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Trash2, 
  AlertTriangle,
  Building2,
  MessageSquare,
  FileText,
  Users,
  Calendar,
  File,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeletableItem {
  id: string;
  name: string;
  type: string;
  created_at: string;
  details?: any;
  relatedCount?: number;
}

interface DeletionStats {
  hoas: number;
  reviews: number;
  posts: number;
  comments: number;
  memberships: number;
  events: number;
  documents: number;
}

export const DeletionManagement: React.FC = () => {
  const [stats, setStats] = useState<DeletionStats>({
    hoas: 0,
    reviews: 0,
    posts: 0,
    comments: 0,
    memberships: 0,
    events: 0,
    documents: 0
  });
  const [items, setItems] = useState<DeletableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('hoas');
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats for all content types
      const [hoaStats, reviewStats, postStats, commentStats, membershipStats, eventStats, documentStats] = await Promise.all([
        supabase.from('hoas').select('id', { count: 'exact' }),
        supabase.from('reviews').select('id', { count: 'exact' }),
        supabase.from('posts').select('id', { count: 'exact' }),
        supabase.from('comments').select('id', { count: 'exact' }),
        supabase.from('memberships').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('documents').select('id', { count: 'exact' })
      ]);

      setStats({
        hoas: hoaStats.count || 0,
        reviews: reviewStats.count || 0,
        posts: postStats.count || 0,
        comments: commentStats.count || 0,
        memberships: membershipStats.count || 0,
        events: eventStats.count || 0,
        documents: documentStats.count || 0
      });

      // Fetch items based on active tab
      await fetchItemsByType(activeTab);

    } catch (error) {
      console.error('Error fetching deletion data:', error);
      toast({
        title: "Error",
        description: "Failed to load deletion management data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchItemsByType = async (type: string) => {
    let query;
    let items: DeletableItem[] = [];

    switch (type) {
      case 'hoas':
        const { data: hoas } = await supabase
          .from('hoas')
          .select(`
            id,
            name,
            created_at,
            city,
            state,
            unit_count
          `)
          .order('created_at', { ascending: false });

        if (hoas) {
          // Get related counts for each HOA
          const hoasWithCounts = await Promise.all(
            hoas.map(async (hoa) => {
              const [members, reviews, posts] = await Promise.all([
                supabase.from('memberships').select('id', { count: 'exact' }).eq('hoa_id', hoa.id),
                supabase.from('reviews').select('id', { count: 'exact' }).eq('hoa_id', hoa.id),
                supabase.from('posts').select('id', { count: 'exact' }).eq('hoa_id', hoa.id)
              ]);

              return {
                id: hoa.id,
                name: hoa.name,
                type: 'HOA',
                created_at: hoa.created_at,
                details: {
                  location: `${hoa.city}, ${hoa.state}`,
                  units: hoa.unit_count
                },
                relatedCount: (members.count || 0) + (reviews.count || 0) + (posts.count || 0)
              };
            })
          );
          items = hoasWithCounts;
        }
        break;

      case 'reviews':
        const { data: reviews } = await supabase
          .from('reviews')
          .select(`
            id,
            title,
            content,
            stars,
            created_at,
            status,
            hoa_id,
            user_id
          `)
          .order('created_at', { ascending: false });

        if (reviews) {
          const reviewsWithDetails = await Promise.all(
            reviews.map(async (review) => {
              const [hoaRes, userRes] = await Promise.all([
                supabase.from('hoas').select('name').eq('id', review.hoa_id).single(),
                supabase.from('profiles').select('full_name, username').eq('id', review.user_id).single()
              ]);

              return {
                id: review.id,
                name: review.title || 'Untitled Review',
                type: 'Review',
                created_at: review.created_at,
                details: {
                  hoa: hoaRes.data?.name,
                  author: userRes.data?.full_name || userRes.data?.username,
                  stars: review.stars,
                  status: review.status
                }
              };
            })
          );
          items = reviewsWithDetails;
        }
        break;

      case 'posts':
        const { data: posts } = await supabase
          .from('posts')
          .select(`
            id,
            title,
            created_at,
            visibility,
            status,
            hoa_id,
            author_user_id
          `)
          .order('created_at', { ascending: false });

        if (posts) {
          // Get additional details for each post
          const postsWithDetails = await Promise.all(
            posts.map(async (post) => {
              const [hoaRes, authorRes, commentsRes] = await Promise.all([
                supabase.from('hoas').select('name').eq('id', post.hoa_id).single(),
                supabase.from('profiles').select('full_name, username').eq('id', post.author_user_id).single(),
                supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id)
              ]);

              return {
                id: post.id,
                name: post.title,
                type: 'Post',
                created_at: post.created_at,
                details: {
                  hoa: hoaRes.data?.name,
                  author: authorRes.data?.full_name || authorRes.data?.username,
                  visibility: post.visibility,
                  status: post.status
                },
                relatedCount: commentsRes.count || 0
              };
            })
          );
          items = postsWithDetails;
        }
        break;

      case 'comments':
        const { data: comments } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            status,
            post_id,
            author_user_id
          `)
          .order('created_at', { ascending: false });

        if (comments) {
          const commentsWithDetails = await Promise.all(
            comments.map(async (comment) => {
              const [postRes, authorRes] = await Promise.all([
                supabase.from('posts').select('title, hoa_id').eq('id', comment.post_id).single(),
                supabase.from('profiles').select('full_name, username').eq('id', comment.author_user_id).single()
              ]);

              let hoaName = '';
              if (postRes.data?.hoa_id) {
                const hoaRes = await supabase.from('hoas').select('name').eq('id', postRes.data.hoa_id).single();
                hoaName = hoaRes.data?.name || '';
              }

              return {
                id: comment.id,
                name: `Comment on "${postRes.data?.title || 'Unknown Post'}"`,
                type: 'Comment',
                created_at: comment.created_at,
                details: {
                  hoa: hoaName,
                  author: authorRes.data?.full_name || authorRes.data?.username,
                  status: comment.status,
                  preview: comment.content?.substring(0, 100) + (comment.content?.length > 100 ? '...' : '')
                }
              };
            })
          );
          items = commentsWithDetails;
        }
        break;

      case 'memberships':
        const { data: memberships } = await supabase
          .from('memberships')
          .select(`
            id,
            role,
            status,
            created_at,
            hoa_id,
            user_id
          `)
          .order('created_at', { ascending: false });

        if (memberships) {
          const membershipsWithDetails = await Promise.all(
            memberships.map(async (membership) => {
              const [hoaRes, userRes] = await Promise.all([
                supabase.from('hoas').select('name').eq('id', membership.hoa_id).single(),
                supabase.from('profiles').select('full_name, username').eq('id', membership.user_id).single()
              ]);

              return {
                id: membership.id,
                name: `${userRes.data?.full_name || userRes.data?.username || 'Unknown'} - ${hoaRes.data?.name || 'Unknown HOA'}`,
                type: 'Membership',
                created_at: membership.created_at,
                details: {
                  role: membership.role,
                  status: membership.status,
                  hoa: hoaRes.data?.name,
                  user: userRes.data?.full_name || userRes.data?.username
                }
              };
            })
          );
          items = membershipsWithDetails;
        }
        break;

      default:
        items = [];
    }

    setItems(items);
  };

  const handleDelete = async (item: DeletableItem) => {
    setDeleting(item.id);
    try {
      let error;

      if (item.type === 'HOA') {
        // Use cascade deletion function for HOAs
        const { data: user } = await supabase.auth.getUser();
        const { error: cascadeError } = await supabase.rpc('delete_hoa_cascade', {
          hoa_id_param: item.id,
          admin_user_id: user.user?.id
        });
        error = cascadeError;
      } else {
        // Direct deletion for other types
        const tableName = getTableName(item.type);
        const { error: deleteError } = await supabase
          .from(tableName as any)
          .delete()
          .eq('id', item.id);
        error = deleteError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `${item.type} "${item.name}" has been deleted`,
      });

      // Refresh the data
      fetchData();

    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${item.type.toLowerCase()}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const getTableName = (type: string): string => {
    const tableMap: Record<string, string> = {
      'Review': 'reviews',
      'Post': 'posts',
      'Comment': 'comments',
      'Membership': 'memberships',
      'Event': 'events',
      'Document': 'documents'
    };
    return tableMap[type] || type.toLowerCase();
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'HOA': Building2,
      'Review': MessageSquare,
      'Post': FileText,
      'Comment': MessageSquare,
      'Membership': Users,
      'Event': Calendar,
      'Document': File
    };
    return iconMap[type] || FileText;
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.details?.hoa && item.details.hoa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-8">Loading deletion management...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <ShieldAlert className="h-6 w-6 mr-2 text-red-500" />
            Deletion Management
          </h2>
          <p className="text-muted-foreground">
            Platform administrators can delete any content across the platform
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.hoas}</p>
            <p className="text-sm text-muted-foreground">HOAs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.reviews}</p>
            <p className="text-sm text-muted-foreground">Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.posts}</p>
            <p className="text-sm text-muted-foreground">Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.comments}</p>
            <p className="text-sm text-muted-foreground">Comments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.memberships}</p>
            <p className="text-sm text-muted-foreground">Memberships</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.events}</p>
            <p className="text-sm text-muted-foreground">Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <File className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.documents}</p>
            <p className="text-sm text-muted-foreground">Documents</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search content to delete..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hoas">HOAs ({stats.hoas})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({stats.reviews})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({stats.posts})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({stats.comments})</TabsTrigger>
          <TabsTrigger value="memberships">Memberships ({stats.memberships})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <Card key={item.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <TypeIcon className="h-5 w-5" />
                          <h3 className="font-semibold">{item.name}</h3>
                          <Badge variant="outline">{item.type}</Badge>
                          {item.relatedCount !== undefined && item.relatedCount > 0 && (
                            <Badge variant="secondary">
                              {item.relatedCount} related items
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Created:</span>
                            <br />
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                          {item.details?.hoa && (
                            <div>
                              <span className="font-medium">HOA:</span>
                              <br />
                              {item.details.hoa}
                            </div>
                          )}
                          {item.details?.author && (
                            <div>
                              <span className="font-medium">Author:</span>
                              <br />
                              {item.details.author}
                            </div>
                          )}
                          {item.details?.status && (
                            <div>
                              <span className="font-medium">Status:</span>
                              <br />
                              <Badge variant="outline">{item.details.status}</Badge>
                            </div>
                          )}
                        </div>

                        {item.details?.preview && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            {item.details.preview}
                          </div>
                        )}
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={deleting === item.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleting === item.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                              Confirm Deletion
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              <div className="space-y-2">
                                <p>
                                  Are you sure you want to delete this {item.type.toLowerCase()}?
                                </p>
                                <div className="font-semibold">"{item.name}"</div>
                                {item.type === 'HOA' && (
                                  <div className="text-red-600 font-medium">
                                    ⚠️ This will also delete ALL related content including:
                                    <ul className="list-disc list-inside mt-1 text-sm">
                                      <li>All memberships</li>
                                      <li>All reviews and admin responses</li>
                                      <li>All posts and comments</li>
                                      <li>All events and documents</li>
                                      <li>All audit logs</li>
                                    </ul>
                                  </div>
                                )}
                                {item.relatedCount && item.relatedCount > 0 && item.type !== 'HOA' && (
                                  <div className="text-orange-600">
                                    This will also delete {item.relatedCount} related items.
                                  </div>
                                )}
                                <p className="text-sm">
                                  This action cannot be undone and will be logged in the audit trail.
                                </p>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDelete(item)}
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredItems.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <TypeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No items found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No items match your search criteria' : `No ${activeTab} to display`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TypeIcon = ({ className }: { className?: string }) => <FileText className={className} />;