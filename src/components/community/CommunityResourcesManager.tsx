import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Link, FileText, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CommunityResource {
  id: string;
  hoa_id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: string;
  category: string | null;
  is_public: boolean;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CommunityResourcesManagerProps {
  hoaId: string;
  isAdmin?: boolean;
}

const RESOURCE_TYPES = [
  'LINK',
  'DOCUMENT',
  'CONTACT',
  'FORM',
  'POLICY',
  'GUIDE'
];

const RESOURCE_CATEGORIES = [
  'GENERAL',
  'MAINTENANCE',
  'EVENTS',
  'GOVERNANCE',
  'FINANCIAL',
  'LEGAL',
  'EMERGENCY',
  'VENDORS'
];

export const CommunityResourcesManager: React.FC<CommunityResourcesManagerProps> = ({ 
  hoaId, 
  isAdmin = false 
}) => {
  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<CommunityResource | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'LINK',
    category: 'GENERAL',
    is_public: false,
    display_order: 0
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadResources();
  }, [hoaId]);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from('community_resources')
        .select('*')
        .eq('hoa_id', hoaId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading resources",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can manage resources",
        variant: "destructive"
      });
      return;
    }

    try {
      const resourceData = {
        ...formData,
        hoa_id: hoaId,
        created_by: user.id
      };

      let error;
      
      if (editingResource) {
        const { error: updateError } = await supabase
          .from('community_resources')
          .update(resourceData)
          .eq('id', editingResource.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('community_resources')
          .insert([resourceData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingResource ? "Resource updated" : "Resource created",
        description: `${formData.title} has been ${editingResource ? 'updated' : 'created'} successfully`,
      });

      resetForm();
      loadResources();
    } catch (error: any) {
      toast({
        title: editingResource ? "Error updating resource" : "Error creating resource",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (resource: CommunityResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      url: resource.url || '',
      type: resource.type,
      category: resource.category || 'GENERAL',
      is_public: resource.is_public,
      display_order: resource.display_order
    });
    setShowForm(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { error } = await supabase
        .from('community_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Resource deleted",
        description: "Resource has been deleted successfully",
      });

      loadResources();
    } catch (error: any) {
      toast({
        title: "Error deleting resource",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      type: 'LINK',
      category: 'GENERAL',
      is_public: false,
      display_order: 0
    });
    setEditingResource(null);
    setShowForm(false);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'LINK':
        return <Link className="h-4 w-4" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      GENERAL: 'bg-gray-100 text-gray-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      EVENTS: 'bg-purple-100 text-purple-800',
      GOVERNANCE: 'bg-blue-100 text-blue-800',
      FINANCIAL: 'bg-green-100 text-green-800',
      LEGAL: 'bg-red-100 text-red-800',
      EMERGENCY: 'bg-red-100 text-red-800',
      VENDORS: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || colors.GENERAL;
  };

  if (loading) {
    return <div className="text-center py-4">Loading resources...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Community Resources</h2>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="url">URL or Link</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com or internal link"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Resource Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0) + category.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
                <Label htmlFor="is_public">Make this resource public</Label>
              </div>

              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingResource ? 'Update Resource' : 'Add Resource'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {resources.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Resources Available</h3>
              <p className="text-muted-foreground">
                {isAdmin ? 'Add your first community resource to get started.' : 'Check back later for community resources and links.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getResourceIcon(resource.type)}
                      <h3 className="text-lg font-semibold">{resource.title}</h3>
                      <Badge className={getCategoryColor(resource.category || 'GENERAL')}>
                        {resource.category?.toLowerCase()}
                      </Badge>
                      {resource.is_public && (
                        <Badge variant="outline">Public</Badge>
                      )}
                    </div>
                    
                    {resource.description && (
                      <p className="text-muted-foreground mb-3">{resource.description}</p>
                    )}
                    
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Resource
                      </a>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(resource)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(resource.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};