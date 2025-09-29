import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { HOACard, HOA } from '@/components/hoa/HOACard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const AMENITIES = [
  'Pool', 'Gym', 'Tennis Court', 'Playground', 'Clubhouse', 'Walking Trails',
  'Dog Park', 'Community Garden', 'Marina', 'Concierge', 'Spa', 'Private Beach',
  'Valet Parking', 'Basketball Court', 'Picnic Area', 'Bike Storage', 'Fitness Center',
  'Rooftop Deck', 'Pet Wash Station', 'Community Center', 'Beach Access', 'Hot Tub',
  'Parking Garage', 'Mailbox Cluster', 'Golf Course', 'Security Gate', 'Business Center',
  'Pet Park', 'Rooftop Lounge'
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hoas, setHoas] = useState<HOA[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || 'all');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities')?.split(',').filter(Boolean) || []
  );
  const [minRating, setMinRating] = useState(searchParams.get('rating') || 'any');
  const { toast } = useToast();

  useEffect(() => {
    searchHOAs();
  }, []);

  // Auto-search when search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchHOAs();
        updateSearchParams();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Auto-search when filters change
  useEffect(() => {
    searchHOAs();
    updateSearchParams();
  }, [selectedState, selectedAmenities, minRating]);

  const searchHOAs = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('hoas')
        .select('*');

      // Text search with fallback
      if (searchQuery.trim()) {
        try {
          query = query.textSearch('search_vector', searchQuery.trim());
        } catch (searchError) {
          // Fallback to basic text search if full-text search fails
          console.warn('Full-text search failed, using fallback:', searchError);
          query = query.or(`name.ilike.%${searchQuery.trim()}%,description_public.ilike.%${searchQuery.trim()}%,city.ilike.%${searchQuery.trim()}%`);
        }
      }

      // State filter
      if (selectedState && selectedState !== 'all') {
        query = query.eq('state', selectedState);
      }

      // Amenities filter
      if (selectedAmenities.length > 0) {
        query = query.overlaps('amenities', selectedAmenities);
      }

      const { data, error } = await query;

      if (error) throw error;

      setHoas(data || []);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
    searchHOAs();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedState && selectedState !== 'all') params.set('state', selectedState);
    if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
    if (minRating && minRating !== 'any') params.set('rating', minRating);
    setSearchParams(params);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedAmenities([]);
    setMinRating('any');
    setSearchParams(new URLSearchParams());
    searchHOAs();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Browse HOA Communities</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Search communities by name, city, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  {STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Minimum rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any rating</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="2">2+ stars</SelectItem>
                </SelectContent>
              </Select>
              
              {(selectedState && selectedState !== 'all' || selectedAmenities.length > 0 || minRating && minRating !== 'any') && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear filters
                </Button>
              )}
            </div>
            
            {/* Amenities Filter */}
            <div>
              <p className="text-sm font-medium mb-2">Amenities:</p>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(amenity => (
                  <Badge
                    key={amenity}
                    variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {loading ? 'Searching...' : `Found ${hoas.length} communities`}
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : hoas.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hoas.map((hoa) => (
              <HOACard key={hoa.id} hoa={hoa} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No communities found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or removing some filters
            </p>
            <Button onClick={clearFilters}>Clear all filters</Button>
          </div>
        )}
      </div>
    </div>
  );
};