import fs from 'node:fs';
import path from 'node:path';

const serverClientDts = `import { SupabaseClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import type { CookieOptionsWithName, CookieMethodsServer, CookieMethodsServerDeprecated } from "./types";

export declare function createServerClient<
  Database = any,
  SchemaName extends string & keyof Omit<Database, "__InternalSupabase"> = "public" extends keyof Omit<Database, "__InternalSupabase">
    ? "public"
    : string & keyof Omit<Database, "__InternalSupabase">
>(
  supabaseUrl: string,
  supabaseKey: string,
  options: SupabaseClientOptions<SchemaName> & {
    cookieOptions?: CookieOptionsWithName;
    cookies: CookieMethodsServer;
    cookieEncoding?: "raw" | "base64url";
  }
): SupabaseClient<Database, SchemaName, SchemaName>;

export declare function createServerClient<
  Database = any,
  SchemaName extends string & keyof Omit<Database, "__InternalSupabase"> = "public" extends keyof Omit<Database, "__InternalSupabase">
    ? "public"
    : string & keyof Omit<Database, "__InternalSupabase">
>(
  supabaseUrl: string,
  supabaseKey: string,
  options: SupabaseClientOptions<SchemaName> & {
    cookieOptions?: CookieOptionsWithName;
    cookies: CookieMethodsServerDeprecated;
    cookieEncoding?: "raw" | "base64url";
  }
): SupabaseClient<Database, SchemaName, SchemaName>;
`;

const browserClientDts = `import { SupabaseClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import type { CookieMethodsBrowser, CookieMethodsBrowserDeprecated, CookieOptionsWithName } from "./types";

export declare function createBrowserClient<
  Database = any,
  SchemaName extends string & keyof Omit<Database, "__InternalSupabase"> = "public" extends keyof Omit<Database, "__InternalSupabase">
    ? "public"
    : string & keyof Omit<Database, "__InternalSupabase">
>(
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseClientOptions<SchemaName> & {
    cookies?: CookieMethodsBrowser;
    cookieOptions?: CookieOptionsWithName;
    cookieEncoding?: "raw" | "base64url";
    isSingleton?: boolean;
  }
): SupabaseClient<Database, SchemaName, SchemaName>;

export declare function createBrowserClient<
  Database = any,
  SchemaName extends string & keyof Omit<Database, "__InternalSupabase"> = "public" extends keyof Omit<Database, "__InternalSupabase">
    ? "public"
    : string & keyof Omit<Database, "__InternalSupabase">
>(
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseClientOptions<SchemaName> & {
    cookies: CookieMethodsBrowserDeprecated;
    cookieOptions?: CookieOptionsWithName;
    cookieEncoding?: "raw" | "base64url";
    isSingleton?: boolean;
  }
): SupabaseClient<Database, SchemaName, SchemaName>;
`;

for (const dir of ['main', 'module']) {
  const ssrDir = path.join(process.cwd(), 'node_modules', '@supabase', 'ssr', 'dist', dir);
  if (fs.existsSync(ssrDir)) {
    fs.writeFileSync(path.join(ssrDir, 'createServerClient.d.ts'), serverClientDts, 'utf8');
    fs.writeFileSync(path.join(ssrDir, 'createBrowserClient.d.ts'), browserClientDts, 'utf8');
  }
}

