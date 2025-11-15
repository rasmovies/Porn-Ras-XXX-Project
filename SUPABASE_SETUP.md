# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login with your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `adulttube`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
6. Click "Create new project"

## 2. Get Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API"
4. Copy the following values:
   - Project URL
   - Anon public key

## 3. Set Environment Variables

Create a `.env.local` file in the `client` directory:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
REACT_APP_ENV=development
```

## 4. Setup Database Schema

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the sidebar
3. Click "New query"
4. Copy and paste the contents of `database-schema.sql`
5. Click "Run" to execute the SQL

### Email Automation Tables

To enable the email queue and logging used by the MailerSend integration, run the SQL in `add_email_automation.sql` as well:

1. In the Supabase SQL Editor click "New query".
2. Paste the file contents.
3. Run the query to create `email_queue`, `email_logs`, `email_templates`, and `marketing_campaigns`.

## 5. Test the Connection

1. Start your development server:
   ```bash
   npm start
   ```

2. Go to http://localhost:3000/admin
3. Try adding a category or model
4. Check if data appears in Supabase dashboard

## 6. Verify Data in Supabase

1. Go to your Supabase project dashboard
2. Click on "Table Editor" in the sidebar
3. You should see the following tables:
   - categories
   - models
   - videos
   - comments

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error:**
   - Check that your environment variables are correct
   - Make sure you're using the anon key, not the service role key

2. **"Failed to load data" error:**
   - Check that the database schema was created successfully
   - Verify that RLS policies are set up correctly

3. **CORS errors:**
   - Make sure your Supabase project URL is correct
   - Check that your domain is allowed in Supabase settings

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)





