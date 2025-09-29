import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, HelpCircle, BookOpen, Users, Calendar, FileText, MessageSquare, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GuidanceItem {
  id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  display_order: number;
}

interface UserGuidancePanelProps {
  hoaId?: string;
  userType: 'MEMBER' | 'ADMIN' | 'PLATFORM_ADMIN';
  className?: string;
}

const CATEGORY_ICONS = {
  GENERAL: HelpCircle,
  POSTING_GUIDELINES: MessageSquare,
  EVENT_PARTICIPATION: Calendar,
  DOCUMENT_ACCESS: FileText,
  COMMUNITY_RULES: Users,
  CONTACT_INFO: Settings,
  EMERGENCY_PROCEDURES: Settings,
  MAINTENANCE_REQUESTS: Settings
};

const PLATFORM_GUIDANCE = {
  MEMBER: [
    {
      id: 'member-getting-started',
      title: 'Getting Started as a Community Member',
      content: `Welcome to your HOA community portal! Here's how to get the most out of your membership:

1. **Complete Your Profile**: Add your contact information and preferences
2. **Browse Community Posts**: Stay updated with community discussions and announcements
3. **Participate in Events**: RSVP to community meetings and social events
4. **Access Documents**: View important HOA documents, bylaws, and meeting minutes
5. **Submit Reviews**: Share your experience to help improve community services
6. **Report Issues**: Use the reporting system for community concerns

Remember to follow community guidelines and maintain respectful communication with fellow residents.`,
      category: 'GENERAL',
      is_active: true,
      display_order: 1
    },
    {
      id: 'member-posting-guide',
      title: 'Community Posting Guidelines',
      content: `When creating posts in your community feed, please follow these guidelines:

**Do:**
- Keep discussions relevant to community matters
- Be respectful and constructive in your communications
- Use clear, descriptive titles for your posts
- Check for existing discussions before creating new posts
- Follow up on questions and engage with responses

**Don't:**
- Share personal or sensitive information publicly
- Post commercial advertisements without permission
- Use offensive language or personal attacks
- Share unverified information or rumors
- Post the same content multiple times

All posts are reviewed by community administrators before being published to ensure they meet community standards.`,
      category: 'POSTING_GUIDELINES',
      is_active: true,
      display_order: 2
    }
  ],
  ADMIN: [
    {
      id: 'admin-dashboard-overview',
      title: 'HOA Administrator Dashboard Overview',
      content: `As an HOA administrator, you have access to powerful tools for community management:

**Member Management:**
- Review and approve new membership requests
- Assign roles and manage member permissions
- Handle member disputes and issues
- Export member lists and contact information

**Content Moderation:**
- Review and approve community posts and comments
- Manage community guidelines and policies
- Handle content reports and violations
- Pin important announcements and updates

**Event Management:**
- Create and manage community events and meetings
- Track RSVPs and attendance
- Send event reminders and updates
- Publish meeting minutes and outcomes

**Communication Tools:**
- Send community-wide announcements
- Manage notification settings and preferences
- Create targeted messages for specific member groups
- Monitor community engagement and participation`,
      category: 'GENERAL',
      is_active: true,
      display_order: 1
    },
    {
      id: 'admin-member-management',
      title: 'Effective Member Management',
      content: `Best practices for managing your community members:

**Membership Approval Process:**
1. Review membership applications promptly (within 2-3 business days)
2. Verify residency documentation and property ownership
3. Check for any outstanding issues or concerns
4. Communicate decisions clearly with appropriate reasoning
5. Provide welcome information for approved members

**Ongoing Member Relations:**
- Maintain open communication channels
- Address concerns and questions promptly
- Recognize active and helpful community members
- Handle conflicts fairly and consistently
- Keep member information confidential and secure

**Role Management:**
- Assign appropriate roles based on involvement and qualifications
- Review role assignments periodically
- Provide training and support for new board members
- Document role transitions and handovers`,
      category: 'COMMUNITY_RULES',
      is_active: true,
      display_order: 2
    }
  ],
  PLATFORM_ADMIN: [
    {
      id: 'platform-admin-overview',
      title: 'Platform Administrator Overview',
      content: `As a platform administrator, you oversee the entire HOA community system:

**Multi-Community Management:**
- Monitor health and activity across all communities
- Provide support to struggling or new communities
- Handle escalated disputes and complex issues
- Ensure platform-wide policy compliance

**User Management:**
- Search and filter users across all communities
- Manage user roles and permissions globally
- Handle account issues and security concerns
- Process role promotion requests

**System Administration:**
- Monitor platform performance and security
- Manage integrations and third-party services
- Handle technical support escalations
- Maintain compliance and audit requirements

**Community Support:**
- Process HOA creation requests
- Assist community administrators with best practices
- Provide training and resources for community management
- Facilitate knowledge sharing between communities`,
      category: 'GENERAL',
      is_active: true,
      display_order: 1
    },
    {
      id: 'platform-user-management',
      title: 'Advanced User Management Features',
      content: `Comprehensive user management across all communities:

**User Search and Filtering:**
- Search users by name, email, or community
- Filter by state in alphabetical order
- Sort by community membership and roles
- Export filtered user lists for analysis
- Track user activity and engagement patterns

**Role Management:**
- Process role promotion requests from communities
- Assign platform-level administrative roles
- Handle role disputes and escalations
- Maintain role hierarchy and permissions
- Document role changes and justifications

**Community Oversight:**
- Monitor community administrator performance
- Identify communities needing additional support
- Handle cross-community disputes and issues
- Ensure consistent policy enforcement
- Facilitate communication between communities

**Security and Compliance:**
- Monitor for policy violations and abuse
- Handle legal and compliance requirements
- Manage data privacy and protection
- Investigate security incidents and breaches
- Maintain audit trails and documentation`,
      category: 'COMMUNITY_RULES',
      is_active: true,
      display_order: 2
    }
  ]
};

