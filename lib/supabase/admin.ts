import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service role 권한 클라이언트. 서버 코드에서만 import 할 것.
// "server-only"가 클라이언트 번들에 섞여 들어가면 빌드 타임에 에러를 발생시켜 유출을 막는다.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
