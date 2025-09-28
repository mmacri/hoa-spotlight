# HOAdoor - Complete Workflow Wireframes

## 1. Public User Journey

### 1.1 Homepage Experience
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] HOAdoor                         [Search] [Sign In]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         Find Your Perfect HOA Community                     │
│      Read real reviews from residents and make              │
│           informed decisions about your next home           │
│                                                             │
│     [Search communities...          ] [🔍]                  │
│              [Browse All Communities]                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [⭐] Real Reviews  [👥] Community Access  [🛡️] Transparent │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                Featured Communities                         │
│                                              [View All]    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │Sunset Valley│ │Oak Ridge    │ │Harbor View  │          │
│  │⭐⭐⭐⭐⭐ 4.5 │ │⭐⭐⭐⭐ 4.2   │ │⭐⭐⭐⭐⭐ 4.8 │          │
│  │Austin, TX   │ │Denver, CO   │ │San Diego, CA│          │
│  │Pool, Gym... │ │Pool, Trails │ │Marina, Spa  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘

Actions Available:
✅ Browse HOA listings
✅ View public HOA profiles  
✅ Read approved reviews
✅ Use search functionality
❌ Submit reviews (requires auth)
```

### 1.2 Search Results Page
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] HOAdoor                         [Search] [Sign In]   │
├─────────────────────────────────────────────────────────────┤
│                Search HOA Communities                       │
│                                                             │
│ [Search communities...              ] [Search]             │
│                                                             │
│ Filters: [State ▼] [Rating ▼] [Clear filters]              │
│ Amenities: [Pool] [Gym] [Tennis] [Playground] [Dog Park]   │
│                                                             │
│ Found 25 communities                                        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Sunset Valley HOA                    ⭐⭐⭐⭐⭐ 4.5      │ │
│ │ 📍 Austin, Texas 78745              (12 reviews)       │ │
│ │ Beautiful community with mountain views...              │ │
│ │ 👥 150 units    🏊 Pool 🏋️ Gym 🎾 Tennis              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Oak Ridge Community                  ⭐⭐⭐⭐ 4.2        │ │
│ │ 📍 Denver, Colorado 80231           (8 reviews)        │ │
│ │ Quiet neighborhood with mature trees...                │ │
│ │ 👥 85 units     🏊 Pool 🚶 Trails 🐕 Dog Park         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

User Flow:
1. Enter search terms
2. Apply filters (state, rating, amenities)
3. Browse results list
4. Click HOA card → HOA Profile Page
```

### 1.3 HOA Public Profile (Unauthenticated View)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] HOAdoor                         [Search] [Sign In]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Sunset Valley HOA                                           │
│ 📍 Austin, Texas 78745                                      │
│ ⭐⭐⭐⭐⭐ 4.5 (12 reviews)    👥 150 units                 │
│                                                             │
│ Beautiful community with mountain views and modern         │
│ amenities. Perfect for families and professionals alike.   │
│                                                             │
│ [Pool] [Gym] [Tennis Court] [Playground] [Clubhouse]       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Reviews (12)] [Overview]                                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 HOA Member      ⭐⭐⭐⭐⭐    2 days ago              │ │
│ │ Excellent community living!                             │ │
│ │ The amenities are fantastic and management is very      │ │
│ │ responsive. Pool and gym are well-maintained.           │ │
│ │                                                         │ │
│ │ 💬 HOA Response (1 day ago):                            │ │
│ │    Thank you for the positive feedback! We work hard   │ │
│ │    to maintain our high standards.                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Anonymous       ⭐⭐⭐ 3      15 days ago             │ │
│ │ Mixed experience                                        │ │
│ │ Some good aspects but HOA fees seem high for what we   │ │
│ │ get. Management could be more transparent.              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌───────────────────┐                                       │
│ │   Sign in to:     │                                       │
│ │ • Write reviews   │                                       │
│ │ • Join community  │                                       │
│ │   [Sign In]       │                                       │
│ └───────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘

