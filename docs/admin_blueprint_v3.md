

**Healthcare Core System**

Admin Module — Full-Stack Blueprint

*Version 3.0  |  February 2026  |  Confidential*

Solutions Architect

**Alaa Himour**

Backend Engineer (Java / Spring Boot)

**Zeina Itriq**

Frontend Engineer (React)

**Mohammad Khalifa**

Database: PostgreSQL 11  |  Schema: core  |  16 Tables  |  31 Pages  |  31 Wireframes

# **1\. System Architecture Overview**

Three-layer architecture. Each layer has a single owner and communicates only with its adjacent layer through defined contracts.

| LAYER 1 — DATABASE | LAYER 2 — BACKEND | LAYER 3 — FRONTEND |
| :---: | :---: | :---: |
| **PostgreSQL 11Schema: core | 16 TablesOwner: Alaa Himour** | **Java 17 \+ Spring Boot 3RESTful JSON APIs \+ JWTOwner: Zeina Itriq** | **React 18 \+ Tailwind CSSReact Query \+ ZustandOwner: Mohammad Khalifa** |

## **1.1 Request Flow**

React Page  \-\>  Axios (JWT Bearer)  \-\>  Spring Security Filter  \-\>  Controller  \-\>  Service (permission check \+ audit)  \-\>  JPA Repository  \-\>  PostgreSQL

## **1.2 Cross-Cutting Concerns**

* JWT: Access token (15 min) \+ Refresh token (7 days). Stored in HttpOnly cookies. tenant\_id embedded in claims.

* Multi-Tenancy: All queries scoped by tenant\_id from JWT claim — never from request body.

* Soft Delete: is\_deleted \+ deleted\_at \+ deleted\_by on all 16 tables. No physical DELETE ever.

* Audit Logging: Every mutating operation writes to core.audit\_logs with old\_value/new\_value JSONB.

* Bilingual: All entity name fields have \_ar counterpart. UI uses react-i18next with AR/EN toggle.

* Permission Gate: Backend uses @PreAuthorize. Frontend uses usePermission() hook to conditionally render buttons.

# **2\. Page Inventory (31 Pages)**

| \# | Page Name | Route | Module | Primary DB Tables |
| :---: | ----- | ----- | ----- | ----- |
| **1** | **Login** | /login | Auth | users, user\_sessions |
| **2** | **Forgot Password** | /forgot-password | Auth | password\_reset\_tokens |
| **3** | **Reset Password** | /reset-password?token= | Auth | password\_reset\_tokens, users |
| **4** | **Force Change Password** | /change-password | Auth | users |
| **5** | **MFA Verify** | /mfa-verify | Auth | users |
| **6** | **Admin Dashboard** | /admin | Dashboard | tenants, users, user\_sessions, audit\_logs |
| **7** | **Tenant List** | /admin/tenants | Tenants | tenants |
| **8** | **Tenant Form** | /admin/tenants/new | /:id/edit | Tenants | tenants |
| **9** | **Tenant Detail** | /admin/tenants/:id | Tenants | tenants, branches, tenant\_config |
| **10** | **Tenant Config** | /admin/tenants/:id/config | Tenants | tenant\_config |
| **11** | **Branch List** | /admin/branches | Branches | branches, tenants |
| **12** | **Branch Form** | /admin/branches/new | /:id/edit | Branches | branches |
| **13** | **User List** | /admin/users | Users | users, tenants |
| **14** | **User Form** | /admin/users/new | /:id/edit | Users | users, branches |
| **15** | **User Detail** | /admin/users/:id | Users | users, user\_roles, group\_members |
| **16** | **User Sessions** | /admin/users/:id/sessions | Users | user\_sessions |
| **17** | **User Tenant Access** | /admin/users/:id/access | Users | user\_tenant\_access |
| **18** | **Group List** | /admin/groups | Groups | groups |
| **19** | **Group Form** | /admin/groups/new | /:id/edit | Groups | groups |
| **20** | **Group Detail** | /admin/groups/:id | Groups | groups, group\_members, group\_roles |
| **21** | **Role List** | /admin/roles | Roles | roles |
| **22** | **Role Form** | /admin/roles/new | /:id/edit | Roles | roles |
| **23** | **Role Permissions Matrix** | /admin/roles/:id/permissions | Roles | role\_permissions, permissions |
| **24** | **Module List** | /admin/modules | Modules | modules |
| **25** | **Module Form** | /admin/modules/new | /:id/edit | Modules | modules |
| **26** | **Permission List** | /admin/permissions | Permissions | permissions, modules |
| **27** | **Permission Form** | /admin/permissions/new | /:id/edit | Permissions | permissions |
| **28** | **Audit Log** | /admin/audit | Audit | audit\_logs |
| **29** | **Audit Detail** | /admin/audit/:id | Audit | audit\_logs |
| **30** | **Active Sessions Monitor** | /admin/sessions | Security | user\_sessions |
| **31** | **Failed Login Report** | /admin/security/failed-logins | Security | audit\_logs |

# **3\. Authentication Pages**

## **3.1 Login**

| Page 1 — Login |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /login | **DB Tables** | users, user\_sessions, audit\_logs |
| **Permission** | Public (no auth) | **Layout** | Centered card | No sidebar |
| **Description** | Primary entry. Authenticates user, issues JWT, creates session, writes LOGIN audit. Redirects to /change-password if require\_password\_change=true. Redirects to /mfa-verify if mfa\_enabled=true. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| Username / Email | Text | Yes | Accepts username or email. Trim whitespace. |
| Password | Password (toggle) | Yes | Min 8 chars. Masked. |
| Remember Me | Checkbox | No | Extends refresh token to 30 days. |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Login** | Button / Enter key | Public | POST /auth/login. On success: store JWT, redirect /admin. |
| **Forgot Password** | Link | Public | Navigate /forgot-password. |
| **Toggle Password** | Eye icon | Public | Toggle input type text/password. |
| **VALIDATIONS** |  |  |  |
| Required: username and password |  |  |  |
| On 5 failed attempts: show lockout message with unlock timestamp |  |  |  |
| On invalid: "Invalid username or password" — never specify which field |  |  |  |
| After login if require\_password\_change=true: force redirect /change-password |  |  |  |
| After login if mfa\_enabled=true: redirect /mfa-verify |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **POST** | /auth/login | Submit | Returns: accessToken, refreshToken, user profile, requirePasswordChange, mfaEnabled |
| **GET** | /auth/session | Page load | Auto-login if valid cookie exists |
| **ROLE ACCESS** |  |  |  |
| **Role** | **Can View** | **Can Edit** | **Restrictions** |
| **Unauthenticated** | Yes | Yes | Public page |
| **Already logged in** | Yes | N/A | Redirect to /admin |
| **Notes** | Backend: write LOGIN to audit\_logs on success. Write FAILED\_LOGIN on failure. Lock account after 5 failures for 30 min. |  |  |

**Wireframe Mockup — Page 1: Login**

## **3.2 Forgot Password**

