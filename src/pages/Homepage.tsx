import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { HOACard, HOA } from '@/components/hoa/HOACard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, Building2, Star, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Homepage: React.FC = () => {
  const [featuredHOAs, setFeaturedHOAs] = useState<HOA[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeaturedHOAs = async () => {
      try {
        const { data, error } = await supabase
          .from('hoas')
          .select('*')
          .limit(6);

        if (error) throw error;

        setFeaturedHOAs(data || []);
      } catch (error: any) {
        toast({
          title: "Error loading HOAs",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedHOAs();
  }, [toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect{' '}
            <span className="text-primary">HOA Community</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover, review, and connect with Homeowners Associations. 
            Make informed decisions about your next home with real resident reviews.
          </p>
          
          <form onSubmit={handleSearch} className="flex max-w-lg mx-auto mb-8">
            <Input
              type="text"
              placeholder="Search by HOA name, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-r-none"
            />
            <Button type="submit" className="rounded-l-none">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/search">
              <Button variant="outline">Browse All HOAs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose HOAdoor?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real Reviews</h3>
              <p className="text-muted-foreground">
                Read authentic reviews from actual HOA members about their living experience
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Insights</h3>
              <p className="text-muted-foreground">
                Access private community discussions and stay informed about your HOA
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Transparent Information</h3>
              <p className="text-muted-foreground">
                Get detailed information about amenities, rules, and community standards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured HOAs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold">Featured Communities</h2>
            <Link to="/search">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredHOAs.map((hoa) => (
                <HOACard key={hoa.id} hoa={hoa} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">HOAdoor</span>
          </div>
          
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 HOAdoor. Connecting communities, one review at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};