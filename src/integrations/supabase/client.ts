import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bmzrisxmoxlwgahzfeer.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dbNonN1GclUy2p6yq045eQ_9EMPE3eP";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
