import 'server-only'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client — uses service role key, bypasses RLS.
// Importing this from a client component will throw at build time thanks to 'server-only'.
export const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
  auth: { autoRefreshToken: false, persistSession: false },
})
