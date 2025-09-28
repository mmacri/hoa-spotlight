# Database Schema Documentation

## Overview
This document provides a comprehensive mapping of the HOAdoor platform database schema, including all tables, relationships, and security policies.

## Core Tables

### Authentication & User Management

#### `profiles`
**Purpose**: Extended user profile information beyond Supabase auth
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Features:**
- Automatically populated via trigger on auth.users insert
- Platform admin designation through `is_admin` flag
- RLS policies allow users to view/edit own profiles, admins see all

### HOA Management

#### `hoas`
**Purpose**: Main HOA community records
```sql
CREATE TABLE public.hoas (
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
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Features:**
- Unique slug generation for URLs
- Full-text search capabilities via `search_vector`
- Public readable, admin-only write access

#### `hoa_creation_requests`
**Purpose**: Tracks requests to create new HOA communities
```sql
CREATE TABLE public.hoa_creation_requests (
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
);
```

**Workflow Integration:**
- Connected to `create_hoa_from_request()` function
- Automatic HOA creation and membership assignment on approval

### Membership Management

#### `memberships`
**Purpose**: User memberships within HOA communities
```sql
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  hoa_id UUID,
  role membership_role DEFAULT 'MEMBER',
  status membership_status DEFAULT 'PENDING',
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Enums:**
- `membership_role`: 'MEMBER', 'ADMIN', 'PRESIDENT'
- `membership_status`: 'PENDING', 'APPROVED', 'REJECTED'

**Access Control:**
- Users can request membership
- HOA admins can approve/reject for their community
- Comprehensive audit logging via triggers

#### `role_promotion_requests`
**Purpose**: Handles requests for role upgrades within communities
```sql
CREATE TABLE public.role_promotion_requests (
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
);
```

**Integration:**
- Connected to `approve_role_promotion()` function
- Automatic membership role updates on approval

### Content Management

#### `reviews`
**Purpose**: User reviews of HOA communities
```sql
CREATE TABLE public.reviews (
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
);
```

**Moderation Workflow:**
- All reviews start as 'PENDING'
- HOA admins can approve/reject
- Public can view approved reviews only

#### `posts`
**Purpose**: Community forum posts
```sql
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoa_id UUID,
  author_user_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility visibility_type DEFAULT 'PRIVATE',
  status content_status DEFAULT 'APPROVED',
  is_pinned BOOLEAN DEFAULT false,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Enums:**
- `visibility_type`: 'PUBLIC', 'PRIVATE'
- `content_status`: 'PENDING', 'APPROVED', 'REJECTED'

#### `comments`
**Purpose**: Comments on forum posts
```sql
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  author_user_id UUID,
  content TEXT NOT NULL,
  status content_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Administrative Features

#### `bulk_operations`
**Purpose**: Tracks bulk data operations
```sql
CREATE TABLE public.bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,
  operator_user_id UUID NOT NULL,
  hoa_id UUID,
  file_name TEXT,
  total_records INTEGER,
  successful_records INTEGER,
  failed_records INTEGER,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Use Cases:**
- Bulk member uploads
- Bulk HOA imports
- Data migration tracking

### Audit & Monitoring

#### `community_audit_logs`
**Purpose**: Comprehensive action logging for communities
```sql
CREATE TABLE public.community_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoa_id UUID NOT NULL,
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Logged Actions:**
- MEMBERSHIP_APPROVED/REJECTED
- REVIEW_APPROVED/REJECTED
- ROLE_PROMOTION_APPROVED/REJECTED
- HOA_CREATED_FROM_REQUEST

#### `flags`
**Purpose**: Content reporting and moderation
```sql
CREATE TABLE public.flags (
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
);
```

## Database Functions

### Core Business Logic

#### `create_hoa_from_request(request_id, admin_user_id)`
**Purpose**: Complete HOA creation workflow
- Validates pending request
- Creates HOA record with unique slug
- Assigns requester as PRESIDENT
- Updates request status
- Logs action

#### `approve_role_promotion(request_id, admin_user_id)`
**Purpose**: Handle role promotion approvals
- Validates request
- Updates membership role
- Updates request status
- Logs promotion action

#### `generate_hoa_slug(hoa_name)`
**Purpose**: Create unique URL-friendly slugs
- Normalizes HOA names
- Ensures uniqueness with counter suffix
- Returns clean slug string

### Utility Functions

#### `log_community_action(hoa_id, actor_user_id, action, target_type, target_id, details)`
**Purpose**: Centralized audit logging
- Standardized action recording
- Structured metadata storage
- Comprehensive audit trail

#### `check_admin_status(user_id)`
**Purpose**: Security validation
- Platform admin verification
- Used in RLS policies
- Security DEFINER for privilege elevation

## Security Architecture

### Row Level Security (RLS)

**Global Policies:**
- All tables have RLS enabled
- Users can only access their own data by default
- Admin overrides through security definer functions

**Escalation Patterns:**
- Community admins can manage their HOA
- Platform admins have global access
- Audit logs provide full transparency

### Data Privacy

**PII Protection:**
- User profiles secured by ownership
- Contact information restricted
- Anonymous options where appropriate

**Community Isolation:**
- HOA data isolated by membership
- Cross-community access prevented
- Role-based access within communities

## Performance Considerations

### Indexing Strategy
- UUID primary keys for all tables
- Composite indexes on common query patterns
- Full-text search indexes on content

### Caching
- Materialized views for rating aggregations
- Refresh functions for data consistency
- Optimized query patterns

## Migration Patterns

### Schema Evolution
- All changes via migration files
- Backwards compatibility maintained
- Data migration scripts included

### Version Control
- Schema changes tracked in git
- Migration rollback procedures
- Environment parity validation

## Maintenance Procedures

### Regular Tasks
- VACUUM and REINDEX operations
- Audit log archival
- Performance metric monitoring
- Security policy reviews

### Backup Strategy
- Point-in-time recovery enabled
- Regular full backups
- Cross-region replication
- Recovery testing procedures