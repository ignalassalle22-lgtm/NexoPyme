import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://asfrtcbpygesbhqhqull.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZnJ0Y2JweWdlc2JocWhxdWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTg1MDUsImV4cCI6MjA4OTYzNDUwNX0.2aFXuW5UgJW2i6WY31GuVrXNsEVc0AN1oZ65NWEWV04'
)
