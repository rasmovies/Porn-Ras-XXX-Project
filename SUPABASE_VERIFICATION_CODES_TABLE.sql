-- Supabase'de verification_codes tablosunu oluşturmak için SQL
-- Bu tablo 6 haneli doğrulama kodlarını saklar

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_unused ON verification_codes(email, is_used) WHERE is_used = FALSE;

-- Otomatik temizlik için (kullanılmış veya süresi dolmuş kodları sil)
-- Bu trigger/function'ı Supabase'de oluşturabilirsiniz
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE (is_used = TRUE) OR (expires_at < NOW());
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) politikaları
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Herkes kod oluşturabilir (anon)
CREATE POLICY "Anyone can create verification codes"
  ON verification_codes FOR INSERT
  TO anon
  WITH CHECK (true);

-- Herkes kod okuyabilir (anon) - sadece kendi email'i için
CREATE POLICY "Anyone can read verification codes for their email"
  ON verification_codes FOR SELECT
  TO anon
  USING (true);

-- Herkes kod güncelleyebilir (anon) - sadece kendi email'i için
CREATE POLICY "Anyone can update verification codes for their email"
  ON verification_codes FOR UPDATE
  TO anon
  USING (true);



