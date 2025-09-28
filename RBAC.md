# Role-Based Access Control (RBAC) Matrix

## User Roles Overview

HOAdoor implements a hierarchical role-based access control system with five distinct user roles, each with specific permissions and capabilities.

## Role Definitions

### 1. Public User (Unauthenticated)
**Description**: Anonymous visitors to the platform
- **Access Level**: Read-only public content
- **Use Cases**: Browsing HOAs, reading approved reviews, market research

### 2. Authenticated User
**Description**: Registered users who have signed up but are not HOA members
- **Access Level**: Public content + review submission
- **Use Cases**: Reviewing HOAs, requesting membership

### 3. HOA Member
**Description**: Authenticated users approved for specific HOA communities
- **Access Level**: Community-specific private content
- **Use Cases**: Participating in private forums, accessing documents

### 4. HOA Admin/President
**Description**: Elected or appointed community leaders
- **Access Level**: Full HOA management capabilities
- **Use Cases**: Moderating content, managing memberships, responding to reviews

### 5. Platform Admin
**Description**: HOAdoor platform administrators
- **Access Level**: Global system administration
- **Use Cases**: Platform moderation, user management, system maintenance

## Detailed Permission Matrix

| Resource/Action | Public | Auth User | HOA Member | HOA Admin | Platform Admin |
|-----------------|--------|-----------|------------|-----------|----------------|
| **HOAs** |
| View public info | ✅ | ✅ | ✅ | ✅ | ✅ |
| View private info | ❌ | ❌ | ✅ (own HOA) | ✅ (own HOA) | ✅ |
| Create HOA | ❌ | ❌ | ❌ | ❌ | ✅ |
| Edit HOA | ❌ | ❌ | ❌ | ✅ (own HOA) | ✅ |
| Delete HOA | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Reviews** |
| View approved | ✅ | ✅ | ✅ | ✅ | ✅ |
| View pending/rejected | ❌ | ✅ (own) | ✅ (own) | ✅ (HOA reviews) | ✅ |
| Create review | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit review | ❌ | ✅ (own, pending) | ✅ (own, pending) | ✅ (own, pending) | ✅ |
| Delete review | ❌ | ❌ | ❌ | ❌ | ✅ |
| Moderate review | ❌ | ❌ | ❌ | ✅ (HOA reviews) | ✅ |
| **Admin Responses** |
| View responses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create response | ❌ | ❌ | ❌ | ✅ (HOA reviews) | ✅ |
| Edit response | ❌ | ❌ | ❌ | ✅ (own) | ✅ |
| Delete response | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Memberships** |
| View own | ❌ | ✅ | ✅ | ✅ | ✅ |
| View others | ❌ | ❌ | ❌ | ✅ (HOA members) | ✅ |
| Request membership | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve/reject | ❌ | ❌ | ❌ | ✅ (HOA requests) | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ✅ (HOA members) | ✅ |
| **Posts (Private Forums)** |
| View public posts | ✅ | ✅ | ✅ | ✅ | ✅ |
| View private posts | ❌ | ❌ | ✅ (HOA members) | ✅ (own HOA) | ✅ |
| Create posts | ❌ | ❌ | ✅ (own HOA) | ✅ (own HOA) | ✅ |
| Edit posts | ❌ | ❌ | ✅ (own) | ✅ (own + moderate) | ✅ |
| Delete posts | ❌ | ❌ | ✅ (own) | ✅ (HOA posts) | ✅ |
| Pin posts | ❌ | ❌ | ❌ | ✅ (own HOA) | ✅ |
| **Comments** |
| View on public posts | ✅ | ✅ | ✅ | ✅ | ✅ |
| View on private posts | ❌ | ❌ | ✅ (HOA members) | ✅ (own HOA) | ✅ |
| Create comments | ❌ | ❌ | ✅ (HOA members) | ✅ (own HOA) | ✅ |
| Edit comments | ❌ | ❌ | ✅ (own) | ✅ (own + moderate) | ✅ |
| Delete comments | ❌ | ❌ | ✅ (own) | ✅ (HOA comments) | ✅ |
| **Documents** |
| View documents | ❌ | ❌ | ✅ (HOA members) | ✅ (own HOA) | ✅ |
| Upload documents | ❌ | ❌ | ❌ | ✅ (own HOA) | ✅ |
| Delete documents | ❌ | ❌ | ❌ | ✅ (own HOA) | ✅ |
| **Events** |
| View events | ❌ | ❌ | ✅ (HOA members) | ✅ (own HOA) | ✅ |
| Create events | ❌ | ❌ | ❌ | ✅ (own HOA) | ✅ |
| Edit events | ❌ | ❌ | ❌ | ✅ (own HOA) | ✅ |
| Delete events | ❌ | ❌ | ❌ | ✅ (own HOA) | ✅ |
| **Flags & Moderation** |
| Create flags | ❌ | ✅ | ✅ | ✅ | ✅ |
| View flags | ❌ | ❌ | ❌ | ✅ (HOA content) | ✅ |
| Resolve flags | ❌ | ❌ | ❌ | ✅ (HOA content) | ✅ |
| **Audit Logs** |
| View logs | ❌ | ❌ | ❌ | ❌ | ✅ |
| **User Management** |
| View user profiles | ❌ | ❌ | ❌ | ✅ (HOA members) | ✅ |
| Manage user roles | ❌ | ❌ | ❌ | ✅ (HOA scope) | ✅ |
| Ban/suspend users | ❌ | ❌ | ❌ | ❌ | ✅ |

