import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Link as LinkIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentManagementProps {
  hoaId: string;
  isAdmin?: boolean;
  onDocumentAdded?: () => void;
  onCancel?: () => void;
}

export const DocumentManagement: React.FC<DocumentManagementProps> = ({ 
  hoaId, 
  isAdmin = false, 
  onDocumentAdded,
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    file_type: 'LINK',
    visibility: 'PRIVATE' as 'PUBLIC' | 'PRIVATE'
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can add documents",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a document title",
        variant: "destructive"
      });
      return;
    }

    if (formData.file_type === 'LINK' && !formData.file_url.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a valid URL for the link",
        variant: "destructive"
      });
      return;
    }

    if (formData.file_type === 'FILE' && !file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      let fileUrl = formData.file_url;
      let fileSize = 0;
      let fileType = formData.file_type;

      // Handle file upload if it's a file type
      if (formData.file_type === 'FILE' && file) {
        // For now, we'll store the file name as the URL since we don't have storage configured
        // In a real implementation, you'd upload to Supabase Storage
        fileUrl = file.name;
        fileSize = file.size;
        fileType = file.type;
        
        toast({
          title: "Note",
          description: "File upload functionality requires Supabase Storage to be configured. For now, the file reference has been saved.",
          variant: "default"
        });
      }

      const documentData = {
        hoa_id: hoaId,
        title: formData.title,
        description: formData.description || null,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        visibility: formData.visibility,
        uploaded_by: user.id
      };

      const { error } = await supabase
        .from('documents')
        .insert([documentData]);

      if (error) throw error;

      toast({
        title: "Document added",
        description: `${formData.title} has been added successfully`
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        file_url: '',
        file_type: 'LINK',
        visibility: 'PRIVATE'
      });
      setFile(null);

      onDocumentAdded?.();

    } catch (error: any) {
      toast({
        title: "Error adding document",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Document
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter document title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the document"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="type">Document Type</Label>
            <Select 
              value={formData.file_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, file_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LINK">External Link</SelectItem>
                <SelectItem value="FILE">File Upload</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.file_type === 'LINK' ? (
            <div>
              <Label htmlFor="url">Document URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.file_url}
                onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                placeholder="https://example.com/document.pdf"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select 
              value={formData.visibility} 
              onValueChange={(value: 'PUBLIC' | 'PRIVATE') => setFormData(prev => ({ ...prev, visibility: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private (Members Only)</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  {formData.file_type === 'LINK' ? <LinkIcon className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Add Document
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};