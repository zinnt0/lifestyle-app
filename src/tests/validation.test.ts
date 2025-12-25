/**
 * Validation Utilities Test File
 *
 * Tests all validation functions to ensure they work correctly.
 *
 * Ausführung:
 * npm run test:validation
 */

import {
  isValidEmail,
  validateEmail,
  isValidPassword,
  validatePassword,
  getPasswordStrengthHint,
  passwordsMatch,
  validatePasswordConfirmation,
  isEmpty,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateName,
  validateAge,
  validateRegistrationForm,
  validateLoginForm,
  hasErrors,
  getFirstError,
} from "../utils/validation";

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
  test: (msg: string) => console.log(`${colors.blue}\n▶ ${msg}${colors.reset}`),
};

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    log.success(message);
  } else {
    log.error(message);
  }
}

function assertNull(value: any, message: string) {
  assert(value === null, message);
}

function assertNotNull(value: any, message: string) {
  assert(value !== null, message);
}

function assertEqual(actual: any, expected: any, message: string) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

/**
 * Email Validation Tests
 */
function testEmailValidation() {
  log.test("Email Validation Tests");

  // Valid emails
  assert(isValidEmail("user@example.com"), "Valid email passes");
  assert(isValidEmail("test.user@example.co.uk"), "Valid email with dots passes");
  assertNull(validateEmail("user@example.com"), "Valid email has no errors");

  // Invalid emails
  assert(!isValidEmail(""), "Empty email fails");
  assert(!isValidEmail("  "), "Whitespace email fails");
  assert(!isValidEmail("invalid"), "Email without @ fails");
  assert(!isValidEmail("@example.com"), "Email without user fails");
  assert(!isValidEmail("user@"), "Email without domain fails");

  // Error messages
  assertEqual(
    validateEmail(""),
    "Email ist erforderlich",
    "Empty email error message"
  );
  assertEqual(
    validateEmail("invalid"),
    "Bitte gib eine gültige Email-Adresse ein",
    "Invalid email error message"
  );

  // Length validation
  const longEmail = "a".repeat(256) + "@example.com";
  assertNotNull(validateEmail(longEmail), "Email too long fails");
}

/**
 * Password Validation Tests
 */
function testPasswordValidation() {
  log.test("Password Validation Tests");

  // Valid passwords
  assert(isValidPassword("password123"), "Valid password passes");
  assert(isValidPassword("123456"), "Minimum length password passes");
  assertNull(validatePassword("password123"), "Valid password has no errors");

  // Invalid passwords
  assert(!isValidPassword(""), "Empty password fails");
  assert(!isValidPassword("12345"), "Too short password fails");
  assert(!isValidPassword("a".repeat(129)), "Too long password fails");

  // Error messages
  assertEqual(
    validatePassword(""),
    "Passwort ist erforderlich",
    "Empty password error message"
  );
  assertEqual(
    validatePassword("123"),
    "Passwort muss mindestens 6 Zeichen haben",
    "Too short password error message"
  );

  // Password strength hints
  assertEqual(
    getPasswordStrengthHint("123456"),
    "Wir empfehlen mindestens 8 Zeichen für mehr Sicherheit",
    "Weak password hint"
  );
  assertNull(getPasswordStrengthHint("password123"), "Strong password has no hint");
}

/**
 * Password Confirmation Tests
 */
function testPasswordConfirmation() {
  log.test("Password Confirmation Tests");

  // Matching passwords
  assert(passwordsMatch("password123", "password123"), "Matching passwords");
  assertNull(
    validatePasswordConfirmation("password123", "password123"),
    "Matching passwords have no errors"
  );

  // Non-matching passwords
  assert(!passwordsMatch("password123", "password124"), "Non-matching passwords");
  assertEqual(
    validatePasswordConfirmation("password123", "password124"),
    "Passwörter stimmen nicht überein",
    "Non-matching password error message"
  );

  // Empty confirmation
  assertEqual(
    validatePasswordConfirmation("password123", ""),
    "Bitte bestätige dein Passwort",
    "Empty confirmation error message"
  );
}

/**
 * General Validation Tests
 */
