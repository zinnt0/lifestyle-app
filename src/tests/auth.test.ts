/**
 * Auth Service Test File
 *
 * Dieses File testet alle Auth-Funktionen mit Supabase.
 *
 * WICHTIG: Bevor du dieses File ausführst:
 * 1. Stelle sicher, dass .env mit Supabase Credentials existiert
 * 2. Ändere die Test-Email zu einer echten Email-Adresse
 * 3. Führe die Tests nacheinander aus (nicht alle auf einmal)
 *
 * Ausführung:
 * npx ts-node src/tests/auth.test.ts
 */

import "react-native-url-polyfill/auto";
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  resetPassword,
  updatePassword,
  onAuthStateChange,
} from "../services/auth.service";

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

// Test Credentials - ÄNDERE DIESE!
const TEST_EMAIL = "trisizinn01@gmail.com";
const TEST_PASSWORD = "password123";
const NEW_PASSWORD = "newPassword456";

/**
 * Test 1: Benutzer Registrierung
 */
async function testSignUp() {
  log.test("Test 1: Benutzer Registrierung");

  const result = await signUp(TEST_EMAIL, TEST_PASSWORD);

  if (result.error) {
    log.error(`Fehler: ${result.error.message}`);
    return false;
  }

  if (result.user) {
    log.success(`Benutzer erstellt: ${result.user.email}`);
    log.info(`User ID: ${result.user.id}`);
    return true;
  }

  log.error("Unerwartetes Ergebnis");
  return false;
}

/**
 * Test 2: Benutzer Anmeldung
 */
async function testSignIn() {
  log.test("Test 2: Benutzer Anmeldung");

  const result = await signIn(TEST_EMAIL, TEST_PASSWORD);

  if (result.error) {
    log.error(`Fehler: ${result.error.message}`);
    return false;
  }

  if (result.user && result.session) {
    log.success(`Anmeldung erfolgreich: ${result.user.email}`);
    log.info(`Session Token vorhanden: ${!!result.session.access_token}`);
    return true;
  }

  log.error("Unerwartetes Ergebnis");
  return false;
}

/**
 * Test 3: Aktuellen Benutzer abrufen
 */
async function testGetCurrentUser() {
  log.test("Test 3: Aktuellen Benutzer abrufen");

  const user = await getCurrentUser();

  if (user) {
    log.success(`Aktueller Benutzer: ${user.email}`);
    log.info(`User ID: ${user.id}`);
    return true;
  }

  log.warn("Kein Benutzer angemeldet");
  return false;
}

/**
 * Test 4: Passwort zurücksetzen
 */
async function testResetPassword() {
  log.test("Test 4: Passwort zurücksetzen");

  const result = await resetPassword(TEST_EMAIL);

  if (result.error) {
    log.error(`Fehler: ${result.error.message}`);
    return false;
  }

  log.success("Passwort-Reset Email wurde gesendet");
  log.info("Prüfe dein Email-Postfach!");
  return true;
}

/**
 * Test 5: Passwort aktualisieren (nur wenn angemeldet)
 */
async function testUpdatePassword() {
  log.test("Test 5: Passwort aktualisieren");

  const result = await updatePassword(NEW_PASSWORD);

  if (result.error) {
    log.error(`Fehler: ${result.error.message}`);
    return false;
  }

  log.success("Passwort erfolgreich aktualisiert");
  return true;
}

/**
 * Test 6: Auth State Change Listener
 */
async function testAuthStateChange() {
  log.test("Test 6: Auth State Change Listener");

  return new Promise<boolean>((resolve) => {
    let eventReceived = false;

    const unsubscribe = onAuthStateChange((user) => {
      if (!eventReceived) {
        eventReceived = true;
        if (user) {
          log.success(`Auth State Event: Benutzer angemeldet (${user.email})`);
        } else {
          log.success("Auth State Event: Benutzer abgemeldet");
        }
        unsubscribe();
        resolve(true);
      }
    });

    // Timeout nach 3 Sekunden
    setTimeout(() => {
      if (!eventReceived) {
        log.warn("Kein Auth State Event empfangen");
        unsubscribe();
        resolve(false);
      }
    }, 3000);
  });
}