| Page 2 — Forgot Password |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /forgot-password | **DB Tables** | password\_reset\_tokens, users |
| **Permission** | Public | **Layout** | Centered card |
| **Description** | User enters email. System generates SHA-256 hashed token, stores in password\_reset\_tokens (24h expiry), sends reset link via email. Always shows success regardless of email existence. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| Email Address | Email input | Yes | Valid email format. Checked against users.email. |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Send Reset Link** | Submit button | Public | POST /auth/forgot-password. Always show success toast. |
| **Back to Login** | Link | Public | Navigate /login. |
| **VALIDATIONS** |  |  |  |
| Email: required, valid RFC 5322 format |  |  |  |
| Always show: "If your email is registered, you will receive a reset link" |  |  |  |
| Rate limit: max 3 reset requests per email per hour (backend enforced) |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **POST** | /auth/forgot-password | Submit | Returns 200 always. Backend generates token, sends email. |
| **Notes** | Token stored as SHA-256 hash. Plain token in email URL only. Mark used\_at when consumed. |  |  |

**Wireframe Mockup — Page 2: Forgot Password**

## **3.3 Reset Password**

| Page 3 — Reset Password |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /reset-password?token={token} | **DB Tables** | password\_reset\_tokens, users |
| **Permission** | Public (token-gated) | **Layout** | Centered card |
| **Description** | User arrives via email link. Token validated on page load. If invalid/expired show error. Otherwise show form. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| New Password | Password (toggle) | Yes | Min 8, 1 upper, 1 lower, 1 digit, 1 special |
| Confirm Password | Password (toggle) | Yes | Must match New Password exactly |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Reset Password** | Submit | Public (token-gated) | POST /auth/reset-password. On success redirect /login. |
| **Validate Token** | Page load | Public | GET /auth/validate-reset-token. Show error if invalid. |
| **VALIDATIONS** |  |  |  |
| Token validation on load — "Link invalid or expired" if token bad or used\_at not null or expired |  |  |  |
| Password: min 8, 1 upper, 1 lower, 1 digit, 1 special |  |  |  |
| Confirm must match exactly (real-time client check) |  |  |  |
| Cannot reuse current password (backend check) |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /auth/validate-reset-token?token= | Page load | Returns: valid(bool), masked email |
| **POST** | /auth/reset-password | Submit | Body: {token, newPassword} |
| **Notes** | On success: set used\_at=NOW(), invalidate all active sessions for that user. Write UPDATE to audit\_logs. |  |  |

**Wireframe Mockup — Page 3: Reset Password**

## **3.4 Force Change Password**

| Page 4 — Force Change Password |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /change-password | **DB Tables** | users |
| **Permission** | Authenticated (require\_password\_change=true) | **Layout** | Centered card — cannot navigate away |
| **Description** | Shown after first login or admin-forced reset. User cannot access any other page until completed. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| Current Password | Password input | Yes | Verified against stored hash |
| New Password | Password input | Yes | Complexity rules enforced |
| Confirm Password | Password input | Yes | Must match |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Save** | Submit | Authenticated | PUT /auth/change-password. Sets require\_password\_change=false. Redirect /admin. |
| **Logout** | Link | Authenticated | Allow cancel via logout instead. |
| **VALIDATIONS** |  |  |  |
| Current password verified server-side first |  |  |  |
| New cannot match current |  |  |  |
| Complexity: min 8, 1 upper, 1 lower, 1 digit, 1 special |  |  |  |
| Route guard: redirect here if valid JWT but require\_password\_change=true |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **PUT** | /auth/change-password | Submit | Body: {currentPassword, newPassword} |

**Wireframe Mockup — Page 4: Force Change Password**

## **3.5 MFA Verify**

| Page 5 — MFA Verify |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /mfa-verify | **DB Tables** | users, user\_sessions, audit\_logs |
| **Permission** | Pre-auth JWT (MFA scope only) | **Layout** | Centered card |
| **Description** | Shown after successful password login when mfa\_enabled=true. Enter 6-digit TOTP. On success issues full-access JWT. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| TOTP Code | 6-digit numeric OTP (auto-submit on 6 digits) | Yes | Auto-submits on 6 digits. No button needed. |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Verify** | Auto on 6 digits | Pre-auth JWT | POST /auth/verify-mfa. Full JWT on success, redirect /admin. |
| **Back to Login** | Link | Public | Clears pre-auth state. |
| **VALIDATIONS** |  |  |  |
| Exactly 6 digits numeric only |  |  |  |
| TOTP window: accept \+-30 second tolerance |  |  |  |
| Max 5 wrong attempts then lock account |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **POST** | /auth/verify-mfa | Auto on 6 digits | Body: {code}. Returns: fullAccessToken or 401\. |
| **Notes** | mfa\_secret stored encrypted. Never expose in any API response. |  |  |

**Wireframe Mockup — Page 5: MFA Verify**

# **4\. Dashboard**

| Page 6 — Admin Dashboard |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin | **DB Tables** | tenants, users, user\_sessions, audit\_logs |
| **Permission** | Authenticated | **Layout** | 4 KPI cards \+ activity chart \+ recent audit table |
| **Description** | Landing page after login. Shows high-level system health. All data loaded in parallel via React Query. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Tenants KPI | COUNT(tenants) WHERE active | No | Total active tenants |
| Users KPI | COUNT(users) WHERE active | No |  |
| Active Sessions | COUNT(user\_sessions) WHERE is\_active=true | No | Live count |
| Audit Events (24h) | COUNT(audit\_logs) WHERE last 24h | No |  |
| Activity Chart | audit\_logs grouped by day for 7 days | No | Bar chart |
| Recent Events table | audit\_logs ORDER BY created\_at DESC LIMIT 10 | Yes | Clickable rows |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Click KPI Card** | Click | TENANT:READ or USER:READ | Navigate to corresponding list page |
| **Click Audit Row** | Click row | AUDIT:READ | Navigate /admin/audit/:id |
| **View Full Audit** | Link | AUDIT:READ | Navigate /admin/audit |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /dashboard/stats | Page load | Returns: tenantCount, userCount, activeSessionCount, auditCount24h |
| **GET** | /audit?limit=10\&sort=created\_at:desc | Page load | Recent audit events for table |

**Wireframe Mockup — Page 6: Admin Dashboard**

# **5\. Tenant Management**

## **5.1 Tenant List**

