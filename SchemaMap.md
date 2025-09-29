# Complete Database Schema Map

## Overview
This document provides a comprehensive map of the HOAdoor platform database schema, covering all tables, relationships, functions, security policies, and optimization details.

## Core Entity Tables

### 1. User Management
```sql
-- User profiles extending Supabase auth
profiles (
  id UUID PRIMARY KEY,                    -- References auth.users(id)
  username TEXT,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 2. HOA Communities
```sql
-- Main HOA communities table
hoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_public TEXT,
  description_private TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  unit_count INTEGER,
  amenities TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  search_vector TSVECTOR              -- Full-text search index
)

-- HOA creation requests
hoa_creation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description_public TEXT,
  description_private TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  unit_count INTEGER,
  amenities TEXT[],
  status content_status DEFAULT 'PENDING',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 3. Membership System
```sql
-- User-HOA relationships with roles
memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  hoa_id UUID,
  role membership_role DEFAULT 'MEMBER',  -- MEMBER, ADMIN, PRESIDENT
  status membership_status DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Role promotion requests
role_promotion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL,
  hoa_id UUID NOT NULL,
  current_membership_role membership_role DEFAULT 'MEMBER',
  requested_role membership_role NOT NULL,
  justification TEXT,
  status content_status DEFAULT 'PENDING',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

## Content & Communication Tables

### 4. Community Posts & Comments
```sql
-- Community forum posts
posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoa_id UUID,
  author_user_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility visibility_type DEFAULT 'PRIVATE', -- PUBLIC, PRIVATE
  status content_status DEFAULT 'APPROVED',     -- PENDING, APPROVED, REJECTED
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  search_vector TSVECTOR                      -- Full-text search index
)

-- Comments on posts
comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  author_user_id UUID,
  content TEXT NOT NULL,
  status content_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 5. Reviews & Feedback
```sql
-- HOA reviews by members
reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  hoa_id UUID,
  title TEXT,
  content TEXT,
  stars INTEGER NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status content_status DEFAULT 'PENDING',
  moderated_by UUID,
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Admin responses to reviews
admin_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID,
  responder_user_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 6. Events & Calendar
```sql
-- Community events
events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoa_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  visibility visibility_type DEFAULT 'PRIVATE',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 7. Document Management
```sql
-- Community documents
documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoa_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  visibility visibility_type DEFAULT 'PRIVATE',
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 8. Community Resources
```sql
-- Helpful links and resources
community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoa_id UUID NOT NULL,
  type TEXT DEFAULT 'LINK',
  category TEXT DEFAULT 'GENERAL',
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  is_public BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 9. Community Guidance (New)
```sql
-- Editable guidance for each community
community_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoa_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'GENERAL',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

## Administrative & Audit Tables

### 10. Audit & Logging
```sql
-- Platform-wide audit logs
audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Community-specific audit logs
community_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoa_id UUID NOT NULL,
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### 11. Bulk Operations
```sql
-- Track bulk operations (member imports, etc.)
bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoa_id UUID,
  operator_user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  file_name TEXT,
  total_records INTEGER,
  successful_records INTEGER,
  failed_records INTEGER,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### 12. Content Reporting
```sql
-- Content flagging and moderation
flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type flag_target_type NOT NULL,
  target_id UUID NOT NULL,
  reporter_user_id UUID,
  reason TEXT NOT NULL,
  status flag_status DEFAULT 'PENDING',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### 13. Contact & Communication
```sql
-- Contact form submissions
contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 14. Portfolio & Content (For platform showcase)
```sql
-- Portfolio projects
portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  link TEXT,
  technologies TEXT[],
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Blog posts
blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Blog comments
blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID,
  name TEXT,
  content TEXT NOT NULL,
  approved BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Resume sections and items
resume_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

resume_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL,
  title TEXT NOT NULL,
  organization TEXT,
  location TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

## Enums & Custom Types