/**
 * Test 7: Benutzer Abmeldung
 */
async function testSignOut() {
  log.test("Test 7: Benutzer Abmeldung");

  const result = await signOut();

  if (result.error) {
    log.error(`Fehler: ${result.error.message}`);
    return false;
  }

  log.success("Abmeldung erfolgreich");

  // Verify user is logged out
  const user = await getCurrentUser();
  if (!user) {
    log.success("Session erfolgreich gelöscht");
    return true;
  }

  log.error("Benutzer ist noch angemeldet!");
  return false;
}

/**
 * Test 8: Anmeldung mit falschen Credentials
 */
async function testSignInWithWrongPassword() {
  log.test("Test 8: Anmeldung mit falschem Passwort");

  const result = await signIn(TEST_EMAIL, "wrongPassword123");

  if (result.error) {
    log.success(`Fehler korrekt abgefangen: ${result.error.message}`);
    return true;
  }

  log.error("Sollte einen Fehler werfen!");
  return false;
}

/**
 * Test 9: Registrierung mit schwachem Passwort
 */
async function testSignUpWithWeakPassword() {
  log.test("Test 9: Registrierung mit schwachem Passwort");

  const result = await signUp("weak@test.de", "123");

  if (result.error) {
    log.success(`Fehler korrekt abgefangen: ${result.error.message}`);
    return true;
  }

  log.error("Sollte einen Fehler werfen!");
  return false;
}

/**
 * Haupt-Test-Runner
 */
async function runAllTests() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 Auth Service Tests");
  console.log("=".repeat(60));

  log.warn(`Test Email: ${TEST_EMAIL}`);
  log.warn(`Test Password: ${TEST_PASSWORD}`);
  log.info(
    "WICHTIG: Stelle sicher, dass du eine gültige Email verwendest!\n"
  );

  const results: { test: string; passed: boolean }[] = [];

  // Negative Tests (sollten fehlschlagen)
  results.push({
    test: "Schwaches Passwort",
    passed: await testSignUpWithWeakPassword(),
  });

  // Positive Tests
  results.push({ test: "Sign Up", passed: await testSignUp() });
  results.push({ test: "Sign In", passed: await testSignIn() });
  results.push({ test: "Get Current User", passed: await testGetCurrentUser() });
  results.push({
    test: "Auth State Change",
    passed: await testAuthStateChange(),
  });

  // Uncomment wenn du Reset/Update testen willst:
  // results.push({ test: "Reset Password", passed: await testResetPassword() });
  // results.push({ test: "Update Password", passed: await testUpdatePassword() });

  // Negative Test
  results.push({
    test: "Falsches Passwort",
    passed: await testSignInWithWrongPassword(),
  });

  // Cleanup
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

/**
 * Schneller Test (wie vom User gewünscht)
 */
async function quickTest() {
  console.log("\n🚀 Quick Test\n");

  const result = await signUp(TEST_EMAIL, TEST_PASSWORD);
  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.user) {
    log.success("Auth Service funktioniert!");
  } else if (result.error) {
    log.error(`Fehler: ${result.error.message}`);
  }
}

// Hauptprogramm
const args = process.argv.slice(2);

if (args.includes("--quick")) {
  // Schneller Test
  quickTest().catch(console.error);
} else if (args.includes("--all")) {
  // Alle Tests
  runAllTests().catch(console.error);
} else {
  // Default: Hilfe anzeigen
  console.log("\n📖 Auth Service Test Optionen:\n");
  console.log("  npx ts-node src/tests/auth.test.ts --quick");
  console.log("    → Schneller Test (nur signUp)\n");
  console.log("  npx ts-node src/tests/auth.test.ts --all");
  console.log("    → Alle Tests ausführen\n");
}
