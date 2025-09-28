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
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Connect with Your{' '}
            <span className="text-primary">HOA Community</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Join community forums, share experiences, and connect with neighbors in private and public discussions.
          </p>
          
          <form onSubmit={handleSearch} className="flex max-w-md mx-auto mb-6">
            <Input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-r-none"
            />
            <Button type="submit" className="rounded-l-none px-4">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          <Link to="/search">
            <Button variant="outline" size="sm">Browse All Communities</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <Star className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Community Reviews</h3>
              <p className="text-sm text-muted-foreground">
                Share and read authentic resident experiences
              </p>
            </div>
            
            <div>
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Private Forums</h3>
              <p className="text-sm text-muted-foreground">
                Engage in private community discussions and forums
              </p>
            </div>
            
            <div>
              <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Open Communication</h3>
              <p className="text-sm text-muted-foreground">
                Foster transparent communication within your community
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured HOAs */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Featured Communities</h2>
            <Link to="/search">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredHOAs.map((hoa) => (
                <HOACard key={hoa.id} hoa={hoa} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">HOA Community Forums</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2024 HOA Community Forums. Building stronger communities through better communication.
          </p>
        </div>
      </footer>
    </div>
  );
};