Public User Limitations:
❌ Cannot write reviews
❌ Cannot access private community features  
❌ Cannot request membership
✅ Can read all approved reviews
✅ Can see HOA admin responses
```

## 2. Authentication Flow

### 2.1 Sign Up/Sign In Modal
```
┌─────────────────────────────────────────┐
│              Welcome to HOAdoor         │
├─────────────────────────────────────────┤
│                                         │
│  [Sign In] | [Sign Up]                  │
│                                         │
│  Email                                  │
│  [your@email.com                    ]   │
│                                         │
│  Password                               │
│  [••••••••••••••••••••••••••        ]  │
│                                    [👁] │
│                                         │
│  [ ] Remember me                        │
│                                         │
│      [Sign In] [Cancel]                 │
│                                         │
│  Don't have an account? Sign up         │
│                                         │
└─────────────────────────────────────────┘

Sign Up Flow:
1. User clicks "Sign Up" tab
2. Enters email and password
3. Clicks "Create Account"
4. Receives email verification (optional)
5. Redirects to profile completion
6. Account created → Authenticated User role

Sign In Flow:
1. User enters credentials
2. Supabase validates and creates session
3. User context updated throughout app
4. Redirects to previous page or homepage
```

## 3. Authenticated User Journey

### 3.1 HOA Profile (Authenticated View)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] HOAdoor              [Search] [user@email.com ▼]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Sunset Valley HOA                                           │
│ 📍 Austin, Texas 78745                                      │
│ ⭐⭐⭐⭐⭐ 4.5 (12 reviews)    👥 150 units                 │
│                                                             │
│ [+ Write a Review]                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Reviews (12)] [Overview]                                   │
│                                                             │
│ (Reviews display same as public view)                       │
│                                                             │
│ ┌───────────────────┐                                       │
│ │ Community Actions │                                       │
│ │ [Write a Review]  │                                       │
│ │ [Request Member]  │                                       │
│ └───────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘

New Capabilities:
✅ Can write reviews
✅ Can request HOA membership
✅ Can see own pending reviews
✅ All previous public capabilities
```

### 3.2 Review Submission Form
```
┌─────────────────────────────────────────────────────────────┐
│                    Write a Review                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Rating *                                                    │
│ ⭐⭐⭐⭐⭐ (5 out of 5 stars)                              │
│                                                             │
│ Review Title (Optional)                                     │
│ [Excellent community living!                           ]   │
│                                                             │
│ Review Details (Optional)                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │The amenities are fantastic and the management is very  │ │
│ │responsive. Pool and gym are well-maintained. The       │ │
│ │community events are great for meeting neighbors.       │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ 250/1000 characters                                         │
│                                                             │
│ ☑ Post anonymously                                          │
│                                                             │
│ [Submit Review] [Cancel]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Validation Rules:
✅ Star rating required (1-5)
✅ One review per user per HOA
✅ Title max 100 characters
✅ Content max 1000 characters
✅ Anonymous option available

Post-Submission:
1. Review saved with "PENDING" status
2. User sees confirmation message
3. HOA admins notified for moderation
4. User can see their pending review in profile
```

### 3.3 Membership Request Flow
```
┌─────────────────────────────────────────────────────────────┐
│              Request HOA Membership                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ You're requesting to join: Sunset Valley HOA               │
│                                                             │
│ Full Name                                                   │
│ [John Smith                                             ]   │
│                                                             │
│ Email (from account)                                        │
│ [john.smith@email.com                                   ]   │
│                                                             │
│ Property Address (Optional)                                 │
│ [123 Valley Drive, Austin, TX                           ]   │
│                                                             │
│ Additional Notes                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │I'm a new resident at 123 Valley Drive and would like   │ │
│ │to join the community discussions and stay informed     │ │
│ │about HOA matters.                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Submit Request] [Cancel]                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Process Flow:
1. User submits membership request
2. Request saved with "PENDING" status
3. HOA admins receive notification
4. User can track request status in profile
5. Email notification when approved/rejected
```

## 4. HOA Member Experience