function testGeneralValidation() {
  log.test("General Validation Tests");

  // isEmpty
  assert(isEmpty(""), "Empty string is empty");
  assert(isEmpty("  "), "Whitespace string is empty");
  assert(!isEmpty("hello"), "Non-empty string is not empty");

  // validateRequired
  assertEqual(
    validateRequired("", "Name"),
    "Name ist erforderlich",
    "Required field error message"
  );
  assertNull(validateRequired("John", "Name"), "Filled required field passes");

  // validateMinLength
  assertEqual(
    validateMinLength("Hi", 3, "Name"),
    "Name muss mindestens 3 Zeichen haben",
    "Min length error message"
  );
  assertNull(validateMinLength("Hello", 3, "Name"), "Valid min length passes");

  // validateMaxLength
  assertEqual(
    validateMaxLength("This is too long", 10, "Name"),
    "Name ist zu lang (max. 10 Zeichen)",
    "Max length error message"
  );
  assertNull(validateMaxLength("Short", 10, "Name"), "Valid max length passes");
}

/**
 * Name Validation Tests
 */
function testNameValidation() {
  log.test("Name Validation Tests");

  // Valid names
  assertNull(validateName("John Doe"), "Valid name passes");
  assertNull(validateName("Anna-Maria"), "Name with hyphen passes");
  assertNull(validateName("Müller"), "Name with umlaut passes");

  // Invalid names
  assertEqual(
    validateName(""),
    "Name ist erforderlich",
    "Empty name error message"
  );
  assertEqual(
    validateName("J"),
    "Name muss mindestens 2 Zeichen haben",
    "Too short name error message"
  );
  assertNotNull(validateName("John123"), "Name with numbers fails");
  assertNotNull(validateName("a".repeat(51)), "Too long name fails");
}

/**
 * Age Validation Tests
 */
function testAgeValidation() {
  log.test("Age Validation Tests");

  // Valid ages
  assertNull(validateAge("25"), "Valid age passes");
  assertNull(validateAge(30), "Valid age as number passes");
  assertNull(validateAge("13"), "Minimum age passes");
  assertNull(validateAge("120"), "Maximum age passes");

  // Invalid ages
  assertEqual(
    validateAge(""),
    "Alter ist erforderlich",
    "Empty age error message"
  );
  assertEqual(
    validateAge("12"),
    "Du musst mindestens 13 Jahre alt sein",
    "Too young error message"
  );
  assertEqual(
    validateAge("121"),
    "Bitte gib ein gültiges Alter ein",
    "Too old error message"
  );
  assertEqual(
    validateAge("abc"),
    "Bitte gib eine Zahl ein",
    "Non-numeric age error message"
  );
}

/**
 * Form Validation Tests
 */
function testFormValidation() {
  log.test("Form Validation Tests");

  // Valid registration form
  const validRegForm = {
    email: "user@example.com",
    password: "password123",
    confirmPassword: "password123",
  };
  const validRegErrors = validateRegistrationForm(validRegForm);
  assert(!hasErrors(validRegErrors), "Valid registration form has no errors");

  // Invalid registration form
  const invalidRegForm = {
    email: "invalid",
    password: "123",
    confirmPassword: "456",
  };
  const invalidRegErrors = validateRegistrationForm(invalidRegForm);
  assert(hasErrors(invalidRegErrors), "Invalid registration form has errors");
  assertNotNull(invalidRegErrors.email, "Invalid email error exists");
  assertNotNull(invalidRegErrors.password, "Invalid password error exists");
  assertNotNull(
    invalidRegErrors.confirmPassword,
    "Invalid confirm password error exists"
  );

  // Valid login form
  const validLoginForm = {
    email: "user@example.com",
    password: "password123",
  };
  const validLoginErrors = validateLoginForm(validLoginForm);
  assert(!hasErrors(validLoginErrors), "Valid login form has no errors");

  // Invalid login form
  const invalidLoginForm = {
    email: "",
    password: "",
  };
  const invalidLoginErrors = validateLoginForm(invalidLoginForm);
  assert(hasErrors(invalidLoginErrors), "Invalid login form has errors");

  // Get first error
  const errors = { email: "Error 1", password: "Error 2" };
  assertEqual(getFirstError(errors), "Error 1", "Get first error works");
  assertNull(getFirstError({}), "Get first error returns null for empty errors");
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 Validation Tests");
  console.log("=".repeat(60));

  testEmailValidation();
  testPasswordValidation();
  testPasswordConfirmation();
  testGeneralValidation();
  testNameValidation();
  testAgeValidation();
  testFormValidation();

  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Ergebnisse");
  console.log("=".repeat(60));

  if (passedTests === totalTests) {
    log.success(`Alle Tests bestanden! (${passedTests}/${totalTests})`);
  } else {
    log.error(`${passedTests}/${totalTests} Tests bestanden`);
  }

  console.log("=".repeat(60) + "\n");
}

// Run tests
runAllTests();
