import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Plus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

interface CommunityGuidance {
  id: string;
  hoa_id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  display_order: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface CommunityGuidanceEditorProps {
  hoaId: string;
  isAdmin?: boolean;
}

const guidanceSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().trim().min(10, "Content must be at least 10 characters").max(5000, "Content must be less than 5000 characters"),
  category: z.string().min(1, "Category is required"),
  display_order: z.number().min(0, "Display order must be positive")
});

const GUIDANCE_CATEGORIES = [
  'GENERAL',
  'POSTING_GUIDELINES',
  'EVENT_PARTICIPATION',
  'DOCUMENT_ACCESS',
  'COMMUNITY_RULES',
  'CONTACT_INFO',
  'EMERGENCY_PROCEDURES',
  'MAINTENANCE_REQUESTS'
];

export const CommunityGuidanceEditor: React.FC<CommunityGuidanceEditorProps> = ({
  hoaId,
  isAdmin = false
}) => {
  const [guidances, setGuidances] = useState<CommunityGuidance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    display_order: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadGuidance();
  }, [hoaId]);

  const loadGuidance = async () => {
    try {
      const { data, error } = await supabase
        .from('community_guidance')
        .select('*')
        .eq('hoa_id', hoaId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setGuidances(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading guidance",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data: typeof formData) => {
    try {
      guidanceSchema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async (guidance: CommunityGuidance | null) => {
    if (!user || !isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can edit guidance",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm(formData)) {
      toast({
        title: "Validation error",
        description: "Please fix the form errors before saving",
        variant: "destructive"
      });
      return;
    }

    try {
      const guidanceData = {
        ...formData,
        hoa_id: hoaId,
        updated_by: user.id,
        is_active: true
      };

      let error;
      
      if (guidance) {
        // Update existing guidance
        const { error: updateError } = await supabase
          .from('community_guidance')
          .update(guidanceData)
          .eq('id', guidance.id);
        error = updateError;
      } else {
        // Create new guidance
        const { error: insertError } = await supabase
          .from('community_guidance')
          .insert([{ ...guidanceData, created_by: user.id }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: guidance ? "Guidance updated" : "Guidance created",
        description: `"${formData.title}" has been ${guidance ? 'updated' : 'created'} successfully`,
      });

      setEditingId(null);
      setShowAddForm(false);
      resetForm();
      loadGuidance();
    } catch (error: any) {
      toast({
        title: guidance ? "Error updating guidance" : "Error creating guidance",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (guidance: CommunityGuidance) => {
    setFormData({
      title: guidance.title,
      content: guidance.content,
      category: guidance.category,
      display_order: guidance.display_order
    });
    setEditingId(guidance.id);
    setErrors({});
  };

  const handleToggleActive = async (guidance: CommunityGuidance) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('community_guidance')
        .update({ 
          is_active: !guidance.is_active,
          updated_by: user.id
        })
        .eq('id', guidance.id);

      if (error) throw error;

      toast({
        title: guidance.is_active ? "Guidance hidden" : "Guidance shown",
        description: `"${guidance.title}" is now ${guidance.is_active ? 'hidden from' : 'visible to'} members`,
      });

      loadGuidance();
    } catch (error: any) {
      toast({
        title: "Error updating guidance",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (guidance: CommunityGuidance) => {
    if (!confirm("Are you sure you want to delete this guidance?")) return;

    try {
      const { error } = await supabase
        .from('community_guidance')
        .delete()
        .eq('id', guidance.id);

      if (error) throw error;

      toast({
        title: "Guidance deleted",
        description: `"${guidance.title}" has been deleted successfully`,
      });

      loadGuidance();
    } catch (error: any) {
      toast({
        title: "Error deleting guidance",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'GENERAL',
      display_order: 0
    });
    setErrors({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    resetForm();
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loading) {
    return <div className="text-center py-4">Loading guidance...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Guidance</h2>
          <p className="text-muted-foreground">
            Manage guidance and instructions for community members
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Guidance
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Textarea
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief title for this guidance section"
                  className={errors.title ? "border-red-500" : ""}
                  rows={1}
                />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Detailed guidance content for community members..."
                  className={errors.content ? "border-red-500" : ""}
                  rows={6}
                />
                {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GUIDANCE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Textarea
                    id="display_order"
                    type="number"
                    value={formData.display_order.toString()}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      display_order: parseInt(e.target.value) || 0 
                    }))}
                    className={errors.display_order ? "border-red-500" : ""}
                    rows={1}
                  />
                  {errors.display_order && <p className="text-sm text-red-500 mt-1">{errors.display_order}</p>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave(null)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Guidance
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {guidances.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No Guidance Available</h3>
              <p className="text-muted-foreground">
                {isAdmin ? 'Add your first guidance section to help community members.' : 'Check back later for community guidance and instructions.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          guidances.map((guidance) => (
            <Card key={guidance.id} className={!guidance.is_active ? "opacity-60" : ""}>
              <CardContent className="p-6">
                {editingId === guidance.id ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Textarea
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className={errors.title ? "border-red-500" : ""}
                        rows={1}
                      />
                      {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <Label>Content</Label>
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        className={errors.content ? "border-red-500" : ""}
                        rows={6}
                      />
                      {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GUIDANCE_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {getCategoryLabel(category)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Display Order</Label>
                        <Textarea
                          type="number"
                          value={formData.display_order.toString()}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            display_order: parseInt(e.target.value) || 0 
                          }))}
                          rows={1}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleSave(guidance)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{guidance.title}</h3>
                        <Badge variant="outline">
                          {getCategoryLabel(guidance.category)}
                        </Badge>
                        {!guidance.is_active && (
                          <Badge variant="secondary">Hidden</Badge>
                        )}
                      </div>
                      
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {guidance.content}
                        </p>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(guidance)}
                        >
                          {guidance.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(guidance)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(guidance)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};