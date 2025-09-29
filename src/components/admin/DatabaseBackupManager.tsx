import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, Database, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface BackupMetadata {
  created_at: string;
  created_by: string;
  version: string;
}

interface DatabaseBackupManagerProps {
  isPlatformAdmin?: boolean;
}

const AVAILABLE_TABLES = [
  { id: 'profiles', name: 'User Profiles', critical: true },
  { id: 'hoas', name: 'HOA Communities', critical: true },
  { id: 'memberships', name: 'Memberships', critical: true },
  { id: 'posts', name: 'Community Posts', critical: false },
  { id: 'comments', name: 'Comments', critical: false },
  { id: 'reviews', name: 'Reviews', critical: false },
  { id: 'events', name: 'Events', critical: false },
  { id: 'documents', name: 'Documents', critical: false },
  { id: 'community_resources', name: 'Community Resources', critical: false },
  { id: 'community_guidance', name: 'Community Guidance', critical: false },
  { id: 'hoa_creation_requests', name: 'HOA Creation Requests', critical: false },
  { id: 'role_promotion_requests', name: 'Role Promotion Requests', critical: false },
  { id: 'admin_responses', name: 'Admin Responses', critical: false },
  { id: 'bulk_operations', name: 'Bulk Operations', critical: false },
  { id: 'community_audit_logs', name: 'Community Audit Logs', critical: false },
  { id: 'audit_logs', name: 'Platform Audit Logs', critical: true },
  { id: 'flags', name: 'Content Flags', critical: false }
];

export const DatabaseBackupManager: React.FC<DatabaseBackupManagerProps> = ({
  isPlatformAdmin = false
}) => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedTables, setSelectedTables] = useState<string[]>(
    AVAILABLE_TABLES.filter(table => table.critical).map(table => table.id)
  );
  const [backupData, setBackupData] = useState<any>(null);
  const [backupMetadata, setBackupMetadata] = useState<BackupMetadata | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  if (!isPlatformAdmin) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            Database backup management is restricted to platform administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCreateBackup = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a backup",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreatingBackup(true);
      setBackupProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.rpc('create_database_backup');

      clearInterval(progressInterval);
      setBackupProgress(100);

      if (error) throw error;

      const backupResult = data as any;
      setBackupData(backupResult);
      setBackupMetadata(backupResult?.backup_metadata);

      // Create downloadable file
      const backupBlob = new Blob([JSON.stringify(backupResult, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(backupBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hoadoor-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup created successfully",
        description: "The backup file has been downloaded to your computer",
      });
    } catch (error: any) {
      toast({
        title: "Error creating backup",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({
          title: "Invalid file type",
          description: "Please select a JSON backup file",
          variant: "destructive"
        });
        return;
      }
      setRestoreFile(file);
      
      // Parse and validate backup file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.backup_metadata) {
            setBackupData(data);
            setBackupMetadata(data.backup_metadata);
            toast({
              title: "Backup file loaded",
              description: `Backup from ${new Date(data.backup_metadata.created_at).toLocaleDateString()}`,
            });
          } else {
            throw new Error('Invalid backup file format');
          }
        } catch (error) {
          toast({
            title: "Invalid backup file",
            description: "The selected file is not a valid backup",
            variant: "destructive"
          });
          setRestoreFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRestoreBackup = async () => {
    if (!backupData || !user) {
      toast({
        title: "No backup data",
        description: "Please upload a valid backup file first",
        variant: "destructive"
      });
      return;
    }

    if (selectedTables.length === 0) {
      toast({
        title: "No tables selected",
        description: "Please select at least one table to restore",
        variant: "destructive"
      });
      return;
    }

    const confirmMessage = `This will restore ${selectedTables.length} table(s) from the backup. This action cannot be undone. Are you sure?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsRestoring(true);
      setRestoreProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setRestoreProgress(prev => Math.min(prev + 15, 90));
      }, 1000);

      const { data, error } = await supabase.rpc('restore_database_backup', {
        backup_data: backupData,
        table_selection: selectedTables
      });

      clearInterval(progressInterval);
      setRestoreProgress(100);

      if (error) throw error;

      toast({
        title: "Restore completed",
        description: data || `Successfully restored ${selectedTables.length} table(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Error restoring backup",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  const handleTableSelection = (tableId: string, checked: boolean) => {
    if (checked) {
      setSelectedTables(prev => [...prev, tableId]);
    } else {
      setSelectedTables(prev => prev.filter(id => id !== tableId));
    }
  };

  const selectAllTables = () => {
    setSelectedTables(AVAILABLE_TABLES.map(table => table.id));
  };

  const selectCriticalTables = () => {
    setSelectedTables(AVAILABLE_TABLES.filter(table => table.critical).map(table => table.id));
  };

  const clearSelection = () => {
    setSelectedTables([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Backup Manager</h2>
          <p className="text-muted-foreground">
            Create and restore complete database backups
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Platform Admin Only
        </Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Database backups contain sensitive information. Handle backup files securely and store them in a safe location.
          Restore operations will overwrite existing data and cannot be undone.
        </AlertDescription>
      </Alert>

      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Create Database Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a complete backup of all database tables and download it as a JSON file.
            This backup can be used to restore data or migrate to another instance.
          </p>

          {isCreatingBackup && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm">Creating backup... {backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isCreatingBackup ? 'Creating Backup...' : 'Create & Download Backup'}
            </Button>
          </div>

          {backupMetadata && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Last backup created on {new Date(backupMetadata.created_at).toLocaleString()}
                (Version {backupMetadata.version})
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Restore Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restore from Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a backup file and select which tables to restore. You can restore all tables
            or select specific tables based on your needs.
          </p>

          {/* File Upload */}
          <div>
            <Label htmlFor="backup-file">Upload Backup File</Label>
            <input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80 file:cursor-pointer cursor-pointer"
            />
          </div>

          {restoreFile && backupMetadata && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Backup file loaded: Created on {new Date(backupMetadata.created_at).toLocaleString()}
                (Version {backupMetadata.version})
              </AlertDescription>
            </Alert>
          )}

          {/* Table Selection */}
          {backupData && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Select Tables to Restore</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose which tables to restore from the backup. Critical tables are pre-selected.
                </p>
                
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={selectAllTables}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectCriticalTables}>
                    Critical Only
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {AVAILABLE_TABLES.map(table => (
                    <div key={table.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={table.id}
                        checked={selectedTables.includes(table.id)}
                        onCheckedChange={(checked) => handleTableSelection(table.id, checked as boolean)}
                      />
                      <Label htmlFor={table.id} className="text-sm flex items-center gap-1">
                        {table.name}
                        {table.critical && (
                          <Badge variant="secondary" className="text-xs">Critical</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {isRestoring && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Restoring backup... {restoreProgress}%</span>
                  </div>
                  <Progress value={restoreProgress} className="w-full" />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleRestoreBackup}
                  disabled={isRestoring || selectedTables.length === 0}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isRestoring ? 'Restoring...' : `Restore ${selectedTables.length} Table(s)`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Backup Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create regular backups before major system changes</li>
                <li>• Store backup files securely and encrypted</li>
                <li>• Test backup integrity periodically</li>
                <li>• Keep multiple backup versions</li>
                <li>• Document backup and restore procedures</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Restore Considerations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Restore operations overwrite existing data</li>
                <li>• Critical tables include user profiles and core data</li>
                <li>• Test restores in non-production environments first</li>
                <li>• Notify users before performing major restores</li>
                <li>• Verify data integrity after restore completion</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};