| Page 7 — Tenant List |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/tenants | **DB Tables** | tenants |
| **Permission** | TENANT:READ | **Layout** | Full-width table | Create button top-right |
| **Description** | Paginated searchable list of all tenants. Shows hierarchy. Quick status change inline. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Tenant Code | tenant\_code | Yes | Unique badge |
| Org Name | tenant\_name \+ tenant\_name\_ar | Yes | EN primary, AR below |
| Type | organization\_type | Yes | HOSPITAL / NETWORK / CLINIC / LAB / PHARMACY |
| Subscription | subscription\_type \+ expiry | Yes | Red if expired |
| Users/Limit | count / max\_users | No | Progress indicator |
| Status | status | Yes | StatusBadge |
| Actions | — | No | View | Edit | Status | Delete |
| **FILTERS & SEARCH** |  |  |  |
| **Filter** | **Type** | **Values** | **Notes** |
| Search | Text | Searches name, code | Debounced 300ms |
| Org Type | Dropdown | HOSPITAL/NETWORK/CLINIC/LAB/PHARMACY |  |
| Status | Dropdown | ACTIVE/INACTIVE/SUSPENDED/PENDING |  |
| Subscription | Dropdown | BASIC/PROFESSIONAL/ENTERPRISE |  |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Create** | Button | TENANT:CREATE | Navigate /admin/tenants/new |
| **View** | Row click | TENANT:READ | Navigate /admin/tenants/:id |
| **Edit** | Edit icon | TENANT:UPDATE | Navigate /admin/tenants/:id/edit |
| **Status** | Toggle | TENANT:UPDATE | PATCH with ConfirmModal for deactivate |
| **Delete** | Trash | TENANT:DELETE | ConfirmModal. Soft delete. |
| **Export** | Button | TENANT:EXPORT | Download CSV |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /tenants?page=\&search=\&status=\&type= | Page load | Paginated list |
| **PATCH** | /tenants/:id/status | Status toggle |  |
| **DELETE** | /tenants/:id | Delete | Soft delete |

**Wireframe Mockup — Page 7: Tenant List**

## **5.2 Tenant Form**

| Page 8 — Tenant Create / Edit |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/tenants/new | /:id/edit | **DB Tables** | tenants |
| **Permission** | TENANT:CREATE | TENANT:UPDATE | **Layout** | Tabbed form: Basic Info | Contact | Subscription | Settings |
| **Description** | Two-in-one form. Create: blank fields, POST. Edit: pre-filled, PUT. 4 tabs. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| Tenant Code | Text | Yes | Uppercase alphanumeric. Unique. Disabled in edit. |
| Org Name (EN) | Text | Yes | Max 255 |
| Org Name (AR) | Arabic text RTL | No | Max 255 |
| Org Type | Dropdown | Yes | HOSPITAL | NETWORK | CLINIC | LAB | PHARMACY |
| Parent Tenant | Dropdown | No | Leave empty for top-level |
| License Number | Text | No | Saudi MOH/MCI license |
| Tax Number | Text | No | 15-digit Saudi VAT |
| Contact Email | Email | No |  |
| Contact Phone | Phone | No | \+966XXXXXXXXX |
| Address | Textarea | No |  |
| City | Text | No |  |
| Region | Dropdown | No | Saudi regions |
| Subscription Type | Dropdown | Yes (edit) | BASIC | PROFESSIONAL | ENTERPRISE |
| Sub Start Date | Date picker | No |  |
| Sub End Date | Date picker | No | Must be \>= start date |
| Max Users | Number | Yes | Default 50\. Min 1\. |
| Max Branches | Number | Yes | Default 10\. Min 1\. |
| Status | Dropdown | Yes (edit) | ACTIVE | INACTIVE | SUSPENDED |
| **VALIDATIONS** |  |  |  |
| Tenant Code: required, unique (async check), uppercase alphanumeric |  |  |  |
| Tax Number: 15 digits if provided |  |  |  |
| Sub End \>= Sub Start |  |  |  |
| Max Users \>= current active user count (backend) |  |  |  |
| Max Branches \>= current branch count (backend) |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /tenants/:id | Edit load | Pre-fill form |
| **POST** | /tenants | Create |  |
| **PUT** | /tenants/:id | Edit |  |
| **GET** | /tenants?code= | Async uniqueness | Debounced 500ms |

**Wireframe Mockup — Page 8: Tenant Create / Edit**

## **5.3 Tenant Detail**

| Page 9 — Tenant Detail |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/tenants/:id | **DB Tables** | tenants, branches, tenant\_config, audit\_logs |
| **Permission** | TENANT:READ | **Layout** | Header card \+ 4 tabs: Overview | Branches | Config | Audit Trail |
| **Description** | Master view. Header shows key stats. Tabs load sub-entities without leaving page. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Header | name, code, status, type, subscription | — | Always visible |
| Branches tab | branch\_name, type, city, is\_hq, status | Yes | Inline create button |
| Config tab | config\_key, config\_value, is\_encrypted, updated | Yes | Inline edit per row |
| Audit tab | created\_at, user, action, entity, success | Yes | Last 50 events |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Edit** | Header button | TENANT:UPDATE | Navigate /edit |
| **Change Status** | Dropdown | TENANT:UPDATE | PATCH with ConfirmModal |
| **Add Branch** | Branches tab button | BRANCH:CREATE | Navigate /branches/new?tenantId= |
| **Edit Config** | Inline icon | CONFIG:UPDATE | Inline JSONB editor |
| **View Full Audit** | Link in tab | AUDIT:READ | Navigate /admin/audit?tenantId= |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /tenants/:id | Page load | Tenant profile |
| **GET** | /branches?tenantId= | Branches tab |  |
| **GET** | /tenants/:id/config | Config tab |  |
| **GET** | /audit?tenantId=\&limit=50 | Audit tab |  |

**Wireframe Mockup — Page 9: Tenant Detail**

## **5.4 Tenant Config**

| Page 10 — Tenant Config |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/tenants/:id/config | **DB Tables** | tenant\_config |
| **Permission** | CONFIG:READ | CONFIG:UPDATE | **Layout** | Table with inline edit | Grouped by prefix |
| **Description** | Manage key-value config per tenant. JSONB values. Encrypted configs show masked. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Config Key | config\_key | Yes | Grouped by prefix |
| Value | config\_value | No | Encrypted shows \#\#\#\#\#\# |
| Encrypted | is\_encrypted | No | Lock icon |
| Updated | updated\_at \+ updated\_by | Yes |  |
| Actions | — | No | Edit | Delete |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Add Config** | Button | CONFIG:CREATE | Inline new row |
| **Edit Value** | Inline edit | CONFIG:UPDATE | JSONB editor. Save on blur. |
| **Delete** | Icon | CONFIG:DELETE | ConfirmModal. Soft delete. |
| **Reveal Encrypted** | Eye icon | CONFIG:READ | Show 5 seconds then re-mask. Logged in audit. |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /tenants/:id/config | Load | All key-value pairs |
| **POST** | /tenants/:id/config | Add |  |
| **PUT** | /tenants/:id/config/:key | Edit |  |
| **DELETE** | /tenants/:id/config/:key | Delete |  |

**Wireframe Mockup — Page 10: Tenant Config**

# **6\. Branch Management**

## **6.1 Branch List**

