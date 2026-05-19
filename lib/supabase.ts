import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser-safe client (anon key, RLS enforced).
// Server-side code must import { supabaseAdmin } from '@/lib/supabase-admin' instead.
export const supabase = createClient(supabaseUrl, supabaseAnon)
