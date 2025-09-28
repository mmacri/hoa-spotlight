# HOAdoor Architecture Documentation

## System Overview

HOAdoor is a modern web application built using a serverless architecture with Supabase as the backend-as-a-service provider. The system follows a three-tier architecture pattern with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │    │   (Supabase)    │    │   (PostgreSQL)  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React 18      │    │ • Row Level     │    │ • HOAs          │
│ • TypeScript    │◄──►│   Security      │◄──►│ • Reviews       │
│ • Tailwind CSS  │    │ • Edge Functions│    │ • Users         │
│ • shadcn/ui     │    │ • Real-time     │    │ • Memberships   │
│ • React Router  │    │ • Storage       │    │ • Full-text     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Flow Architecture

### 1. Request/Response Flow

```
User Action → React Component → Supabase Client → PostgreSQL → RLS Check → Response
     ↑                                                                         │
     └─────────────────── UI Update ←─────── State Management ←─────────────────┘
```

### 2. Authentication Flow

```
Sign Up/In → Supabase Auth → JWT Token → RLS Context → Database Access
    │
    ├─── Email Verification (optional)
    ├─── Profile Creation
    └─── Role Assignment
```

### 3. Review Submission Flow

```
User Review → Validation → Database Insert → Moderation Queue → Approval → Public Display
     │
     ├─── Rate Limiting Check
     ├─── Duplicate Prevention
     └─── Anonymous Option
```

## Component Architecture

### Frontend Layer

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── hoa/           # HOA-specific components
│   ├── reviews/       # Review system components
│   ├── layout/        # Layout and navigation
│   └── ui/            # Reusable UI components
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── pages/             # Route-level components
├── lib/               # Utility functions
└── integrations/      # External service integrations
```

### Backend Architecture (Supabase)

```
Database Layer:
├── Tables with RLS policies
├── Indexes for performance
├── Triggers for automation
├── Functions for complex logic
└── Materialized views for aggregations

Auth Layer:
├── User management
├── JWT token handling
├── Role-based access
└── Session management

Storage Layer:
├── File uploads (future)
├── Document management
└── Media storage
```

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Users    │    │    HOAs     │    │   Reviews   │
│ (auth.users)│    │             │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ 1:N              │ 1:N              │ N:1
       │                  │                  │
┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
│ Memberships │    │    Posts    │    │Admin        │
│             │    │             │    │Responses    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Table Relationships

1. **Users (auth.users)** → **Memberships** (1:N)
2. **HOAs** → **Memberships** (1:N)
3. **HOAs** → **Reviews** (1:N)
4. **Users** → **Reviews** (1:N)
5. **Reviews** → **Admin Responses** (1:1)
6. **HOAs** → **Posts** (1:N)
7. **Posts** → **Comments** (1:N)

### Data Access Patterns

1. **Read-Heavy Operations**:
   - HOA listings with ratings
   - Review aggregations
   - Search queries

2. **Write Operations**:
   - Review submissions
   - Membership requests
   - Admin responses

3. **Complex Queries**:
   - Full-text search across multiple tables
   - Rating calculations with breakdowns
   - Permission-based content filtering

## Security Architecture

### Row Level Security (RLS) Implementation

```sql
-- Example: Reviews table RLS policy
CREATE POLICY "Public read approved reviews" 
ON reviews FOR SELECT 
USING (status = 'APPROVED');

CREATE POLICY "Users can create reviews" 
ON reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HOA admins can moderate" 
ON reviews FOR UPDATE 
USING (is_hoa_admin(auth.uid(), hoa_id));
```

### Permission Matrix

| Role | HOAs | Reviews | Memberships | Posts | Admin |
|------|------|---------|-------------|--------|-------|
| Public | Read | Read (approved) | - | - | - |
| User | Read | Read/Create | Create | - | - |
| Member | Read | Read/Create | Read (own) | Read/Create | - |
| HOA Admin | Read | Read/Create/Moderate | Manage | Moderate | Limited |
| Platform Admin | Manage | Full Access | Full Access | Full Access | Full Access |

## Performance Considerations

### Database Optimization

1. **Indexes**:
   ```sql
   -- Full-text search
   CREATE INDEX idx_hoas_search_vector ON hoas USING gin(search_vector);
   
   -- Common queries
   CREATE INDEX idx_reviews_hoa_status ON reviews(hoa_id, status);
   CREATE INDEX idx_memberships_user_hoa ON memberships(user_id, hoa_id);
   ```

2. **Materialized Views**:
   ```sql
   -- Rating aggregations
   CREATE MATERIALIZED VIEW rating_aggregates AS
   SELECT hoa_id, AVG(stars), COUNT(*), ...
   FROM reviews WHERE status = 'APPROVED'
   GROUP BY hoa_id;
   ```

### Frontend Optimization

1. **Code Splitting**: Route-based lazy loading
2. **Caching**: React Query for server state
3. **Optimistic Updates**: Immediate UI feedback
4. **Debouncing**: Search input optimization

## Scalability Architecture

### Horizontal Scaling Considerations

1. **Database Scaling**:
   - Read replicas for search-heavy operations
   - Partitioning for large datasets
   - Connection pooling for high concurrency

2. **Frontend Scaling**:
   - CDN for static assets
   - Client-side caching strategies
   - Progressive Web App features

3. **Caching Strategy**:
   ```
   Browser Cache → CDN → Application Cache → Database
   ```

## Monitoring and Observability

### Key Metrics

1. **Performance Metrics**:
   - Page load times
   - Database query performance
   - Search response times

2. **Business Metrics**:
   - User registration rates
   - Review submission volume
   - HOA profile views

3. **Error Monitoring**:
   - Client-side error tracking
   - Server-side error logs
   - Database performance monitoring

## Deployment Pipeline

### CI/CD Flow

```
Code Push → Build → Test → Deploy → Monitor
    │
    ├─── ESLint & Prettier
    ├─── TypeScript compilation
    ├─── Unit tests
    └─── Integration tests
```

### Environment Strategy

1. **Development**: Local development with hot reload
2. **Staging**: Preview deployments for testing
3. **Production**: Optimized builds with monitoring

## Future Architecture Considerations

### Potential Enhancements

1. **Microservices**: Split complex features into separate services
2. **Event Sourcing**: Audit trail and event replay capabilities
3. **GraphQL**: More efficient data fetching for complex queries
4. **Mobile Apps**: Native mobile applications using the same backend
5. **Analytics**: Dedicated analytics pipeline for business insights

### Migration Strategy

When scaling beyond current architecture:

1. **Database Migration**: PostgreSQL → Distributed database
2. **Service Decomposition**: Monolith → Microservices
3. **API Evolution**: REST → GraphQL for complex queries
4. **State Management**: Context → Redux for complex state

---

This architecture provides a solid foundation for the HOAdoor platform while maintaining flexibility for future growth and enhancements.