| Page 11 — Branch List |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/branches | **DB Tables** | branches, tenants |
| **Permission** | BRANCH:READ | **Layout** | Full-width table | Tenant selector for super-admin |
| **Description** | List all branches. HQ branch visually highlighted with star badge. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Branch Code | branch\_code | Yes |  |
| Name | branch\_name | Yes |  |
| Tenant | tenant\_name | Yes | Hidden for tenant-scoped users |
| Type | branch\_type | Yes | MAIN / REGIONAL / SATELLITE |
| HQ | is\_headquarters | No | Star badge |
| City | city | Yes |  |
| Status | status | Yes | StatusBadge |
| Actions | — | No | Edit | Status | Delete |
| **FILTERS & SEARCH** |  |  |  |
| **Filter** | **Type** | **Values** | **Notes** |
| Search | Text | name, code |  |
| Tenant | Dropdown | super-admin only |  |
| Type | Dropdown | MAIN/REGIONAL/SATELLITE |  |
| Status | Dropdown | ACTIVE/INACTIVE |  |
| HQ Only | Toggle | true/false |  |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Create** | Button | BRANCH:CREATE | Navigate /branches/new |
| **Edit** | Icon | BRANCH:UPDATE |  |
| **Status** | Toggle | BRANCH:UPDATE | ConfirmModal for deactivate |
| **Delete** | Trash | BRANCH:DELETE | Cannot delete HQ if other branches exist |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /branches?tenantId=\&status=\&type= | Load | Paginated |
| **PATCH** | /branches/:id/status | Status |  |
| **DELETE** | /branches/:id | Delete |  |

**Wireframe Mockup — Page 11: Branch List**

## **6.2 Branch Form**

| Page 12 — Branch Create / Edit |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/branches/new | /:id/edit | **DB Tables** | branches, tenants |
| **Permission** | BRANCH:CREATE | BRANCH:UPDATE | **Layout** | Drawer or inline form |
| **Description** | Create or update a branch. Validates HQ uniqueness per tenant. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| Tenant | Dropdown / Read-only | Yes | Pre-selected from context |
| Branch Code | Text | Yes | Unique within tenant. Disabled in edit. |
| Branch Name (EN) | Text | Yes |  |
| Branch Name (AR) | Arabic text | No |  |
| Branch Type | Dropdown | Yes | MAIN | REGIONAL | SATELLITE |
| Is Headquarters | Toggle | No | One per tenant max |
| License Number | Text | No |  |
| Contact Email | Email | No |  |
| Contact Phone | Phone | No |  |
| Address | Textarea | No |  |
| City | Text | No |  |
| Region | Dropdown | No | Saudi regions |
| Status | Dropdown (edit) | Yes | ACTIVE | INACTIVE |
| **VALIDATIONS** |  |  |  |
| Branch Code: unique within tenant (async) |  |  |  |
| Is HQ: backend validates no other HQ exists for tenant |  |  |  |
| Max branches limit checked on create |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /branches/:id | Edit load | Pre-fill |
| **POST** | /branches | Create |  |
| **PUT** | /branches/:id | Edit |  |

**Wireframe Mockup — Page 12: Branch Create / Edit**

# **7\. User Management**

## **7.1 User List**

| Page 13 — User List |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/users | **DB Tables** | users, tenants, branches |
| **Permission** | USER:READ | **Layout** | Full-width table | Bulk actions bar |
| **Description** | Paginated searchable user list. Shows lockout indicators, last login. Bulk activate/deactivate. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Avatar | initials from name | No | Colored circle |
| Full Name | first+last name | Yes | Link to User Detail |
| Username | username | Yes | Monospace badge |
| Email | email | Yes | Verified checkmark if verified |
| Employee ID | employee\_id | Yes |  |
| Type | user\_type | No | INTERNAL/EXTERNAL/SYSTEM |
| Status | status | Yes | ACTIVE/LOCKED/INACTIVE/PENDING |
| MFA | mfa\_enabled | No | Shield icon if enabled |
| Last Login | last\_login\_at | Yes | Relative time |
| Actions | — | No | View | Edit | Lock | Reset Pwd | Delete |
| **FILTERS & SEARCH** |  |  |  |
| **Filter** | **Type** | **Values** | **Notes** |
| Search | Text | name, username, email, employee\_id | Debounced |
| Status | Dropdown | ACTIVE/INACTIVE/LOCKED/PENDING |  |
| Type | Dropdown | INTERNAL/EXTERNAL/SYSTEM |  |
| Branch | Dropdown | Tenant branches |  |
| MFA | Toggle | enabled/disabled |  |
| Last Login | Date range | from/to |  |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Create** | Button | USER:CREATE | Navigate /users/new |
| **View** | Row click | USER:READ | Navigate /users/:id |
| **Edit** | Icon | USER:UPDATE | Navigate /users/:id/edit |
| **Lock** | Lock icon | USER:UPDATE | PATCH status=LOCKED. ConfirmModal. |
| **Unlock** | Unlock icon | USER:UPDATE | PATCH status=ACTIVE |
| **Reset Password** | Key icon | USER:UPDATE | POST /users/:id/reset-password. ConfirmModal. |
| **Delete** | Trash | USER:DELETE | ConfirmModal. Cannot delete own account. |
| **Bulk Activate/Deactivate** | Bulk bar | USER:UPDATE | PATCH bulk status |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /users?page=\&search=\&status=\&type=\&branchId= | Load | Paginated list |
| **PATCH** | /users/:id/status | Lock/unlock |  |
| **POST** | /users/:id/reset-password | Admin reset |  |
| **DELETE** | /users/:id | Delete |  |
| **PATCH** | /users/bulk-status | Bulk | Body: {userIds:\[\],status} |

**Wireframe Mockup — Page 13: User List**

## **7.2 User Form**

| Page 14 — User Create / Edit |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/users/new | /:id/edit | **DB Tables** | users, branches |
| **Permission** | USER:CREATE | USER:UPDATE | **Layout** | Tabbed: Identity | Account | Preferences |
| **Description** | Comprehensive form. National ID stored encrypted. On create: auto-generate temp password, email user, set require\_password\_change=true. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| First Name (EN) | Text | Yes | Max 100 |
| Last Name (EN) | Text | Yes | Max 100 |
| First Name (AR) | Arabic text | No | Max 100 |
| Last Name (AR) | Arabic text | No | Max 100 |
| Username | Text | Yes | Lowercase, alphanumeric \+ underscore \+ dot. Auto-suggestion. Disabled in edit. |
| Email | Email | Yes | Unique. Async check. |
| Mobile | Phone | No | \+966 or 05XX format |
| Employee ID | Text | No | Unique within tenant |
| National ID | Masked text | No | 10 digits. Stored encrypted. |
| User Type | Dropdown | Yes | INTERNAL | EXTERNAL | SYSTEM |
| Default Branch | Dropdown | No | Tenant branches |
| Status | Dropdown (edit) | Yes | ACTIVE | INACTIVE | PENDING |
| Require Pwd Change | Toggle (edit) | No | Force reset on next login |
| MFA Enabled | Toggle (edit) | No | Enable/disable TOTP |
| Language | Dropdown | No | en | ar |
| Timezone | Dropdown | No | Default Asia/Riyadh |
| **VALIDATIONS** |  |  |  |
| Username: unique async check, min 3, lowercase alphanumeric \+ underscore \+ dot |  |  |  |
| Email: unique async, valid RFC 5322 |  |  |  |
| National ID: 10 digits if provided |  |  |  |
| Employee ID: unique within tenant if provided |  |  |  |
| Max users limit checked on create (backend) |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /users/:id | Edit load | Pre-fill |
| **POST** | /users | Create | Auto-generates temp password, sends welcome email |
| **PUT** | /users/:id | Edit |  |
| **GET** | /users?username= | Async username check | Debounced 500ms |
| **GET** | /users?email= | Async email check |  |

