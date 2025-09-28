import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export const BulkHOAUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = [
      'name',
      'city',
      'state', 
      'zip_code',
      'unit_count',
      'description_public',
      'description_private',
      'amenities' // comma-separated values
    ];
    
    const sampleData = [
      'Sample HOA,Sample City,CA,90210,150,A beautiful community,Private community info,"Pool,Gym,Park"'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hoa_bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          let value = values[index]?.replace(/"/g, '') || '';
          
          if (header === 'unit_count') {
            row[header] = value ? parseInt(value) : null;
          } else if (header === 'amenities') {
            row[header] = value ? value.split(',').map(a => a.trim()).filter(a => a) : [];
          } else {
            row[header] = value || null;
          }
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  };

  const processUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;
    
    try {
      const text = await file.text();
      const hoaData = parseCSV(text);
      
      if (hoaData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Process each HOA
      for (const [index, hoa] of hoaData.entries()) {
        try {
          if (!hoa.name || !hoa.city || !hoa.state) {
            errors.push(`Row ${index + 2}: Missing required fields (name, city, state)`);
            failed++;
            continue;
          }

          // Generate unique slug
          let slug = generateSlug(hoa.name);
          let counter = 0;
          
          while (true) {
            const { data: existing } = await supabase
              .from('hoas')
              .select('id')
              .eq('slug', counter > 0 ? `${slug}-${counter}` : slug)
              .single();
            
            if (!existing) {
              if (counter > 0) slug = `${slug}-${counter}`;
              break;
            }
            counter++;
          }

          // Insert HOA
          const { error: hoaError } = await supabase
            .from('hoas')
            .insert({
              name: hoa.name,
              slug,
              city: hoa.city,
              state: hoa.state,
              zip_code: hoa.zip_code,
              unit_count: hoa.unit_count,
              description_public: hoa.description_public,
              description_private: hoa.description_private,
              amenities: hoa.amenities || []
            });

          if (hoaError) {
            errors.push(`Row ${index + 2}: ${hoaError.message}`);
            failed++;
          } else {
            successful++;
          }
        } catch (error: any) {
          errors.push(`Row ${index + 2}: ${error.message}`);
          failed++;
        }
      }

      // Log bulk operation
      await supabase
        .from('bulk_operations')
        .insert({
          operator_user_id: user.data.user.id,
          operation_type: 'BULK_HOA_IMPORT',
          file_name: file.name,
          total_records: hoaData.length,
          successful_records: successful,
          failed_records: failed,
          details: { errors: errors.slice(0, 10) } // Store first 10 errors
        });

      setResult({
        total: hoaData.length,
        successful,
        failed,
        errors
      });

      toast({
        title: "Upload Complete",
        description: `Successfully imported ${successful} HOAs. ${failed} failed.`
      });

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk HOA Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              Download the template CSV file to see the required format and sample data.
            </AlertDescription>
          </Alert>

          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload CSV File</label>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button 
            onClick={processUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Processing...' : 'Upload HOAs'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{result.successful}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-red-600">Errors:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      ... and {result.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};