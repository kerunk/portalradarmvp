import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bmzrismxolxwgahzfeer.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dbNonN1GclUy2p6yq045eQ_9EMPE3eP";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