export const UserGuidancePanel: React.FC<UserGuidancePanelProps> = ({
  hoaId,
  userType,
  className = ""
}) => {
  const [communityGuidance, setCommunityGuidance] = useState<GuidanceItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    if (hoaId && userType === 'MEMBER') {
      loadCommunityGuidance();
    } else {
      setLoading(false);
    }
  }, [hoaId, userType]);

  const loadCommunityGuidance = async () => {
    if (!hoaId) return;
    
    try {
      const { data, error } = await supabase
        .from('community_guidance')
        .select('*')
        .eq('hoa_id', hoaId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCommunityGuidance(data || []);
    } catch (error: any) {
      console.error('Error loading community guidance:', error);
      // Don't show error toast for guidance loading as it's not critical
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || HelpCircle;
    return <IconComponent className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const platformGuidance = PLATFORM_GUIDANCE[userType] || [];
  const allGuidance = [...platformGuidance, ...communityGuidance];

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center py-4">Loading guidance...</div>
        </CardContent>
      </Card>
    );
  }

  if (allGuidance.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            User Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No guidance available at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          User Guide
          <Badge variant="outline" className="ml-auto text-xs">
            {userType === 'PLATFORM_ADMIN' ? 'Platform Admin' : userType === 'ADMIN' ? 'HOA Admin' : 'Member'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allGuidance.map((item) => (
          <Collapsible
            key={item.id}
            open={expandedItems[item.id]}
            onOpenChange={() => toggleItem(item.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getCategoryIcon(item.category)}
                  <span className="text-sm font-medium truncate">
                    {item.title}
                  </span>
                  <Badge variant="secondary" className="text-xs ml-auto mr-2 shrink-0">
                    {getCategoryLabel(item.category)}
                  </Badge>
                </div>
                {expandedItems[item.id] ? (
                  <ChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 pb-2">
              <div className="prose prose-sm max-w-none">
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};