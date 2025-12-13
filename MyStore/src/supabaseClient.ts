import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rzhvclsfhjpxznebdfnt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_oayioqkMO6HUsHN5UHu2Cw_GXykCCQ7";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