**Wireframe Mockup — Page 14: User Create / Edit**

## **7.3 User Detail**

| Page 15 — User Detail |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/users/:id | **DB Tables** | users, user\_roles, group\_members, user\_sessions, user\_tenant\_access |
| **Permission** | USER:READ | **Layout** | Profile header \+ 5 tabs: Profile | Roles | Groups | Tenant Access | Sessions |
| **Description** | Master user view. Header shows key info. Tabs for all sub-entities. Shows Effective Permissions view. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Profile tab | All user fields read-only | — | Organized in sections |
| Roles tab | role\_name, code, type, assigned\_at | Yes | Direct roles only |
| Groups tab | group\_name, code, joined\_at, inherited roles | Yes |  |
| Tenant Access tab | tenant\_name, status, granted\_at | Yes | Cross-tenant access |
| Sessions tab | login\_at, last\_activity, ip, browser, status | Yes | Active highlighted |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Edit** | Header button | USER:UPDATE | Navigate /edit |
| **Lock/Unlock** | Header button | USER:UPDATE | PATCH with ConfirmModal |
| **Reset Password** | Header button | USER:UPDATE | POST with ConfirmModal |
| **Assign Role** | Button in Roles tab | ASSIGN\_ROLE | Role selector modal \-\> POST /users/:id/roles/:roleId |
| **Revoke Role** | Delete icon | REVOKE\_ROLE | ConfirmModal \-\> DELETE |
| **Add to Group** | Button in Groups tab | GROUP:UPDATE | Group selector modal |
| **Grant Tenant Access** | Button in Tenant tab | USER:UPDATE | POST /users/:id/tenant-access/:tenantId |
| **Terminate Session** | Icon per session | USER:UPDATE | DELETE /sessions/:sessionId |
| **Terminate All Sessions** | Button | USER:UPDATE | DELETE /users/:id/sessions/all |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /users/:id | Load | Full profile |
| **GET** | /users/:id/roles | Roles tab | Direct roles |
| **GET** | /users/:id/groups | Groups tab | Memberships |
| **GET** | /users/:id/tenant-access | Tenant tab |  |
| **GET** | /users/:id/sessions | Sessions tab |  |
| **Notes** | Show "Effective Permissions" section: merge user\_roles \+ group\_roles, flatten to unique permissions list. |  |  |

**Wireframe Mockup — Page 15: User Detail**

## **7.4 User Sessions**

| Page 16 — User Sessions |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/users/:id/sessions | **DB Tables** | user\_sessions |
| **Permission** | USER:READ | **Layout** | Table with terminate actions |
| **Description** | All sessions for a specific user. Active sessions highlighted. Bulk terminate available. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Login Time | login\_at | Yes |  |
| Last Activity | last\_activity\_at | Yes | Relative time |
| IP Address | ip\_address | Yes |  |
| Browser | user\_agent (parsed) | No | Chrome/Firefox/Safari \+ OS |
| Expires | expires\_at | Yes |  |
| Status | is\_active | Yes | Active/Expired badge |
| Action | — | No | Terminate button for active sessions |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Terminate Session** | Icon per active row | USER:UPDATE | ConfirmModal. DELETE /sessions/:id. |
| **Terminate All** | Header button | USER:UPDATE | ConfirmModal. DELETE /users/:id/sessions/all. |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /users/:id/sessions | Load | All sessions |
| **DELETE** | /sessions/:sessionId | Terminate |  |
| **DELETE** | /users/:id/sessions/all | Terminate all |  |

**Wireframe Mockup — Page 16: User Sessions**

## **7.5 User Tenant Access**

| Page 17 — User Tenant Access |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/users/:id/access | **DB Tables** | user\_tenant\_access, tenants |
| **Permission** | USER:READ | USER:UPDATE | **Layout** | Table \+ grant access modal |
| **Description** | Manage which tenants a user can access. Supports cross-tenant user access. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Tenant Name | tenant\_name | Yes | Link to Tenant Detail |
| Tenant Code | tenant\_code | Yes |  |
| Status | status | Yes | StatusBadge |
| Granted By | access\_granted\_by \-\> username | Yes |  |
| Granted Date | access\_granted\_at | Yes |  |
| Actions | — | No | Revoke button |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Grant Access** | Button | USER:UPDATE | Tenant selector modal \-\> POST /users/:id/tenant-access/:tenantId |
| **Revoke Access** | Delete icon | USER:UPDATE | ConfirmModal \-\> DELETE |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /users/:id/tenant-access | Load | Cross-tenant access list |
| **POST** | /users/:id/tenant-access/:tenantId | Grant |  |
| **DELETE** | /users/:id/tenant-access/:tenantId | Revoke |  |

**Wireframe Mockup — Page 17: User Tenant Access**

# **8\. Group Management**

## **8.1 Group List**

| Page 18 — Group List |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/groups | **DB Tables** | groups |
| **Permission** | GROUP:READ | **Layout** | Standard list table | Tenant-scoped |
| **Description** | List of user groups within the tenant. Groups used for bulk role assignment. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Group Code | group\_code | Yes | Badge |
| Name | group\_name \+ ar | Yes |  |
| Members | count group\_members | Yes | Clickable \-\> Group Detail members tab |
| Roles | count group\_roles | No |  |
| Status | status | Yes | StatusBadge |
| Actions | — | No | View | Edit | Delete |
| **FILTERS & SEARCH** |  |  |  |
| **Filter** | **Type** | **Values** | **Notes** |
| Search | Text | name, code |  |
| Status | Dropdown | ACTIVE/INACTIVE |  |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Create** | Button | GROUP:CREATE | Navigate /groups/new |
| **View** | Row click | GROUP:READ | Navigate /groups/:id |
| **Edit** | Icon | GROUP:UPDATE |  |
| **Delete** | Trash | GROUP:DELETE | ConfirmModal. Warn about affected members count. Cascade delete. |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /groups?page=\&search=\&status= | Load | Paginated with counts |
| **DELETE** | /groups/:id | Delete | Cascade soft delete |

**Wireframe Mockup — Page 18: Group List**

## **8.2 Group Form**

| Page 19 — Group Create / Edit |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/groups/new | /:id/edit | **DB Tables** | groups |
| **Permission** | GROUP:CREATE | GROUP:UPDATE | **Layout** | Inline form |
| **Description** | Create or update a group. Tenant-scoped. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| Group Code | Text | Yes | Unique within tenant. Disabled in edit. |
| Group Name (EN) | Text | Yes |  |
| Group Name (AR) | Arabic text | No |  |
| Description | Textarea | No |  |
| Status | Dropdown | Yes | ACTIVE | INACTIVE |
| **VALIDATIONS** |  |  |  |
| Group Code: unique within tenant (async check) |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /groups/:id | Edit load |  |
| **POST** | /groups | Create |  |
| **PUT** | /groups/:id | Edit |  |

**Wireframe Mockup — Page 19: Group Create / Edit**

## **8.3 Group Detail**

