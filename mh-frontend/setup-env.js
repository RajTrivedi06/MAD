#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔧 MAD Authentication Environment Setup");
console.log("=====================================\n");

const envPath = path.join(__dirname, ".env.local");
const templatePath = path.join(__dirname, "env.template");

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log("⚠️  .env.local already exists!");
  console.log("If you want to recreate it, delete the existing file first.\n");
  process.exit(0);
}

// Check if template exists
if (!fs.existsSync(templatePath)) {
  console.error("❌ env.template not found!");
  console.log(
    "Please create env.template first with your Supabase credentials.\n"
  );
  process.exit(1);
}

// Read template
const template = fs.readFileSync(templatePath, "utf8");

// Create .env.local
fs.writeFileSync(envPath, template);

console.log("✅ Created .env.local from template");
console.log("");
console.log("📝 Next steps:");
console.log("1. Edit .env.local and add your actual Supabase credentials");
console.log("2. Get your credentials from: https://supabase.com/dashboard");
console.log("3. Go to Settings → API in your Supabase project");
console.log("4. Copy the Project URL and anon/public key");
console.log("5. Replace the placeholder values in .env.local");
console.log("6. Restart your development server: npm run dev");
console.log("");
console.log("🔍 To test your setup:");
console.log("1. Start the dev server: npm run dev");
console.log("2. Open browser console");
console.log("3. Run: testAuth()");
console.log("");
console.log("📚 For more help, see: AUTHENTICATION_DEBUG_GUIDE.md");