```sql
-- Content status for posts, comments, reviews, etc.
CREATE TYPE content_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Membership roles within HOAs
CREATE TYPE membership_role AS ENUM ('MEMBER', 'ADMIN', 'PRESIDENT');

-- Membership application status
CREATE TYPE membership_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Content visibility levels
CREATE TYPE visibility_type AS ENUM ('PUBLIC', 'PRIVATE');

-- Flag status for content reporting
CREATE TYPE flag_status AS ENUM ('PENDING', 'RESOLVED');

-- Flag target types
CREATE TYPE flag_target_type AS ENUM ('POST', 'COMMENT', 'REVIEW', 'USER');
```

## Views & Materialized Views

```sql
-- Rating aggregates for HOAs
CREATE MATERIALIZED VIEW rating_aggregates AS
SELECT 
  hoa_id,
  COUNT(*) as review_count,
  AVG(stars) as average_rating,
  COUNT(CASE WHEN stars >= 4 THEN 1 END) as positive_reviews
FROM reviews 
WHERE status = 'APPROVED' 
GROUP BY hoa_id;
```

## Database Functions

### Security & Permission Functions
```sql
-- Check if user is HOA admin/president
CREATE FUNCTION is_hoa_admin(user_id UUID, hoa_id UUID) RETURNS BOOLEAN
-- Check if user is approved member
CREATE FUNCTION is_approved_member(user_id UUID, hoa_id UUID) RETURNS BOOLEAN
-- Check platform admin status
CREATE FUNCTION check_admin_status(user_id UUID) RETURNS BOOLEAN
```

### Workflow Functions
```sql
-- Create HOA from approved request
CREATE FUNCTION create_hoa_from_request(request_id UUID, admin_user_id UUID) RETURNS UUID
-- Approve role promotion request
CREATE FUNCTION approve_role_promotion(request_id UUID, admin_user_id UUID) RETURNS VOID
-- Generate unique HOA slug
CREATE FUNCTION generate_hoa_slug(hoa_name TEXT) RETURNS TEXT
```

### Backup & Restore Functions (New)
```sql
-- Create full database backup
CREATE FUNCTION create_database_backup() RETURNS JSONB
-- Restore from backup with selective table restore
CREATE FUNCTION restore_database_backup(backup_data JSONB, tables TEXT[]) RETURNS TEXT
```

### Audit & Logging Functions
```sql
-- Log community actions
CREATE FUNCTION log_community_action(...) RETURNS VOID
-- Auto-update timestamps
CREATE FUNCTION update_updated_at() RETURNS TRIGGER
-- Auto-update timestamps (alias)
CREATE FUNCTION update_timestamp() RETURNS TRIGGER
-- Refresh rating aggregates
CREATE FUNCTION refresh_rating_aggregates() RETURNS VOID
```

### Cascade Delete Functions
```sql
-- Safely delete HOA with all related data
CREATE FUNCTION delete_hoa_cascade(hoa_id UUID, admin_user_id UUID) RETURNS VOID
```

## Row Level Security (RLS) Policies

### User Management
- `profiles`: Own profile access + admin override
- `view_all_users()`: Admin function for user management

### HOA Management  
- `hoas`: Public read, admin manage
- `hoa_creation_requests`: Own requests + admin review
- `memberships`: Own memberships + HOA admin manage
- `role_promotion_requests`: Own requests + HOA admin review

### Content Management
- `posts`: HOA member access + visibility controls
- `comments`: HOA member access + moderation
- `reviews`: Own reviews + public approved reviews
- `admin_responses`: HOA admin create + public read

### Community Features
- `events`: HOA member access
- `documents`: HOA member access
- `community_resources`: HOA member access + admin manage
- `community_guidance`: Members read active + admins manage

### Administrative
- `audit_logs`: Platform admin only
- `community_audit_logs`: HOA admin access
- `bulk_operations`: Creator + HOA admin view
- `flags`: Create for all + admin resolve
- `contact_messages`: Public create + admin read

### Portfolio/Blog (Platform features)
- `blog_posts`: Admin manage + public read
- `blog_comments`: Public create + approval system
- `portfolio_projects`: Admin manage + public read
- `resume_*`: Admin manage + public read

## Performance Optimizations

