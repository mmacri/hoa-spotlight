import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Users, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkMemberUploadProps {
  hoaId: string;
  onComplete?: () => void;
}

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
  newUsers: number;
  existingUsers: number;
}

export const BulkMemberUpload: React.FC<BulkMemberUploadProps> = ({ hoaId, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [defaultRole, setDefaultRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [result, setResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = [
      'full_name',
      'email',
      'role', // MEMBER, ADMIN, PRESIDENT (optional, will use default if not specified)
      'notes' // optional notes for the membership
    ];
    
    const sampleData = [
      'John Doe,john.doe@example.com,MEMBER,New resident',
      'Jane Smith,jane.smith@example.com,ADMIN,Board member'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member_bulk_upload_template.csv';
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
          row[header] = values[index]?.replace(/"/g, '') || '';
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const processUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;
    let newUsers = 0;
    let existingUsers = 0;
    
    try {
      const text = await file.text();
      const memberData = parseCSV(text);
      
      if (memberData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        throw new Error('User not authenticated');
      }

      // Process each member
      for (const [index, member] of memberData.entries()) {
        try {
          if (!member.email || !member.full_name) {
            errors.push(`Row ${index + 2}: Missing required fields (email, full_name)`);
            failed++;
            continue;
          }

          // Check if user exists
          let userId = null;
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', member.email)
            .single();

          if (existingProfile) {
            userId = existingProfile.id;
            existingUsers++;
          } else {
            // Create new user via auth (they'll need to set password via email)
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: member.email,
              email_confirm: true,
              user_metadata: {
                full_name: member.full_name
              }
            });

            if (authError) {
              errors.push(`Row ${index + 2}: Failed to create user - ${authError.message}`);
              failed++;
              continue;
            }

            userId = authData.user?.id;
            newUsers++;
          }

          if (!userId) {
            errors.push(`Row ${index + 2}: Failed to get user ID`);
            failed++;
            continue;
          }

          // Check if membership already exists
          const { data: existingMembership } = await supabase
            .from('memberships')
            .select('id')
            .eq('user_id', userId)
            .eq('hoa_id', hoaId)
            .single();

          if (existingMembership) {
            errors.push(`Row ${index + 2}: User already has membership in this HOA`);
            failed++;
            continue;
          }

          // Create membership
          const memberRole = member.role && ['MEMBER', 'ADMIN', 'PRESIDENT'].includes(member.role.toUpperCase()) 
            ? member.role.toUpperCase() 
            : defaultRole;

          const { error: membershipError } = await supabase
            .from('memberships')
            .insert({
              user_id: userId,
              hoa_id: hoaId,
              role: memberRole,
              status: 'APPROVED',
              approved_by: currentUser.data.user.id,
              approved_at: new Date().toISOString(),
              notes: member.notes || `Bulk imported from ${file.name}`
            });

          if (membershipError) {
            errors.push(`Row ${index + 2}: ${membershipError.message}`);
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
          hoa_id: hoaId,
          operator_user_id: currentUser.data.user.id,
          operation_type: 'BULK_MEMBER_IMPORT',
          file_name: file.name,
          total_records: memberData.length,
          successful_records: successful,
          failed_records: failed,
          details: { 
            errors: errors.slice(0, 10),
            new_users: newUsers,
            existing_users: existingUsers,
            default_role: defaultRole
          }
        });

      setResult({
        total: memberData.length,
        successful,
        failed,
        errors,
        newUsers,
        existingUsers
      });

      toast({
        title: "Upload Complete",
        description: `Successfully imported ${successful} members. ${failed} failed.`
      });

      if (onComplete) {
        onComplete();
      }

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
            <Users className="h-5 w-5" />
            Bulk Member Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              Download the template CSV file to see the required format. New users will be created and invited via email.
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
            <label className="text-sm font-medium">Default Role</label>
            <Select value={defaultRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setDefaultRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This role will be used if no role is specified in the CSV
            </p>
          </div>

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
            <UserPlus className="h-4 w-4 mr-2" />
            {uploading ? 'Processing...' : 'Upload Members'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{result.successful}</p>
                <p className="text-sm text-muted-foreground">Success</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{result.newUsers}</p>
                <p className="text-sm text-muted-foreground">New Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">{result.existingUsers}</p>
                <p className="text-sm text-muted-foreground">Existing</p>
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