import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, User, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface Review {
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

export interface AdminResponse {
  id: string;
  review_id: string;
  responder_user_id: string;
  content: string;
  created_at: string;
}

interface ReviewCardProps {
  review: Review;
  adminResponse?: AdminResponse;
  showAdminResponse?: boolean;
  onReply?: (reviewId: string) => void;
  canReply?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  adminResponse, 
  showAdminResponse = true,
  onReply,
  canReply = false 
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getReviewerName = () => {
    if (review.is_anonymous) return 'Anonymous';
    return 'HOA Member';
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{getReviewerName()}</p>
              <div className="flex items-center space-x-2">
                <div className="flex">{renderStars(review.stars)}</div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(review.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          {review.status !== 'APPROVED' && (
            <Badge variant={review.status === 'PENDING' ? 'outline' : 'destructive'}>
              {review.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {review.title && (
          <h4 className="font-semibold mb-2">{review.title}</h4>
        )}
        
        {review.content && (
          <p className="text-muted-foreground mb-4">{review.content}</p>
        )}
        
        {showAdminResponse && adminResponse && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">HOA Response</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(adminResponse.created_at)}
              </span>
            </div>
            <p className="text-sm">{adminResponse.content}</p>
          </div>
        )}
        
        {canReply && !adminResponse && onReply && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onReply(review.id)}
            className="mt-2"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Reply as HOA
          </Button>
        )}
      </CardContent>
    </Card>
  );
};