### Indexes
```sql
-- Search optimization
CREATE INDEX idx_hoas_search_vector ON hoas USING gin(search_vector);
CREATE INDEX idx_posts_search_vector ON posts USING gin(search_vector);

-- Relationship indexes
CREATE INDEX idx_memberships_user_hoa ON memberships(user_id, hoa_id);
CREATE INDEX idx_posts_hoa_status ON posts(hoa_id, status);
CREATE INDEX idx_comments_post_status ON comments(post_id, status);
CREATE INDEX idx_reviews_hoa_status ON reviews(hoa_id, status);

-- Temporal indexes for filtering
CREATE INDEX idx_events_hoa_starts_at ON events(hoa_id, starts_at);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Triggers
```sql
-- Auto-update timestamps
CREATE TRIGGER update_*_updated_at BEFORE UPDATE ON * FOR EACH ROW EXECUTE update_updated_at();

-- Audit logging triggers
CREATE TRIGGER log_membership_action AFTER UPDATE ON memberships FOR EACH ROW EXECUTE log_membership_action();
CREATE TRIGGER log_review_moderation AFTER UPDATE ON reviews FOR EACH ROW EXECUTE log_review_moderation();
CREATE TRIGGER log_role_promotion_action AFTER UPDATE ON role_promotion_requests FOR EACH ROW EXECUTE log_role_promotion_action();
CREATE TRIGGER log_deletion_action BEFORE DELETE ON * FOR EACH ROW EXECUTE log_deletion_action();

-- Auto-refresh materialized views
CREATE TRIGGER refresh_ratings_on_review_change AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE refresh_ratings_on_review_change();

-- Auto-create profiles for new users
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE handle_new_user();
```

## Data Relationships

### Core Entity Relationships
- `profiles` ← `memberships` → `hoas` (Many-to-many with roles)
- `hoas` → `posts` → `comments` (One-to-many chains)
- `hoas` → `reviews` → `admin_responses` (One-to-many chains)
- `hoas` → `events`, `documents`, `community_resources`, `community_guidance` (One-to-many)

### Request/Approval Workflows
- `hoa_creation_requests` → `hoas` (via `create_hoa_from_request()`)
- `role_promotion_requests` → `memberships` (via `approve_role_promotion()`)
- `flags` → any content type (polymorphic via target_type/target_id)

### Audit Trail Relationships
- All actions → `audit_logs` (platform-wide)
- Community actions → `community_audit_logs` (HOA-specific)
- Bulk operations → `bulk_operations` (operation tracking)

## Security Architecture

### Authentication
- Supabase Auth integration with `profiles` extension
- JWT-based session management
- Multi-factor authentication support

### Authorization Layers
1. **Platform Level**: `is_admin` flag in profiles
2. **Community Level**: Role-based access via memberships
3. **Content Level**: Visibility and status controls
4. **Row Level**: Comprehensive RLS policies

### Data Privacy
- Community isolation (users only see their HOA data)
- PII protection via RLS policies
- Audit trails for all sensitive operations
- Secure deletion with cascade functions

## Backup & Recovery Strategy

### Manual Backup System
- `create_database_backup()`: Creates complete JSON backup
- Includes all table data plus metadata
- Admin-only access with audit logging

### Selective Restore
- `restore_database_backup()`: Granular table restoration
- Platform admin controlled with logging
- Maintains data integrity during restore

### Recommended Backup Schedule
- Daily: Automated Supabase backups
- Weekly: Manual platform backup via function
- Monthly: Full export for long-term storage

## Migration & Maintenance

### Schema Evolution
- All changes via Supabase migrations
- Version-controlled schema changes
- Zero-downtime deployment strategy

### Regular Maintenance
- VACUUM and ANALYZE on large tables
- Refresh materialized views
- Archive old audit logs
- Monitor index usage and performance

## Conclusion

This comprehensive schema supports a full-featured HOA management platform with:
- Multi-tenant community isolation
- Rich content management and moderation
- Comprehensive audit trails
- Flexible permission system
- Performance optimizations
- Backup/recovery capabilities
- Extensible architecture for future features

The schema is designed for scalability, security, and maintainability while providing all necessary features for effective HOA community management.