| Page 20 — Group Detail |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/groups/:id | **DB Tables** | groups, group\_members, group\_roles, users, roles |
| **Permission** | GROUP:READ | **Layout** | Header card \+ 2 tabs: Members | Roles |
| **Description** | Full group management. Members tab: add/remove users. Roles tab: assign/revoke roles (inherited by all members). |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Members: Name | first+last name | Yes | Link to User Detail |
| Members: Username | username | Yes |  |
| Members: Status | user status | No |  |
| Members: Joined | joined\_at | Yes |  |
| Roles: Name | role\_name | Yes |  |
| Roles: Code | role\_code | Yes |  |
| Roles: Type | is\_system\_role | No | SYSTEM/CUSTOM |
| Roles: Assigned | assigned\_at | Yes |  |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Add Member** | Button in Members tab | GROUP:UPDATE | User search modal \-\> POST /groups/:id/members/:userId |
| **Remove Member** | Delete icon | GROUP:UPDATE | ConfirmModal \-\> DELETE |
| **Assign Role** | Button in Roles tab | ASSIGN\_ROLE | Role selector \-\> POST /groups/:id/roles/:roleId |
| **Revoke Role** | Delete icon | REVOKE\_ROLE | ConfirmModal \-\> DELETE |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /groups/:id/members | Members tab |  |
| **GET** | /groups/:id/roles | Roles tab |  |
| **POST** | /groups/:id/members/:userId | Add member |  |
| **DELETE** | /groups/:id/members/:userId | Remove |  |
| **POST** | /groups/:id/roles/:roleId | Assign role |  |
| **DELETE** | /groups/:id/roles/:roleId | Revoke |  |
| **Notes** | Show tooltip on roles: "X users inherit this role through this group." |  |  |

**Wireframe Mockup — Page 20: Group Detail**

# **9\. Role Management**

## **9.1 Role List**

| Page 21 — Role List |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/roles | **DB Tables** | roles |
| **Permission** | ROLE:READ | **Layout** | Standard list | System roles visually distinct |
| **Description** | All roles: system-wide (locked) and tenant-specific. System roles cannot be deleted. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Role Code | role\_code | Yes | Lock icon if system role |
| Name | role\_name | Yes |  |
| Type | is\_system\_role | No | SYSTEM (blue) / CUSTOM (gray) |
| Scope | tenant\_id \-\> name or "Global" | Yes |  |
| Permissions | count role\_permissions | No | Link \-\> matrix |
| Users | count user\_roles | No |  |
| Status | status | Yes |  |
| Actions | — | No | Permissions | Edit | Delete (disabled for system) |
| **FILTERS & SEARCH** |  |  |  |
| **Filter** | **Type** | **Values** | **Notes** |
| Search | Text | name, code |  |
| Type | Toggle | System/Custom/All |  |
| Status | Dropdown | ACTIVE/INACTIVE |  |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Create** | Button | ROLE:CREATE | Navigate /roles/new |
| **View Permissions** | Key icon | ROLE:READ | Navigate /roles/:id/permissions |
| **Edit** | Icon | ROLE:UPDATE | Disabled for system roles |
| **Delete** | Trash | ROLE:DELETE | ConfirmModal. Warn users+groups affected. Disabled for system roles. |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /roles?isSystem=\&status=\&search= | Load | Paginated with counts |
| **DELETE** | /roles/:id | Delete |  |
| **Notes** | System roles: reject DELETE and role\_code/name changes on backend. Show tooltip: "System role — cannot be deleted." |  |  |

**Wireframe Mockup — Page 21: Role List**

## **9.2 Role Form**

| Page 22 — Role Create / Edit |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/roles/new | /:id/edit | **DB Tables** | roles |
| **Permission** | ROLE:CREATE | ROLE:UPDATE | **Layout** | Single form |
| **Description** | Create or update a role. Tenant scope or global. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| Role Code | Text | Yes | Unique. Disabled in edit. |
| Role Name (EN) | Text | Yes |  |
| Role Name (AR) | Arabic text | No |  |
| Description | Textarea | No |  |
| Scope | Dropdown | Yes | GLOBAL | TENANT-SPECIFIC |
| Status | Dropdown | Yes | ACTIVE | INACTIVE |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /roles/:id | Edit load |  |
| **POST** | /roles | Create |  |
| **PUT** | /roles/:id | Edit |  |

**Wireframe Mockup — Page 22: Role Create / Edit**

## **9.3 Role Permissions Matrix**

| Page 23 — Role Permissions Matrix |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/roles/:id/permissions | **DB Tables** | role\_permissions, permissions, modules |
| **Permission** | ROLE:READ | GRANT\_PERMISSION | REVOKE\_PERMISSION | **Layout** | Matrix: Rows=Modules | Columns=Operations | Sticky headers | Real-time save |
| **Description** | The key RBAC management page. Checkbox matrix modules x operations. Checking grants, unchecking revokes. Saves immediately on click — no Submit button. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Module (row header) | module\_name | — | Left-aligned bold. Sticky first column. |
| CREATE col | operation=CREATE per module | — | Checkbox: checked=granted |
| READ col | operation=READ | — | Checkbox |
| UPDATE col | operation=UPDATE | — | Checkbox |
| DELETE col | operation=DELETE | — | Checkbox |
| EXPORT col | operation=EXPORT | — | Checkbox |
| PRINT col | operation=PRINT | — | Checkbox |
| APPROVE col | operation=APPROVE | — | Checkbox |
| Row master | select all ops for module | — | Master checkbox per row |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Toggle Permission** | Checkbox click | GRANT or REVOKE\_PERMISSION | Single POST or DELETE. Immediate. Spinner on cell while saving. |
| **Select All (row)** | Row master checkbox | GRANT\_PERMISSION | Batch grant all 7 ops for module |
| **Deselect All (row)** | Uncheck row master | REVOKE\_PERMISSION | Batch revoke all ops for module |
| **Copy From Role** | Dropdown \+ Copy button | GRANT\_PERMISSION | Copy all permissions from another role. ConfirmModal. |
| **VALIDATIONS** |  |  |  |
| System roles: all checkboxes read-only (disabled) |  |  |  |
| Show loading spinner per cell during save |  |  |  |
| On error: revert checkbox visually \+ error toast |  |  |  |
| Warn if revoking READ while CREATE/UPDATE/DELETE still granted |  |  |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /modules | Load | All modules |
| **GET** | /permissions | Load | All permissions keyed by moduleId+operation |
| **GET** | /roles/:id/permissions | Load | Currently granted |
| **POST** | /roles/:id/permissions/:permId | Check | Grant |
| **DELETE** | /roles/:id/permissions/:permId | Uncheck | Revoke |
| **POST** | /roles/:id/permissions/batch | Row select-all | Body: {permissionIds:\[\]} |
| **Notes** | Sticky header row (operation names) and sticky first column (module names) for large matrix scrolling. Granted=teal fill, revoked=white, in-progress=gray spinner. |  |  |

**Wireframe Mockup — Page 23: Role Permissions Matrix**

# **10\. Module & Permission Management**

## **10.1 Module List**

