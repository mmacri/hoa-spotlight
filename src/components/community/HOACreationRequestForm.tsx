import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const HOACreationRequestForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    zip_code: '',
    unit_count: '',
    description_public: '',
    description_private: '',
    amenities: [] as string[]
  });
  const [newAmenity, setNewAmenity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('hoa_creation_requests')
        .insert({
          requester_user_id: user.id,
          name: formData.name,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          unit_count: formData.unit_count ? parseInt(formData.unit_count) : null,
          description_public: formData.description_public,
          description_private: formData.description_private,
          amenities: formData.amenities
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your HOA creation request has been submitted for admin review"
      });

      // Reset form
      setFormData({
        name: '',
        city: '',
        state: '',
        zip_code: '',
        unit_count: '',
        description_public: '',
        description_private: '',
        amenities: []
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Request New HOA Community
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Submit a request to create a new HOA community. This will be reviewed by platform administrators.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">HOA Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sunset Valley HOA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_count">Number of Units</Label>
              <Input
                id="unit_count"
                type="number"
                value={formData.unit_count}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_count: e.target.value }))}
                placeholder="e.g., 150"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g., Beverly Hills"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                required
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="e.g., CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                placeholder="e.g., 90210"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_public">Public Description</Label>
            <Textarea
              id="description_public"
              value={formData.description_public}
              onChange={(e) => setFormData(prev => ({ ...prev, description_public: e.target.value }))}
              placeholder="Description visible to the public..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_private">Private Description</Label>
            <Textarea
              id="description_private"
              value={formData.description_private}
              onChange={(e) => setFormData(prev => ({ ...prev, description_private: e.target.value }))}
              placeholder="Description visible only to community members..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex gap-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add an amenity..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              />
              <Button type="button" variant="outline" onClick={addAmenity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};