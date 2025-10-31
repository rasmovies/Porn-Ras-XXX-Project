# Admin User Setup Guide

## Admin Credentials
- **Username:** Pornras Admin
- **Password:** 1qA2ws3ed*

## Supabase Setup Instructions

### Step 1: Run SQL Migration
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `add_admin_user.sql` into the editor
6. Click **Run** (or press `Ctrl+Enter`)

### Step 2: Verify Admin User Creation
After running the SQL, you should see:
- A new row in the `profiles` table with user_name = 'Pornras Admin'
- A new row in the `admin_users` table with user_name = 'Pornras Admin' and is_admin = true

### Step 3: Query Admin Users
To check if the admin user was created successfully, run this query in SQL Editor:

```sql
-- Check admin users
SELECT * FROM admin_users WHERE user_name = 'Pornras Admin';

-- Check profile
SELECT * FROM profiles WHERE user_name = 'Pornras Admin';
```

### Step 4: Update Application Code
The application should check the `admin_users` table to verify if a user is an admin. The logic should be:

1. User logs in with username and password
2. System checks if the username exists in `admin_users` table
3. If exists and `is_admin = true`, grant admin access

### Security Notes
⚠️ **Important**: This setup doesn't include password hashing. For production:
1. Use Supabase Auth for authentication
2. Store passwords securely (never plaintext)
3. Use JWT tokens for session management
4. Implement proper role-based access control (RBAC)

## Current Implementation
The admin check in the application is currently based on username matching. To make it more robust:

```typescript
// Example: Check if user is admin
const checkIfAdmin = async (username: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('is_admin')
    .eq('user_name', username)
    .single();
  
  return data?.is_admin === true;
};
```

## Adding More Admins
To add more admin users, run this SQL:

```sql
INSERT INTO admin_users (user_name, is_admin) 
VALUES ('NewAdminUsername', true);
```

## Removing Admin Access
To remove admin access:

```sql
UPDATE admin_users 
SET is_admin = false 
WHERE user_name = 'Username';
```




