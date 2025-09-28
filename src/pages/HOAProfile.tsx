import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ReviewCard, Review, AdminResponse } from '@/components/reviews/ReviewCard';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  MapPin, 
  Users, 
  Building2, 
  MessageSquare,
  Plus
} from 'lucide-react';

interface HOADetails {
  id: string;
  name: string;
  slug: string;
  description_public: string;
  city: string;
  state: string;
  zip_code: string;
  amenities: string[];
  unit_count: number;
}

interface RatingBreakdown {
  total_reviews: number;
  average_rating: number;
  stars_1_count: number;
  stars_2_count: number;
  stars_3_count: number;
  stars_4_count: number;
  stars_5_count: number;
}

export const HOAProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [hoa, setHoa] = useState<HOADetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [adminResponses, setAdminResponses] = useState<AdminResponse[]>([]);
  const [ratings, setRatings] = useState<RatingBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchHOAData();
    }
  }, [slug, user]);

  const fetchHOAData = async () => {
    try {
      // Fetch HOA details
      const { data: hoaData, error: hoaError } = await supabase
        .from('hoas')
        .select('*')
        .eq('slug', slug)
        .single();

      if (hoaError) throw hoaError;
      setHoa(hoaData);

      // Calculate ratings from reviews
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('reviews')
        .select('stars')
        .eq('hoa_id', hoaData.id)
        .eq('status', 'APPROVED');

      if (ratingsError) throw ratingsError;
      
      if (ratingsData && ratingsData.length > 0) {
        const totalReviews = ratingsData.length;
        const totalStars = ratingsData.reduce((sum, review) => sum + review.stars, 0);
        const averageRating = totalStars / totalReviews;
        
        const breakdown = {
          total_reviews: totalReviews,
          average_rating: Number(averageRating.toFixed(2)),
          stars_1_count: ratingsData.filter(r => r.stars === 1).length,
          stars_2_count: ratingsData.filter(r => r.stars === 2).length,
          stars_3_count: ratingsData.filter(r => r.stars === 3).length,
          stars_4_count: ratingsData.filter(r => r.stars === 4).length,
          stars_5_count: ratingsData.filter(r => r.stars === 5).length,
        };
        
        setRatings(breakdown);
      }

      // Fetch approved reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('hoa_id', hoaData.id)
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Fetch admin responses
      const reviewIds = reviewsData?.map(r => r.id) || [];
      if (reviewIds.length > 0) {
        const { data: responsesData, error: responsesError } = await supabase
          .from('admin_responses')
          .select('*')
          .in('review_id', reviewIds);

        if (responsesError) throw responsesError;
        setAdminResponses(responsesData || []);
      }

      // Check if current user has already reviewed this HOA
      if (user) {
        const { data: userReview, error: userReviewError } = await supabase
          .from('reviews')
          .select('id')
          .eq('hoa_id', hoaData.id)
          .eq('user_id', user.id)
          .single();

        if (!userReviewError && userReview) {
          setUserHasReviewed(true);
        }
      }

    } catch (error: any) {
      toast({
        title: "Error loading HOA",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setUserHasReviewed(true);
    fetchHOAData(); // Refresh data
  };

  const renderRatingBreakdown = () => {
    if (!ratings || ratings.total_reviews === 0) return null;

    const getPercentage = (count: number) => 
      (count / ratings.total_reviews) * 100;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Rating Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{ratings.average_rating}</div>
            <div className="flex justify-center mb-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(ratings.average_rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on {ratings.total_reviews} reviews
            </p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratings[`stars_${stars}_count` as keyof RatingBreakdown] as number;
              const percentage = getPercentage(count);
              
              return (
                <div key={stars} className="flex items-center space-x-2">
                  <span className="text-sm w-8">{stars}★</span>
                  <Progress value={percentage} className="flex-1" />
                  <span className="text-sm text-muted-foreground w-8">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hoa) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">HOA Not Found</h1>
            <p className="text-muted-foreground">
              The HOA community you're looking for doesn't exist.
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
        {/* HOA Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{hoa.name}</h1>
          <div className="flex items-center text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 mr-1" />
            {hoa.city}, {hoa.state} {hoa.zip_code}
          </div>
          
          <div className="flex items-center space-x-6 mb-6">
            {ratings && (
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{ratings.average_rating}</span>
                <span className="text-muted-foreground">
                  ({ratings.total_reviews} reviews)
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{hoa.unit_count} units</span>
            </div>
          </div>

          {hoa.description_public && (
            <p className="text-muted-foreground mb-6 max-w-3xl">
              {hoa.description_public}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {hoa.amenities.map((amenity) => (
              <Badge key={amenity} variant="secondary">
                {amenity}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList>
                <TabsTrigger value="reviews">
                  Reviews ({ratings?.total_reviews || 0})
                </TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="reviews" className="mt-6">
                {user && !userHasReviewed && !showReviewForm && (
                  <div className="mb-6">
                    <Button onClick={() => setShowReviewForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Write a Review
                    </Button>
                  </div>
                )}

                {showReviewForm && (
                  <div className="mb-6">
                    <ReviewForm
                      hoaId={hoa.id}
                      onReviewSubmitted={handleReviewSubmitted}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const adminResponse = adminResponses.find(
                        r => r.review_id === review.id
                      );
                      
                      return (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          adminResponse={adminResponse}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to share your experience with this HOA
                    </p>
                    {user && !userHasReviewed && (
                      <Button onClick={() => setShowReviewForm(true)}>
                        Write the first review
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Community Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Location</h4>
                        <p className="text-muted-foreground">
                          {hoa.city}, {hoa.state} {hoa.zip_code}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Community Size</h4>
                        <p className="text-muted-foreground">
                          {hoa.unit_count} residential units
                        </p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2">Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                          {hoa.amenities.map((amenity) => (
                            <Badge key={amenity} variant="outline">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {renderRatingBreakdown()}
            
            <Card>
              <CardHeader>
                <CardTitle>Community Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user ? (
                    <>
                      {!userHasReviewed && (
                        <Button 
                          className="w-full" 
                          onClick={() => setShowReviewForm(true)}
                        >
                          Write a Review
                        </Button>
                      )}
                      <Button variant="outline" className="w-full">
                        Request Membership
                      </Button>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Sign in to write reviews and join the community
                      </p>
                      <Button size="sm">Sign In</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};