| Page 24 — Module List |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/modules | **DB Tables** | modules |
| **Permission** | MODULE:READ | **Layout** | Drag-to-reorder list |
| **Description** | System modules as top-level grouping for permissions. Drag to reorder controls display\_order in matrix. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Drag Handle | display\_order | — | Drag handle icon |
| Module Code | module\_code | Yes |  |
| Name | module\_name | Yes |  |
| Type | is\_system\_module | No | SYSTEM/CUSTOM |
| Permissions Count | count permissions | No |  |
| Status | status | Yes |  |
| Actions | — | No | Edit | Delete (disabled for system) |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Create** | Button | MODULE:CREATE | Navigate /modules/new |
| **Reorder** | Drag handle | MODULE:UPDATE | PATCH /modules/reorder. Optimistic update. |
| **Edit** | Icon | MODULE:UPDATE |  |
| **Delete** | Trash | MODULE:DELETE | Only non-system modules. Cascades to permissions. |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /modules | Load | Ordered by display\_order |
| **PATCH** | /modules/reorder | Drag save | Body: {orderedIds:\[\]} |
| **DELETE** | /modules/:id | Delete | Cascade to permissions |

**Wireframe Mockup — Page 24: Module List**

## **10.2 Module Form**

| Page 25 — Module Create / Edit |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/modules/new | /:id/edit | **DB Tables** | modules |
| **Permission** | MODULE:CREATE | MODULE:UPDATE | **Layout** | Simple form |
| **Description** | Create or update a module. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| Module Code | Text | Yes | Uppercase. Unique. Disabled in edit. |
| Module Name (EN) | Text | Yes |  |
| Module Name (AR) | Arabic text | No |  |
| Description | Textarea | No |  |
| Is System Module | Toggle (read-only in edit) | No | Cannot change after creation |
| Status | Dropdown | Yes | ACTIVE | INACTIVE |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /modules/:id | Edit load |  |
| **POST** | /modules | Create |  |
| **PUT** | /modules/:id | Edit |  |

**Wireframe Mockup — Page 25: Module Create / Edit**

## **10.3 Permission List**

| Page 26 — Permission List |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/permissions | **DB Tables** | permissions, modules |
| **Permission** | PERMISSION:READ | **Layout** | Grouped table with module filter |
| **Description** | All permissions grouped by module. Each permission is a module \+ operation pair. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Code | permission\_code | Yes |  |
| Module | module\_name | Yes |  |
| Operation | operation | Yes | Color-coded badge: CREATE/READ/UPDATE/DELETE/EXPORT/PRINT/APPROVE |
| Name EN | permission\_name | Yes |  |
| Actions | — | No | Edit | Delete |
| **FILTERS & SEARCH** |  |  |  |
| **Filter** | **Type** | **Values** | **Notes** |
| Search | Text | code, name |  |
| Module | Dropdown | All modules |  |
| Operation | Multi-select | 7 operations |  |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Create** | Button | PERMISSION:CREATE | Navigate /permissions/new |
| **Edit** | Icon | PERMISSION:UPDATE |  |
| **Delete** | Trash | PERMISSION:DELETE | ConfirmModal. Warn roles using this permission. |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /permissions?moduleId=\&operation= | Load | Filtered list |
| **DELETE** | /permissions/:id | Delete |  |

**Wireframe Mockup — Page 26: Permission List**

## **10.4 Permission Form**

| Page 27 — Permission Create / Edit |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/permissions/new | /:id/edit | **DB Tables** | permissions |
| **Permission** | PERMISSION:CREATE | PERMISSION:UPDATE | **Layout** | Simple form |
| **Description** | Create or update a permission. Tied to a module and one operation. |  |  |
| **FORM FIELDS** |  |  |  |
| **Field Name** | **Type** | **Required** | **Notes / Validation** |
| Module | Dropdown | Yes | Select module to attach this permission |
| Operation | Dropdown | Yes | CREATE | READ | UPDATE | DELETE | EXPORT | PRINT | APPROVE |
| Permission Code | Text | Yes | Auto-suggested. Unique. Disabled in edit. |
| Name (EN) | Text | Yes |  |
| Name (AR) | Arabic text | No |  |
| Description | Textarea | No |  |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /permissions/:id | Edit load |  |
| **POST** | /permissions | Create |  |
| **PUT** | /permissions/:id | Edit |  |

**Wireframe Mockup — Page 27: Permission Create / Edit**

# **11\. Audit & Security**

## **11.1 Audit Log**

| Page 28 — Audit Log |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/audit | **DB Tables** | audit\_logs |
| **Permission** | AUDIT:READ | **Layout** | Full-width filterable table | Date range required | Expandable rows | Export |
| **Description** | Immutable audit trail. Read-only. Each row expands for JSON diff. 3-year retention. CBAHI/HIPAA compliance. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Timestamp | created\_at | Yes | Full datetime. Default DESC. |
| User | user\_id \-\> username | Yes | Link to User Detail. "System" if null. |
| Tenant | tenant\_id \-\> name | Yes | Hidden for tenant-scoped users |
| Action | action\_type | Yes | Color-coded: CREATE=green, DELETE=red, LOGIN=blue, FAILED\_LOGIN=orange, UPDATE=yellow |
| Entity Type | entity\_type | Yes | Badge |
| Entity Name | entity\_name | Yes |  |
| IP Address | ip\_address | No |  |
| Result | success | Yes | Tick or cross icon |
| Diff | (expand) | — | Expandable JSON diff panel |
| **FILTERS & SEARCH** |  |  |  |
| **Filter** | **Type** | **Values** | **Notes** |
| Date Range | Date range picker | Required for performance | Default last 7 days |
| User | Autocomplete | username/name |  |
| Tenant | Dropdown (super-admin) |  |  |
| Action Type | Multi-select | All 15 actions |  |
| Entity Type | Multi-select | All 8 entity types |  |
| Result | Radio | All/Success/Failed |  |
| IP Address | Text | Exact or prefix |  |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Expand Row** | Row click | AUDIT:READ | JSON diff panel: old\_value (red) vs new\_value (green) |
| **View Detail** | Link icon | AUDIT:READ | Navigate /admin/audit/:id |
| **Export CSV** | Button | AUDIT:EXPORT | Download current filtered results |
| **Export PDF** | Button | AUDIT:EXPORT | Compliance report with filter summary header |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /audit?from=\&to=\&userId=\&actionType=\&entityType=\&success=\&page= | Load | Paginated. Date range required. |
| **GET** | /audit/:id | Row expand | Full record with diff |
| **GET** | /audit/export?format=csv&{filters} | Export | Streaming CSV |
| **ROLE ACCESS** |  |  |  |
| **Role** | **Can View** | **Can Edit** | **Restrictions** |
| **Super Admin** | Yes | N/A | All tenants. Can filter by tenant. |
| **Tenant Admin** | Yes | N/A | Own tenant events only |
| **Compliance Officer** | Yes | N/A | Read-only full visibility |
| **Regular Admin** | Partial | N/A | Own actions only |
| **Notes** | NEVER allow any modification to audit\_log records. Append-only table. No UPDATE or DELETE endpoints. For JSON diff use react-diff-viewer. |  |  |

**Wireframe Mockup — Page 28: Audit Log**

## **11.2 Audit Detail**

