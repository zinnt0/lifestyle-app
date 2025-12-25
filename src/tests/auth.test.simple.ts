/**
 * Vereinfachter Auth Service Test
 *
 * Dieser Test mockt React Native Dependencies und kann direkt mit Node.js ausgeführt werden.
 *
 * Ausführung:
 * npm run test:auth:simple
 */

// Lade Environment Variables
import dotenv from 'dotenv';
dotenv.config();

// Mock AsyncStorage für Node.js Umgebung
const mockStorage: Record<string, string> = {};

const AsyncStorage = {
  getItem: async (key: string) => mockStorage[key] || null,
  setItem: async (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: async (key: string) => {
    delete mockStorage[key];
  },
};

// Mock für @react-native-async-storage/async-storage
(global as any).AsyncStorage = AsyncStorage;

// Mocke react-native-url-polyfill
// Diese Bibliothek wird nur für URL Handling benötigt
import { URL } from 'url';
(global as any).URL = URL;

// Jetzt können wir Supabase importieren
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase Credentials fehlen in .env");
  process.exit(1);
}

// Supabase Client mit gemocktem Storage
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Farben für Console Output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  test: (msg: string) => console.log(`${colors.blue}\n▶ ${msg}${colors.reset}`),
};

// Test Credentials
const TEST_EMAIL = "trisizinn01@gmail.com";
const TEST_PASSWORD = "password123";

/**
 * Test 1: Benutzer Registrierung
 */
async function testSignUp() {
  log.test("Test 1: Benutzer Registrierung");

  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (error) {
      log.error(`Fehler: ${error.message}`);
      return false;
    }

    if (data.user) {
      log.success(`Benutzer erstellt: ${data.user.email}`);
      log.info(`User ID: ${data.user.id}`);
      return true;
    }

    log.error("Unerwartetes Ergebnis");
    return false;
  } catch (err: any) {
    log.error(`Exception: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: Benutzer Anmeldung
 */
async function testSignIn() {
  log.test("Test 2: Benutzer Anmeldung");

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (error) {
      log.error(`Fehler: ${error.message}`);
      return false;
    }

    if (data.user && data.session) {
      log.success(`Anmeldung erfolgreich: ${data.user.email}`);
      log.info(`Session Token vorhanden: ${!!data.session.access_token}`);
      return true;
    }

    log.error("Unerwartetes Ergebnis");
    return false;
  } catch (err: any) {
    log.error(`Exception: ${err.message}`);
    return false;
  }
}

/**
 * Test 3: Aktuellen Benutzer abrufen
 */
async function testGetCurrentUser() {
  log.test("Test 3: Aktuellen Benutzer abrufen");

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      log.warn(`Fehler: ${error.message}`);
      return false;
    }

    if (data.user) {
      log.success(`Aktueller Benutzer: ${data.user.email}`);
      log.info(`User ID: ${data.user.id}`);
      return true;
    }

    log.warn("Kein Benutzer angemeldet");
    return false;
  } catch (err: any) {
    log.error(`Exception: ${err.message}`);
    return false;
  }
}

/**
 * Test 4: Benutzer Abmeldung
 */
async function testSignOut() {
  log.test("Test 4: Benutzer Abmeldung");

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      log.error(`Fehler: ${error.message}`);
      return false;
    }

    log.success("Abmeldung erfolgreich");

    // Verify user is logged out
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      log.success("Session erfolgreich gelöscht");
      return true;
    }

    log.error("Benutzer ist noch angemeldet!");
    return false;
  } catch (err: any) {
    log.error(`Exception: ${err.message}`);
    return false;
  }
}

/**
 * Test 5: Anmeldung mit falschen Credentials
 */
async function testSignInWithWrongPassword() {
  log.test("Test 5: Anmeldung mit falschem Passwort");

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: "wrongPassword123",
    });

    if (error) {
      log.success(`Fehler korrekt abgefangen: ${error.message}`);
      return true;
    }

    log.error("Sollte einen Fehler werfen!");
    return false;
  } catch (err: any) {
    log.error(`Exception: ${err.message}`);
    return false;
  }
}

/**
 * Haupt-Test-Runner
 */
async function runTests() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 Supabase Auth Tests (Simplified)");
  console.log("=".repeat(60));

  log.warn(`Test Email: ${TEST_EMAIL}`);
  log.info(`Supabase URL: ${supabaseUrl}\n`);

  const results: { test: string; passed: boolean }[] = [];

  // Tests ausführen
  results.push({ test: "Sign Up", passed: await testSignUp() });

  // Kleine Pause zwischen Tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  results.push({ test: "Sign In", passed: await testSignIn() });

  await new Promise(resolve => setTimeout(resolve, 1000));

  results.push({ test: "Get Current User", passed: await testGetCurrentUser() });

  await new Promise(resolve => setTimeout(resolve, 1000));

  results.push({
    test: "Wrong Password",
    passed: await testSignInWithWrongPassword(),
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  results.push({ test: "Sign Out", passed: await testSignOut() });

  // Ergebnisse
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Ergebnisse");
  console.log("=".repeat(60));

  results.forEach((result) => {
    if (result.passed) {
      log.success(`${result.test}: PASSED`);
    } else {
      log.error(`${result.test}: FAILED`);
    }
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log("\n" + "=".repeat(60));
  if (passed === total) {
    log.success(`Alle Tests bestanden! (${passed}/${total})`);
  } else {
    log.warn(`${passed}/${total} Tests bestanden`);
  }
  console.log("=".repeat(60) + "\n");
}

// Tests ausführen
runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