## Permission Implementation

### Database Level (RLS Policies)

Each table has Row Level Security policies that enforce permissions:

```sql
-- Example: Reviews table policies
CREATE POLICY "Anyone can view approved reviews" 
ON reviews FOR SELECT 
USING (status = 'APPROVED');

CREATE POLICY "Users can view their own reviews" 
ON reviews FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "HOA admins can moderate reviews for their HOA" 
ON reviews FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.hoa_id = hoa_id 
    AND m.user_id = auth.uid() 
    AND m.role IN ('ADMIN', 'PRESIDENT') 
    AND m.status = 'APPROVED'
  )
);
```

### Application Level (React Components)

Components check user roles and display appropriate UI:

```typescript
const { user, isHOAAdmin, isMember } = useAuth();

// Conditional rendering based on roles
{isHOAAdmin && (
  <Button onClick={moderateReview}>Moderate Review</Button>
)}

{isMember && (
  <Link to={`/hoa/${hoaSlug}/community`}>Private Forum</Link>
)}
```

## Role Transition Flows

### 1. Public → Authenticated User
```
Sign Up → Email Verification → Profile Creation → Authenticated User
```

### 2. Authenticated User → HOA Member
```
Request Membership → HOA Admin Review → Approval → HOA Member
```

### 3. HOA Member → HOA Admin
```
Community Nomination → Existing Admin Approval → Role Assignment → HOA Admin
```

### 4. Any Role → Platform Admin
```
Manual Assignment by Existing Platform Admin → Platform Admin
```

## Security Considerations

### 1. Privilege Escalation Prevention
- Role changes require explicit approval from higher-level roles
- All role assignments are logged in audit trails
- Database constraints prevent unauthorized role assignments

### 2. Data Isolation
- HOA Admins can only access their own community data
- Private content is strictly scoped to community members
- Cross-HOA data access is prevented at the database level

### 3. Audit Trail
- All administrative actions are logged with timestamps
- Role changes are tracked with approval chains
- Failed permission attempts are monitored

## API Endpoint Permissions

### Public Endpoints (No Authentication Required)
- `GET /api/hoas` - List HOAs
- `GET /api/hoas/:slug` - HOA details
- `GET /api/reviews` - Approved reviews
- `GET /api/search` - Search HOAs

### Authenticated Endpoints
- `POST /api/reviews` - Submit review
- `POST /api/memberships/request` - Request membership
- `GET /api/user/profile` - User profile

### Member-Only Endpoints
- `GET /api/hoas/:slug/posts` - Private forum posts
- `GET /api/hoas/:slug/documents` - HOA documents
- `GET /api/hoas/:slug/events` - Community events

### Admin-Only Endpoints
- `PUT /api/reviews/:id/moderate` - Moderate reviews
- `POST /api/admin/responses` - Admin responses
- `PUT /api/memberships/:id/approve` - Approve memberships

### Platform Admin Endpoints
- `GET /api/admin/users` - User management
- `GET /api/admin/audit-logs` - System audit logs
- `POST /api/admin/hoas` - Create HOA communities

## Error Handling

### Permission Denied Responses
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User authenticated but lacks permission
- **404 Not Found**: Resource exists but user can't access it

### UI Feedback
- Hide buttons/links for unavailable actions
- Show appropriate messaging for permission requirements
- Graceful fallbacks for role-based content

---

This RBAC system ensures secure, scalable access control while maintaining a smooth user experience across all HOAdoor features.