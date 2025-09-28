# Platform Development Integration (PDI) Documentation

## Overview
This document outlines the comprehensive user management workflows implemented in the HOAdoor platform, detailing all approval/denial processes and their subsequent automated actions.

## User Management Workflows

### 1. HOA Membership Requests

**Process Flow:**
1. **User Submission**: Users request membership to join an existing HOA community
2. **Admin Review**: HOA administrators (ADMIN or PRESIDENT roles) review requests  
3. **Approval Actions**: Upon approval, the system:
   - Updates membership status to 'APPROVED'
   - Assigns the appropriate role (MEMBER, ADMIN, or PRESIDENT)
   - Logs the action in community audit logs
   - Sends notification to the user
   - Grants access to community portal

**Database Tables:**
- `memberships`: Stores membership requests and approvals
- `community_audit_logs`: Tracks all membership actions

**Components:**
- `MembershipRequest.tsx`: User-facing request form
- `CommunityModerationDashboard.tsx`: Admin review interface

### 2. HOA Creation Requests

**Process Flow:**
1. **User Submission**: Users request creation of a new HOA community
2. **Platform Admin Review**: Platform administrators review creation requests
3. **Approval Actions**: Upon approval, the system:
   - Creates new HOA record with unique slug
   - Assigns requester as PRESIDENT of the new community
   - Updates request status to 'APPROVED'
   - Logs the creation action
   - Enables full community management for the requester

**Database Tables:**
- `hoa_creation_requests`: Stores creation requests
- `hoas`: Main HOA community records
- `memberships`: Automatic PRESIDENT membership for requester

**Components:**
- `HOACreationRequestForm.tsx`: User request form
- `HOACreationRequests.tsx`: Platform admin review interface

**Database Functions:**
- `create_hoa_from_request()`: Handles the complete HOA creation workflow
- `generate_hoa_slug()`: Creates unique URL-friendly identifiers

### 3. Role Promotion Requests

**Process Flow:**
1. **User Submission**: Existing members request role promotions (MEMBER→ADMIN, MEMBER→PRESIDENT, ADMIN→PRESIDENT)
2. **Community Admin Review**: HOA administrators review promotion requests
3. **Approval Actions**: Upon approval, the system:
   - Updates user's role in the community membership
   - Changes request status to 'APPROVED'
   - Logs the promotion action with before/after roles
   - Grants new permissions immediately

**Database Tables:**
- `role_promotion_requests`: Stores promotion requests
- `memberships`: Updated with new role assignments

**Components:**
- `RolePromotionRequest.tsx`: User request form
- `RolePromotionRequests.tsx`: Admin review interface

**Database Functions:**
- `approve_role_promotion()`: Handles role updates and logging

### 4. Platform Administration

**Process Flow:**
1. **Super Admin Actions**: Platform administrators manage overall system
2. **User Management**: View all users, manage platform admin status
3. **System Oversight**: Monitor all pending requests across communities

**Components:**
- `UserManagement.tsx`: Comprehensive user administration
- `AdminDashboard.tsx`: Central admin control panel

## Security & Access Control

### Row-Level Security (RLS) Policies

**Membership Requests:**
- Users can view/create their own requests
- HOA admins can manage requests for their communities
- Platform admins have full access

**HOA Creation Requests:**
- Users can view/create their own requests
- Platform admins can manage all requests

**Role Promotion Requests:**
- Users can view/create their own requests
- Community admins can manage requests for their HOA
- Platform admins have full oversight

### Audit Logging

All administrative actions are logged with:
- Actor user ID (who performed the action)
- Target information (what was affected)
- Action type and details
- Timestamp and metadata
- Community context where applicable

## Integration Points

### Authentication Requirements
- All workflows require authenticated users
- Role-based access control enforced at database level
- Admin status validated through security definer functions

### Notification System
- Toast notifications for all user actions
- Status updates reflected in real-time
- Email notifications (future enhancement)

### Error Handling
- Comprehensive error catching and user feedback
- Database transaction rollbacks on failures
- Validation at both client and server levels

## Data Flow Architecture

```
User Request → Component Validation → Database RLS Check → Business Logic → Audit Log → User Notification
```

## Future Enhancements

1. **Email Notifications**: Automated emails for request status changes
2. **Bulk Operations**: Mass approval/denial capabilities
3. **Request Templates**: Standardized request forms with required fields
4. **Approval Workflows**: Multi-step approval processes for sensitive actions
5. **Analytics Dashboard**: Request volume and approval rate metrics

## Technical Dependencies

- **Supabase**: Database, authentication, and RLS
- **React**: Component architecture and state management
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Consistent styling and responsive design

## Maintenance Notes

- Regular review of RLS policies for security
- Monitor audit logs for unusual activity patterns
- Backup critical user management data
- Test all workflows after database schema changes