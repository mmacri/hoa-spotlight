import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users } from 'lucide-react';

export interface HOA {
  id: string;
  name: string;
  slug: string;
  description_public: string;
  city: string;
  state: string;
  zip_code: string;
  amenities: string[];
  unit_count: number;
  average_rating?: number;
  total_reviews?: number;
}

interface HOACardProps {
  hoa: HOA;
}

export const HOACard: React.FC<HOACardProps> = ({ hoa }) => {
  return (
    <Link to={`/hoa/${hoa.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{hoa.name}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            {hoa.city}, {hoa.state} {hoa.zip_code}
          </div>
          
          {hoa.average_rating && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 font-medium">{hoa.average_rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({hoa.total_reviews} reviews)
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {hoa.description_public}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              {hoa.unit_count} units
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {hoa.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {hoa.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{hoa.amenities.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};