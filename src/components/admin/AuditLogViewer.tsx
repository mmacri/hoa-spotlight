import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Search, 
  Filter,
  AlertTriangle,
  Trash2,
  UserPlus,
  UserMinus,
  Building2,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: any;
  created_at: string;
  actor_profile?: {
    full_name: string;
    username: string;
    is_admin: boolean;
  };
}

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const LOGS_PER_PAGE = 50;

  useEffect(() => {
    fetchAuditLogs(1);
  }, [actionFilter]);

  const fetchAuditLogs = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          actor_user_id,
          action,
          target_type,
          target_id,
          metadata,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * LOGS_PER_PAGE, pageNum * LOGS_PER_PAGE - 1);

      if (actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch actor profiles
      const logsWithProfiles = await Promise.all(
        (data || []).map(async (log) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username, is_admin')
            .eq('id', log.actor_user_id)
            .single();
          
          return {
            ...log,
            actor_profile: profile
          };
        })
      );

      if (pageNum === 1) {
        setLogs(logsWithProfiles);
      } else {
        setLogs(prev => [...prev, ...logsWithProfiles]);
      }

      setHasMore(logsWithProfiles.length === LOGS_PER_PAGE);
      setPage(pageNum);

    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    fetchAuditLogs(page + 1);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('DELETE')) return Trash2;
    if (action.includes('APPROVED')) return UserPlus;
    if (action.includes('REJECTED')) return UserMinus;
    if (action.includes('HOA')) return Building2;
    if (action.includes('REVIEW') || action.includes('COMMENT')) return MessageSquare;
    return Activity;
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-500';
    if (action.includes('APPROVED')) return 'text-green-500';
    if (action.includes('REJECTED')) return 'text-red-500';
    if (action.includes('CREATED')) return 'text-blue-500';
    return 'text-muted-foreground';
  };

  const formatActionText = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.actor_profile?.full_name && log.actor_profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.actor_profile?.username && log.actor_profile.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && logs.length === 0) {
    return <div className="text-center py-8">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            Platform Audit Logs
          </h2>
          <p className="text-muted-foreground">
            Complete activity log of all administrative actions
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by action, user, or target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="DELETE">Deletions</SelectItem>
              <SelectItem value="APPROVED">Approvals</SelectItem>
              <SelectItem value="REJECTED">Rejections</SelectItem>
              <SelectItem value="CREATED">Creations</SelectItem>
              <SelectItem value="HOA">HOA Actions</SelectItem>
              <SelectItem value="ROLE">Role Changes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.map((log) => {
          const ActionIcon = getActionIcon(log.action);
          const actionColor = getActionColor(log.action);
          
          return (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <ActionIcon className={`h-5 w-5 mt-0.5 ${actionColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {formatActionText(log.action)}
                        </span>
                        <Badge variant="outline">{log.target_type}</Badge>
                        {log.actor_profile?.is_admin && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </time>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      Actor: {log.actor_profile?.full_name || log.actor_profile?.username || 'Unknown User'}
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                          View Details
                        </summary>
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || actionFilter !== 'all' 
                  ? 'No logs match your search criteria'
                  : 'No activity has been logged yet'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {hasMore && filteredLogs.length > 0 && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};