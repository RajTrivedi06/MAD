// Authentication debugging utilities
// Run these functions in the browser console for debugging

export async function testAuth() {
  console.log("🧪 Starting comprehensive auth test...");

  try {
    // Test 1: Environment variables
    console.log("1️⃣ Testing environment variables...");
    const envCheck = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing",
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    };
    console.log("Environment check:", envCheck);

    if (!envCheck.url || !envCheck.key) {
      console.error("❌ Environment variables missing!");
      return;
    }

    // Test 2: Supabase connection
    console.log("2️⃣ Testing Supabase connection...");
    const { supabase } = await import("@/lib/supabase/client");
    const { data: healthCheck, error: healthError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (healthError) {
      console.error("❌ Supabase connection failed:", healthError);
      return;
    }
    console.log("✅ Supabase connection successful");

    // Test 3: Current session
    console.log("3️⃣ Checking current session...");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("Session exists:", session ? "✅" : "❌");

    if (session) {
      console.log("4️⃣ Verifying user...");
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      console.log("User verified:", user && !error ? "✅" : "❌");

      if (user) {
        console.log("5️⃣ Checking profile...");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        console.log("Profile exists:", profile ? "✅" : "❌");
        if (profileError) {
          console.error("Profile error:", profileError);
        }
      }
    }

    // Test 6: LocalStorage check
    console.log("6️⃣ Checking localStorage...");
    const token = localStorage.getItem("sb-supabase-auth-token");
    console.log("Token in localStorage:", token ? "✅" : "❌");

    console.log("✅ Auth test completed!");
  } catch (error) {
    console.error("💥 Test failed:", error);
  }
}

export async function diagnoseSessionIssue() {
  console.log("🔍 Diagnosing session persistence issue...");

  try {
    const { supabase } = await import("@/lib/supabase/client");

    // Check all localStorage keys
    console.log("📋 All localStorage keys:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes("supabase")) {
        console.log(
          `  - ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`
        );
      }
    }

    // Check session directly
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    console.log("🔐 Direct session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      error: error?.message,
    });

    // Check user directly
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("👤 Direct user check:", {
      hasUser: !!user,
      userId: user?.id,
      error: userError?.message,
    });

    // Check if we're in a browser environment
    console.log("🌐 Environment check:", {
      hasWindow: typeof window !== "undefined",
      hasLocalStorage: typeof localStorage !== "undefined",
      userAgent: navigator.userAgent.substring(0, 100),
    });

    // Test token refresh
    console.log("🔄 Testing token refresh...");
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    console.log("Token refresh result:", {
      success: !refreshError,
      error: refreshError?.message,
    });
  } catch (error) {
    console.error("💥 Session diagnosis failed:", error);
  }
}

export async function testProfileCreation(userId: string, email: string) {
  console.log("🧪 Testing profile creation...");

  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { createProfile } = await import("@/lib/supabase/auth");

    // Test profile creation
    const result = await createProfile(userId, email, "Test", "User");

    if (result.error) {
      console.error("❌ Profile creation failed:", result.error);
    } else {
      console.log("✅ Profile creation successful:", result.profile);
    }
  } catch (error) {
    console.error("💥 Profile creation test failed:", error);
  }
}

export async function testSignIn(email: string, password: string) {
  console.log("🧪 Testing sign in...");

  try {
    const { supabase } = await import("@/lib/supabase/client");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Sign in failed:", error);
    } else {
      console.log("✅ Sign in successful:", data.user?.id);
    }
  } catch (error) {
    console.error("💥 Sign in test failed:", error);
  }
}

export async function testSignUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  console.log("🧪 Testing sign up...");

  try {
    const { supabase } = await import("@/lib/supabase/client");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        },
      },
    });

    if (error) {
      console.error("❌ Sign up failed:", error);
    } else {
      console.log("✅ Sign up successful:", data.user?.id);
    }
  } catch (error) {
    console.error("💥 Sign up test failed:", error);
  }
}

// Make functions available globally for console access
if (typeof window !== "undefined") {
  (
    window as typeof window & {
      testAuth: typeof testAuth;
      diagnoseSessionIssue: typeof diagnoseSessionIssue;
      testProfileCreation: typeof testProfileCreation;
      testSignIn: typeof testSignIn;
      testSignUp: typeof testSignUp;
    }
  ).testAuth = testAuth;
  (
    window as typeof window & {
      testAuth: typeof testAuth;
      diagnoseSessionIssue: typeof diagnoseSessionIssue;
      testProfileCreation: typeof testProfileCreation;
      testSignIn: typeof testSignIn;
      testSignUp: typeof testSignUp;
    }
  ).diagnoseSessionIssue = diagnoseSessionIssue;
  (
    window as typeof window & {
      testAuth: typeof testAuth;
      diagnoseSessionIssue: typeof diagnoseSessionIssue;
      testProfileCreation: typeof testProfileCreation;
      testSignIn: typeof testSignIn;
      testSignUp: typeof testSignUp;
    }
  ).testProfileCreation = testProfileCreation;
  (
    window as typeof window & {
      testAuth: typeof testAuth;
      diagnoseSessionIssue: typeof diagnoseSessionIssue;
      testProfileCreation: typeof testProfileCreation;
      testSignIn: typeof testSignIn;
      testSignUp: typeof testSignUp;
    }
  ).testSignIn = testSignIn;
  (
    window as typeof window & {
      testAuth: typeof testAuth;
      diagnoseSessionIssue: typeof diagnoseSessionIssue;
      testProfileCreation: typeof testProfileCreation;
      testSignIn: typeof testSignIn;
      testSignUp: typeof testSignUp;
    }
  ).testSignUp = testSignUp;
}
