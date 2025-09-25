import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Health check endpoint
app.get("/make-server-270b10a4/health", (c) => {
  return c.json({ status: "ok" });
});

// User signup endpoint
app.post("/make-server-270b10a4/auth/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    if (!email || !password || !name || !role) {
      return c.json({ error: "모든 필드를 입력해주세요." }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: "회원가입에 실패했습니다. 이미 등록된 이메일일 수 있습니다." }, 400);
    }

    // Store additional user data in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      role,
      createdAt: new Date().toISOString(),
    });

    return c.json({ 
      message: "회원가입이 완료되었습니다.",
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role,
      }
    });

  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: "서버 오류가 발생했습니다." }, 500);
  }
});

// Get user profile endpoint
app.get("/make-server-270b10a4/auth/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "인증 토큰이 필요합니다." }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "인증에 실패했습니다." }, 401);
    }

    // Get user data from KV store
    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      return c.json({ error: "사용자 정보를 찾을 수 없습니다." }, 404);
    }

    return c.json({ user: userData });

  } catch (error) {
    console.log(`Profile fetch error: ${error}`);
    return c.json({ error: "서버 오류가 발생했습니다." }, 500);
  }
});

Deno.serve(app.fetch);