### 4.1 Private Community Portal
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] HOAdoor              [Search] [member@email.com ▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Sunset Valley HOA - Private Community                      │
│                                                             │
│ [Forum] [Documents] [Events] [Reviews]                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📋 Pinned: Pool Maintenance Schedule - March 2024          │
│                                                             │
│ [+ New Post]                                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Jane Doe (Member)           📌 2 days ago            │ │
│ │ Neighborhood Watch Meeting                              │ │
│ │ Planning our monthly safety meeting for next Tuesday.  │ │
│ │ Please join us in the clubhouse at 7 PM.               │ │
│ │ 💬 3 comments                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Bob Smith (Admin)           📝 5 days ago            │ │
│ │ Pool Chemical Update                                    │ │
│ │ Water testing shows all levels are normal. Pool is     │ │
│ │ safe for use. Next test scheduled for Friday.          │ │
│ │ 💬 1 comment                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Member Capabilities:
✅ Access private community forum
✅ Create posts and comments
✅ View HOA documents
✅ See community events
✅ All authenticated user features
```

### 4.2 Documents Library
```
┌─────────────────────────────────────────────────────────────┐
│                   HOA Documents                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📁 Governing Documents                                      │
│   📄 CC&Rs (Covenants, Conditions & Restrictions).pdf      │
│   📄 Bylaws 2024.pdf                                       │
│   📄 Architectural Guidelines.pdf                          │
│                                                             │
│ 📁 Financial Reports                                        │
│   📊 2024 Budget Summary.xlsx                              │
│   📊 Q1 2024 Financial Statement.pdf                       │
│                                                             │
│ 📁 Meeting Minutes                                          │
│   📝 Board Meeting - March 2024.pdf                        │
│   📝 Annual Meeting - January 2024.pdf                     │
│                                                             │
│ 📁 Maintenance & Notices                                    │
│   🔧 Pool Maintenance Schedule.pdf                         │
│   📢 Landscaping Update Notice.pdf                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Access Control:
✅ Members can view all documents
❌ Cannot upload/edit (Admin only)
✅ Download links for offline access
```

### 4.3 Events Calendar
```
┌─────────────────────────────────────────────────────────────┐
│                 Community Events                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         March 2024                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 15  Spring Pool Opening                                 │ │
│ │     9:00 AM - Clubhouse                                 │ │
│ │     Annual pool season kickoff event                    │ │
│ │                                                         │ │
│ │ 22  HOA Board Meeting                                   │ │
│ │     7:00 PM - Clubhouse Conference Room                 │ │
│ │     Monthly board meeting, open to all residents       │ │
│ │                                                         │ │
│ │ 28  Community Cleanup Day                               │ │
│ │     8:00 AM - Meet at Clubhouse                         │ │
│ │     Volunteer cleanup of common areas                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│         April 2024                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 05  Easter Egg Hunt                                     │ │
│ │     10:00 AM - Community Park                           │ │
│ │     Family event for children 12 and under             │ │
│ │                                                         │ │
│ │ 18  Annual General Meeting                              │ │
│ │     6:30 PM - Clubhouse Main Hall                       │ │
│ │     Required annual meeting for all homeowners         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Event Features:
✅ Calendar view of all events
✅ Event details and locations
✅ RSVP functionality (future feature)
❌ Cannot create events (Admin only)
```

## 5. HOA Admin Workflow

### 5.1 Admin Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] HOAdoor              [Search] [admin@hoa.com ▼]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Sunset Valley HOA - Administration                         │
│                                                             │
│ [Members] [Moderation] [Settings] [Analytics]               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️  Pending Actions                                         │
│   • 2 membership requests awaiting approval                │
│   • 1 review pending moderation                            │
│   • 3 flagged posts require attention                      │
│                                                             │
│ 📊 Quick Stats                                              │
│   • 148 active members                                     │
│   • 4.5 average rating (12 reviews)                        │
│   • 23 forum posts this month                              │
│                                                             │
│ 🎯 Recent Activity                                          │
│   • John Smith requested membership (2 hours ago)          │
│   • New review submitted by Jane Doe (1 day ago)           │
│   • Pool maintenance post by Bob Admin (2 days ago)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Admin Capabilities Overview:
✅ Approve/reject membership requests
✅ Moderate reviews and forum content
✅ Reply to reviews as official HOA
✅ Manage community settings
✅ View member analytics
✅ All member privileges
```

### 5.2 Membership Management
```
┌─────────────────────────────────────────────────────────────┐
│                 Membership Management                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Pending (2)] [Approved (148)] [Rejected (5)]              │
│                                                             │
│ Pending Requests:                                           │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 John Smith (john.smith@email.com)                   │ │
│ │ 📅 Requested: 2 hours ago                              │ │
│ │ 🏠 Address: 123 Valley Drive, Austin, TX               │ │
│ │ 📝 "I'm a new resident and would like to join..."      │ │
│ │                                                         │ │
│ │ [✅ Approve] [❌ Reject] [👁 View Profile]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Sarah Johnson (sarah.j@email.com)                   │ │
│ │ 📅 Requested: 1 day ago                                │ │
│ │ 🏠 Address: 456 Oak Street, Austin, TX                 │ │
│ │ 📝 "Moving in next week, would like access..."         │ │
│ │                                                         │ │
│ │ [✅ Approve] [❌ Reject] [👁 View Profile]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Bulk Actions: [Select All] [Approve Selected] [Reject]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Approval Process:
1. Admin reviews request details
2. Verifies property ownership/residence
3. Clicks Approve or Reject with optional notes
4. User receives email notification
5. Approved users gain member access immediately
```

### 5.3 Review Moderation
```
┌─────────────────────────────────────────────────────────────┐
│                  Review Moderation                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Pending (1)] [Approved (11)] [Rejected (0)]               │
│                                                             │
│ Pending Reviews:                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Jane Doe                    ⭐⭐⭐⭐⭐              │ │
│ │ 📅 Submitted: 1 day ago                                │ │
│ │                                                         │ │
│ │ "Excellent community living!"                           │ │
│ │ The amenities are fantastic and the management is very │ │
│ │ responsive. Pool and gym are well-maintained. The      │ │
│ │ community events are great for meeting neighbors.      │ │
│ │                                                         │ │
│ │ [✅ Approve] [❌ Reject] [💬 Reply as HOA]             │ │
│ │                                                         │ │
│ │ Rejection Reason (if applicable):                       │ │
│ │ [Inappropriate content ▼                            ]   │ │
│ │ [Additional notes...                                 ]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Previously Approved Reviews:                                │
│ (Can add admin responses to approved reviews)               │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Anonymous                   ⭐⭐⭐                   │ │
│ │ 📅 Approved: 15 days ago                               │ │
│ │ "Mixed experience - fees seem high..."                 │ │
│ │                                                         │ │
│ │ [💬 Add HOA Response]                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Moderation Actions:
✅ Approve: Makes review publicly visible
❌ Reject: Hides review with reason
💬 Respond: Add official HOA response (public)
📝 Bulk actions for multiple reviews
```

### 5.4 Admin Response Interface
```
┌─────────────────────────────────────────────────────────────┐
│                  Add HOA Response                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Responding to review by: Anonymous                          │
│ Rating: ⭐⭐⭐ "Mixed experience"                            │
│                                                             │
│ Original Review:                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Some good aspects but HOA fees seem high for what we   │ │
│ │ get. Management could be more transparent.              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Your Response (will be public):                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Thank you for your feedback. We take all resident      │ │
│ │ concerns seriously and would love to discuss this      │ │
│ │ further. Please contact our management office to       │ │
│ │ address these specific issues. We're committed to      │ │
│ │ transparency and continuous improvement.                │ │
│ └─────────────────────────────────────────────────────────┘ │
│ 245/500 characters                                          │
│                                                             │
│ [Post Response] [Cancel]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Response Guidelines:
✅ Professional tone required
✅ Address concerns constructively  
✅ Provide contact information
✅ Maximum 500 characters
✅ Visible publicly on HOA profile
```

## 6. Platform Admin Workflow

### 6.1 Global Admin Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] HOAdoor              [🛡️ PLATFORM ADMIN]           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                Platform Administration                      │
│                                                             │
│ [HOAs] [Users] [Content] [Analytics] [Settings]            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🚨 System Alerts                                           │
│   • 5 flagged reviews awaiting moderation                  │
│   • 2 HOA admin role requests pending                      │
│   • Database backup completed successfully                 │
│                                                             │
│ 📊 Platform Statistics                                      │
│   • 1,247 total users                                      │
│   • 43 active HOA communities                              │
│   • 389 approved reviews                                   │
│   • 92% uptime this month                                  │
│                                                             │
│ 🎯 Recent System Activity                                   │
│   • New HOA registered: Pine Grove Community               │
│   • User flagged inappropriate content (30 min ago)       │
│   • HOA admin promoted: Sunset Valley (2 hours ago)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Platform Admin Powers:
✅ Global content moderation
✅ User account management
✅ HOA community creation/deletion
✅ System configuration
✅ Analytics and reporting
✅ Audit log access
```

### 6.2 Global Content Moderation
```
┌─────────────────────────────────────────────────────────────┐
│               Global Content Moderation                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Flagged Content (5)] [Recent Reports] [Banned Users]      │
│                                                             │
│ Flagged Reviews:                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚩 Flagged by: 3 users                                  │ │
│ │ 📍 Harbor View Estates - Review by Mike T.              │ │
│ │ ⭐ 1 star - "Terrible management, corrupt board..."      │ │
│ │ 📅 Flagged: 2 hours ago                                │ │
│ │ 📝 Reason: Inappropriate language                       │ │
│ │                                                         │ │
│ │ [🗑️ Remove] [✅ Approve] [⚠️ Warn User] [👁 Details]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚩 Flagged by: 1 user                                   │ │
│ │ 📍 Oak Ridge Community - Forum Post                     │ │
│ │ 👤 Sarah_R - "Does anyone know about..."                │ │
│ │ 📅 Flagged: 1 day ago                                  │ │
│ │ 📝 Reason: Spam/Promotional content                     │ │
│ │                                                         │ │
│ │ [🗑️ Remove] [✅ Approve] [⚠️ Warn User] [👁 Details]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Bulk Actions: [Select All] [Remove Selected] [Approve All] │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Moderation Powers:
✅ Remove content globally
✅ Issue user warnings
✅ Temporary/permanent bans
✅ Override HOA admin decisions
✅ Access to all audit logs
```

## 7. Error States & Edge Cases

### 7.1 Permission Denied
```
┌─────────────────────────────────────────────────────────────┐
│                    Access Denied                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    🔒                                       │
│                                                             │
│          You don't have permission to access               │
│               this community feature.                       │
│                                                             │
│              To gain access, you need to:                  │
│          1. Request membership from the HOA                 │
│          2. Wait for admin approval                         │
│          3. Receive confirmation email                      │
│                                                             │
│        [Request Membership] [Back to Public View]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Content Under Moderation
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ Your review has been submitted and is pending approval.     │
│                                                             │
│ ⏳ Status: Under Review                                     │
│ 📅 Submitted: 2 hours ago                                  │
│ ⭐ Your Rating: ⭐⭐⭐⭐⭐                                   │
│                                                             │
│ 📝 "Excellent community living!"                           │ │
│ The amenities are fantastic and management is very         │
│ responsive...                                               │
│                                                             │
│ 💡 Your review will appear publicly once approved by       │
│    the HOA administrators.                                  │
│                                                             │
│ [Edit Review] [Cancel Review]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Empty States
```
┌─────────────────────────────────────────────────────────────┐
│                    No Reviews Yet                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    💬                                       │
│                                                             │
│            Be the first to share your experience           │
│               with this HOA community                       │
│                                                             │
│        Help future residents make informed decisions       │
│              by writing an honest review.                  │
│                                                             │
│              [Write the First Review]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Summary

This wireframe documentation covers all major workflows in the HOAdoor platform:

1. **Public Discovery**: Browsing and searching HOAs without authentication
2. **Authentication**: Sign up/sign in flows with proper validation
3. **Review System**: Complete review submission and moderation workflow
4. **Community Access**: Private member portals with forums, docs, events
5. **Administration**: HOA admin tools for community management
6. **Platform Management**: Global admin controls for system oversight

Each workflow includes proper permission checking, error states, and user feedback to ensure a smooth, secure user experience across all roles and features.