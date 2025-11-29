import { createClient } from '@supabase/supabase-js';

// REMPLACE CES VALEURS PAR CELLES DE TON DASHBOARD SUPABASE
// Settings -> API
const supabaseUrl = 'https://cphfmtnifonekoioktns.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwaGZtdG5pZm9uZWtvaW9rdG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTk1MDQsImV4cCI6MjA3OTkzNTUwNH0.-JeNtmtS0c6XPA6rliT61bVgJxBginWvFtbP-e9FZ7M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
