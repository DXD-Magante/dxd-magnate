import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bpwolooauknqwgcefpra.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwd29sb29hdWtucXdnY2VmcHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxOTQ2MTQsImV4cCI6MjA2Mjc3MDYxNH0.UpUUZsOUyqmIrD97_2H5tf9xWr0TdLvFEw_ZtZ7fDm8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);