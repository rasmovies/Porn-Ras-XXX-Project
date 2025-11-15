# Profiles Tablosu Supabase Kurulumu

Profile verilerinizi Supabase'de saklamak için `profiles` tablosunu oluşturmanız gerekiyor.

## Adımlar

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard

2. **Projenizi seçin** (xgyjhofakpatrqgvleze)

3. **SQL Editor sekmesine tıklayın**

4. **Aşağıdaki SQL komutunu kopyalayıp yapıştırın:**

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL UNIQUE,
  banner_image TEXT,
  avatar_image TEXT,
  subscriber_count INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Allow public read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON profiles FOR DELETE USING (true);
```

5. **"Run" butonuna tıklayın**

6. **Tabloyu kontrol edin:**
   - Supabase Dashboard → Table Editor
   - `profiles` tablosunun oluşturulduğunu görüyor olmalısınız

## Test

1. Profile sayfasına gidin: http://localhost:3000/profile
2. Banner fotoğrafı yükleyin
3. Supabase Dashboard → Table Editor → profiles
4. Verilerin kaydedildiğini görün

## Notlar

- Banner image base64 formatında saklanır
- Her kullanıcının benzersiz bir `user_name`'i olmalıdır
- RLS (Row Level Security) politikaları tüm kullanıcılara açık access sağlar