| Page 29 — Audit Event Detail |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/audit/:id | **DB Tables** | audit\_logs |
| **Permission** | AUDIT:READ | **Layout** | Detail card \+ diff viewer |
| **Description** | Full audit event detail with side-by-side JSON diff viewer for old\_value vs new\_value. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Event ID | audit\_id | — |  |
| Timestamp | created\_at | — |  |
| User | user\_id \-\> name | — | Link |
| Action | action\_type | — | Color badge |
| Entity Type | entity\_type | — |  |
| Entity Name | entity\_name | — |  |
| IP Address | ip\_address | — |  |
| User Agent | user\_agent | — | Parsed browser/OS |
| Session ID | session\_id | — | Link to session |
| Result | success \+ error\_message | — |  |
| Old Value | old\_value JSONB | — | Red panel |
| New Value | new\_value JSONB | — | Green panel |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Back to Audit Log** | Button | AUDIT:READ | Navigate back with filters preserved |
| **View User** | Link on user name | USER:READ | Navigate /admin/users/:id |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /audit/:id | Page load | Full event including old\_value and new\_value |

**Wireframe Mockup — Page 29: Audit Event Detail**

## **11.3 Active Sessions Monitor**

| Page 30 — Active Sessions Monitor |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/sessions | **DB Tables** | user\_sessions, users |
| **Permission** | SESSION:READ | **Layout** | Auto-refreshing table (30s) | Stats cards | Force logout |
| **Description** | Real-time view of all active sessions. Highlights sessions near timeout (\>25 min inactive). Auto-refresh every 30s. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| User | user \-\> full name+username | Yes | Link to User Detail |
| Tenant | tenant\_name | Yes | Hidden for tenant-scoped |
| Login Time | login\_at | Yes |  |
| Last Activity | last\_activity\_at | Yes | Relative. Red if \>25 min. |
| Expires | expires\_at | Yes | Countdown visual |
| IP Address | ip\_address | No |  |
| Browser | user\_agent (parsed) | No |  |
| Duration | login\_at \-\> now | No | e.g. 2h 14m |
| Actions | — | No | Terminate button |
| **FILTERS & SEARCH** |  |  |  |
| **Filter** | **Type** | **Values** | **Notes** |
| Search | Text | username/name |  |
| Tenant | Dropdown (super-admin) |  |  |
| IP Address | Text | Exact match |  |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Terminate Session** | Force logout icon | SESSION:DELETE | ConfirmModal. DELETE /sessions/:id. |
| **Terminate All (User)** | Per-user action | SESSION:DELETE | DELETE /users/:id/sessions/all |
| **Auto Refresh** | Toggle | — | Default ON. 30s interval. |
| **Refresh Now** | Button | — | Manual refresh. |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /sessions/active?page=\&search= | Load \+ auto-refresh | Only is\_active=true |
| **DELETE** | /sessions/:sessionId | Terminate | Sets is\_active=false |
| **DELETE** | /users/:id/sessions/all | Terminate all for user |  |
| **Notes** | Show live count badge: "X active sessions now". Highlight sessions with last\_activity \> 25 min in orange. Use React Query refetchInterval for auto-refresh. |  |  |

**Wireframe Mockup — Page 30: Active Sessions Monitor**

## **11.4 Failed Login Report**

| Page 31 — Failed Login Report |  |  |  |
| ----- | ----- | ----- | ----- |
| **Route** | /admin/security/failed-logins | **DB Tables** | audit\_logs, users |
| **Permission** | AUDIT:READ | **Layout** | Stats cards \+ filterable table | Unlock action inline |
| **Description** | Filtered view of FAILED\_LOGIN events. Identifies brute-force attempts. Shows lockout status. IP addresses appearing \>5 times highlighted red. |  |  |
| **TABLE COLUMNS** |  |  |  |
| **Column** | **Source Field** | **Sortable** | **Notes** |
| Timestamp | created\_at | Yes |  |
| Username Tried | entity\_name | Yes | May not be a real user |
| User (if found) | user\_id \-\> name | No | Link. Null if fake username. |
| IP Address | ip\_address | Yes | Repeated IPs highlighted red |
| Attempts (user) | failed\_login\_attempts | No | Running count |
| Account Locked | account\_locked\_until | No | Lock icon \+ timestamp if locked |
| Error | error\_message | No |  |
| **FILTERS & SEARCH** |  |  |  |
| **Filter** | **Type** | **Values** | **Notes** |
| Date Range | Date picker | Required | Default last 24h |
| Username | Text search |  |  |
| IP Address | Text |  |  |
| Locked Only | Toggle | true/false | Filters account\_locked\_until \> NOW() |
| **ACTIONS & BUTTONS** |  |  |  |
| **Action** | **Trigger** | **Permission** | **Behavior** |
| **Unlock Account** | Unlock icon (if locked) | USER:UPDATE | PATCH status=ACTIVE. Resets failed\_login\_attempts. |
| **View User** | Link icon | USER:READ | Navigate /admin/users/:id |
| **Export** | Button | AUDIT:EXPORT | CSV export |
| **API CALLS** |  |  |  |
| **Method** | **Endpoint** | **Trigger** | **Response** |
| **GET** | /audit?actionType=FAILED\_LOGIN\&from=\&to= | Load | Filtered events |
| **GET** | /security/failed-login-summary?from=\&to= | Stats cards | Returns totals |
| **PATCH** | /users/:id/status | Unlock | Body: {status:ACTIVE} |
| **Notes** | Stats cards at top: "Total Failed (24h)", "Unique IPs", "Locked Accounts". IPs with \>5 attempts highlighted red. |  |  |

**Wireframe Mockup — Page 31: Failed Login Report**

# **12\. Sprint Delivery Plan**

| Sprint | Deliverable | Zeina Itriq — Backend | Mohammad Khalifa — Frontend |
| :---: | ----- | ----- | ----- |
| **12 weeks** | **Auth \+ Core Setup** | JWT \+ Spring Security, Auth endpoints, User entity, Flyway migrations | Component library (all shared), AdminShell layout, Pages 1-5 (all auth) |
| **22 weeks** | **Tenant \+ Branch** | Tenant CRUD \+ config \+ status, Branch CRUD \+ HQ validation, limits enforcement | Pages 6-12: Dashboard, TenantList/Form/Detail/Config, BranchList/Form |
| **32 weeks** | **User Management** | User CRUD \+ passwords, UserTenantAccess, Sessions, bulk status | Pages 13-17: UserList/Form/Detail/Sessions/TenantAccess |
| **42 weeks** | **Groups \+ RBAC** | Group CRUD \+ members/roles, Role CRUD, Module/Permission CRUD, permission resolution | Pages 18-27: GroupList/Form/Detail, RoleList/Form/Matrix, ModuleList/Form, PermList/Form |
| **52 weeks** | **Audit \+ Security \+ Dashboard** | Audit query \+ export, SessionMonitor, Failed-login summary, MFA setup | Pages 28-31: AuditLog/Detail, SessionMonitor, FailedLogins; Dashboard KPIs polish |

*Healthcare Core System — Admin Module Blueprint v3.0  |  Confidential*

Architect: Alaa Himour  |  Backend: Zeina Itriq  |  Frontend: Mohammad Khalifa