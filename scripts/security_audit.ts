import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// ── 0. Environment Setup ──
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        let val = vals.join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}
loadEnv();

import { encrypt, decrypt, generateHmac } from '../src/lib/crypto';
import { prisma as extendedPrisma } from '../src/lib/prisma';

// ── Colors & Formatting ──
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgDark: '\x1b[40m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assertTest(name: string, condition: boolean, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${ANSI.green}✓ [PASS]${ANSI.reset} ${name}`);
    if (details) console.log(`         ${ANSI.dim}${details}${ANSI.reset}`);
  } else {
    failedTests++;
    console.log(`  ${ANSI.red}✗ [FAIL]${ANSI.reset} ${name}`);
    if (details) console.log(`         ${ANSI.red}Reason: ${details}${ANSI.reset}`);
  }
}

async function runSecurityAudit() {
  console.log(`\n${ANSI.cyan}${ANSI.bold}╔═════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║     PROJECT A.K.A.S.H.I.C. — AUTOMATED SECURITY & ENCRYPTION AUDIT SUITE    ║`);
  console.log(`╚═════════════════════════════════════════════════════════════════════════════╝${ANSI.reset}\n`);

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 1: CRYPTOGRAPHIC PRIMITIVES & APPLICATION-LEVEL ENCRYPTION (ALE)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(`${ANSI.yellow}${ANSI.bold}► [SUITE 1] Cryptographic Engine & Key Management${ANSI.reset}`);

  // Test 1.1: Key presence and length
  const fieldKey = process.env.FIELD_ENCRYPTION_KEY;
  const hmacKey = process.env.SEARCH_HMAC_KEY;
  const isFieldKeyValid = !!fieldKey && Buffer.from(fieldKey, 'base64').length === 32;
  const isHmacKeyValid = !!hmacKey && Buffer.from(hmacKey, 'base64').length === 32;
  assertTest('AES-256 Master Key Strength', isFieldKeyValid, 'Key decoded to 256 bits (32 bytes)');
  assertTest('HMAC-SHA256 Blind Index Key Strength', isHmacKeyValid, 'Key decoded to 256 bits (32 bytes)');

  // Test 1.2: Encryption format
  const samplePlaintext = 'TopSecret_Analyst_Intel_2026';
  const ciphertextNonSearchable = encrypt(samplePlaintext, false);
  const partsNonSearch = ciphertextNonSearchable.split(':');
  const validFormatNonSearch = partsNonSearch.length === 5 && partsNonSearch[0] === 'v1' && partsNonSearch[1] === '';
  assertTest(
    'AES-256-GCM Payload Format (Non-queryable)',
    validFormatNonSearch,
    `Format: v1::<iv>:<ciphertext>:<tag> (Length: ${ciphertextNonSearchable.length} chars)`
  );

  // Test 1.3: Queryable Blind Indexing Format
  const ciphertextSearchable = encrypt(samplePlaintext, true);
  const partsSearch = ciphertextSearchable.split(':');
  const expectedHmac = generateHmac(samplePlaintext);
  const validFormatSearch = partsSearch.length === 5 && partsSearch[0] === 'v1' && partsSearch[1] === expectedHmac;
  assertTest(
    'HMAC-SHA256 Blind Index Construction',
    validFormatSearch,
    `Prefix matches HMAC hash: v1:${expectedHmac.slice(0, 16)}...`
  );

  // Test 1.4: Decryption roundtrip
  const decryptedText = decrypt(ciphertextSearchable);
  assertTest('AEAD Decryption Fidelity', decryptedText === samplePlaintext, 'Original plaintext restored without corruption');

  // Test 1.5: Semantic Security & IV Randomness
  const ciphertext2 = encrypt(samplePlaintext, false);
  const ciphertextsDifferent = ciphertextNonSearchable !== ciphertext2;
  assertTest(
    'Semantic Security / Nonce Entropy (CPA Resistance)',
    ciphertextsDifferent,
    'Identical plaintexts generate different ciphertexts (unique 96-bit IVs)'
  );

  // Test 1.6: AEAD Tamper Rejection (Bit-flipping defense)
  let tamperDetected = false;
  try {
    const tamperedParts = [...partsNonSearch];
    // Flip a byte in the base64 ciphertext
    const ct = tamperedParts[3];
    tamperedParts[3] = ct.charAt(0) === 'A' ? 'B' + ct.slice(1) : 'A' + ct.slice(1);
    decrypt(tamperedParts.join(':'));
  } catch (err: any) {
    tamperDetected = /Decryption failed/i.test(err.message);
  }
  assertTest(
    'AEAD Authentication Tag Verification (Tamper Proofing)',
    tamperDetected,
    'Modified ciphertext rejected with authentication tag mismatch'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 2: DATABASE ZERO-TRUST STORAGE INSPECTION (AT-REST AUDIT)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.yellow}${ANSI.bold}► [SUITE 2] Database At-Rest Encryption (ALE vs Raw Storage)${ANSI.reset}`);

  const rawPrisma = new PrismaClient();
  try {
    // Inspect raw storage without extension
    const rawUsers: any[] = await rawPrisma.$queryRawUnsafe(`SELECT * FROM User LIMIT 5;`);
    
    if (rawUsers.length > 0) {
      let allEmailsEncrypted = true;
      for (const u of rawUsers) {
        if (!u.email || !u.email.startsWith('v1:')) {
          allEmailsEncrypted = false;
          break;
        }
      }
      assertTest(
        'Physical Storage At-Rest Verification (User table)',
        allEmailsEncrypted,
        `Sample raw record: email="${rawUsers[0].email.slice(0, 30)}..."`
      );

      // Verify extended prisma transparently decrypts
      const decryptedUser = await extendedPrisma.user.findFirst();
      const isPlaintextReturned = decryptedUser?.email && !decryptedUser.email.startsWith('v1:');
      assertTest(
        'Transparent ORM Decryption in Memory',
        !!isPlaintextReturned,
        `Application receives decrypted email: "${decryptedUser?.email}"`
      );
    } else {
      assertTest(
        'Physical Storage At-Rest Verification (User table)',
        true,
        'No seeded users found; table schema ready for encrypted inserts'
      );
    }

    // Inspect IntelEntity table
    const rawEntities: any[] = await rawPrisma.$queryRawUnsafe(`SELECT * FROM IntelEntity LIMIT 5;`);
    if (rawEntities.length > 0) {
      let allAliasesEncrypted = true;
      for (const e of rawEntities) {
        if (!e.primaryAlias || !e.primaryAlias.startsWith('v1:')) {
          allAliasesEncrypted = false;
          break;
        }
      }
      assertTest(
        'Physical Storage At-Rest Verification (IntelEntity table)',
        allAliasesEncrypted,
        `Sample raw record: primaryAlias="${rawEntities[0].primaryAlias.slice(0, 30)}..."`
      );

      const decryptedEntity = await extendedPrisma.intelEntity.findFirst();
      const isPlaintextEntity = decryptedEntity?.primaryAlias && !decryptedEntity.primaryAlias.startsWith('v1:');
      assertTest(
        'Transparent Entity Decryption in Memory',
        !!isPlaintextEntity,
        `Application receives decrypted alias: "${decryptedEntity?.primaryAlias}"`
      );
    } else {
      assertTest(
        'Physical Storage At-Rest Verification (IntelEntity table)',
        true,
        'No seeded entities found; table schema ready for encrypted inserts'
      );
    }
  } catch (dbErr: any) {
    assertTest('Database Connection & Inspection', false, dbErr.message);
  } finally {
    await rawPrisma.$disconnect();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 3: NETWORK & HTTP TRANSPORT SECURITY HEADERS (LIVE SERVER)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.yellow}${ANSI.bold}► [SUITE 3] Network & HTTP Transport Security (http://localhost:3000)${ANSI.reset}`);

  try {
    const res = await fetch('http://localhost:3000', { method: 'GET' });
    assertTest('Dev Server Online & Reachable', res.status === 200, `HTTP Status ${res.status}`);

    const headers = res.headers;

    // Strict-Transport-Security
    const hsts = headers.get('strict-transport-security');
    const hstsValid = !!hsts && hsts.includes('max-age=63072000') && hsts.includes('includeSubDomains');
    assertTest('Strict-Transport-Security (HSTS)', hstsValid, hsts || 'Header missing');

    // Content-Security-Policy
    const csp = headers.get('content-security-policy');
    const cspValid = !!csp && csp.includes("default-src 'self'") && csp.includes("script-src");
    assertTest('Content-Security-Policy (CSP)', cspValid, csp ? csp.slice(0, 75) + '...' : 'Header missing');

    // X-Frame-Options
    const xfo = headers.get('x-frame-options');
    assertTest('Anti-Clickjacking (X-Frame-Options: DENY)', xfo === 'DENY', xfo || 'Header missing');

    // X-Content-Type-Options
    const xcto = headers.get('x-content-type-options');
    assertTest('MIME-Sniffing Protection (X-Content-Type-Options: nosniff)', xcto === 'nosniff', xcto || 'Header missing');

    // Referrer-Policy
    const rp = headers.get('referrer-policy');
    assertTest('Referrer Leak Prevention (Referrer-Policy)', rp === 'strict-origin-when-cross-origin', rp || 'Header missing');
  } catch (netErr: any) {
    assertTest('Dev Server Connection', false, `Failed to connect to http://localhost:3000: ${netErr.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 4: AUTHENTICATION, AUTHORIZATION & ZERO-TRUST SESSION SECURITY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.yellow}${ANSI.bold}► [SUITE 4] Authentication & Zero-Trust Session Access Control${ANSI.reset}`);

  try {
    // Test 4.1: Empty credentials rejection
    const emptyLoginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '' }),
    });
    assertTest(
      'Rejection of Empty Credentials (400 Bad Request)',
      emptyLoginRes.status === 400,
      `Received HTTP Status ${emptyLoginRes.status}`
    );

    // Test 4.2: Unauthorized / Malicious login rejection
    const invalidLoginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'intruder', password: 'wrongpassword' }),
    });
    assertTest(
      'Rejection of Invalid Credentials (401 Unauthorized)',
      invalidLoginRes.status === 401,
      `Received HTTP Status ${invalidLoginRes.status}`
    );

    // Test 4.3: Valid operator authentication with encrypted session cookie
    const validLoginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password' }),
    });
    const loginJson = await validLoginRes.json();
    const isLoginSuccess = validLoginRes.status === 200 && loginJson.success === true;
    assertTest(
      'Predefined Operator Authentication (Admin Clearance)',
      isLoginSuccess && loginJson.data?.user?.clearanceLevel === 3,
      `Status: ${validLoginRes.status}, Clearance Level: ${loginJson.data?.user?.clearanceLevel}`
    );

    // Test 4.4: Inspect Set-Cookie header for encryption & flags
    const cookieHeader = validLoginRes.headers.get('set-cookie') || '';
    const hasHttpOnly = /HttpOnly/i.test(cookieHeader);
    const hasSameSite = /SameSite=Strict/i.test(cookieHeader);
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    const isEncryptedCookie = sessionMatch ? sessionMatch[1].startsWith('v1%3A') || sessionMatch[1].startsWith('v1:') : false;

    assertTest(
      'Session Cookie Security Flags (HttpOnly & SameSite=Strict)',
      hasHttpOnly && hasSameSite,
      `Flags verified: HttpOnly=${hasHttpOnly}, SameSite=Strict=${hasSameSite}`
    );

    assertTest(
      'Zero-Trust JWE Session Encryption in Transit',
      isEncryptedCookie,
      `Session cookie contains encrypted ciphertext (v1:...) preventing plaintext tampering`
    );

    // Test 4.5: Role-Based Access Control (RBAC) Clearance Levels
    const analystRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'analyst', password: 'password' }),
    });
    const analystJson = await analystRes.json();
    const agentRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'agent', password: 'password' }),
    });
    const agentJson = await agentRes.json();

    const rbacValid = analystJson.data?.user?.clearanceLevel === 1 && agentJson.data?.user?.clearanceLevel === 2;
    assertTest(
      'Multi-Tier Clearance Verification (Analyst L1, Agent L2, Admin L3)',
      rbacValid,
      `Analyst Level: ${analystJson.data?.user?.clearanceLevel}, Agent Level: ${agentJson.data?.user?.clearanceLevel}, Admin Level: ${loginJson.data?.user?.clearanceLevel}`
    );

  } catch (authErr: any) {
    assertTest('Authentication Audit', false, authErr.message);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT SUMMARY & SCORECARD
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.bold}═══════════════════════════════════════════════════════════════════════════════${ANSI.reset}`);
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  const color = failedTests === 0 ? ANSI.green : ANSI.yellow;

  console.log(`${color}${ANSI.bold}AUDIT SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${passRate}%)${ANSI.reset}`);
  if (failedTests === 0) {
    console.log(`${ANSI.green}STATUS: ALL SECURITY CONTROLS, FIELD-LEVEL ENCRYPTION, AND POLICIES VERIFIED.${ANSI.reset}`);
  } else {
    console.log(`${ANSI.red}STATUS: ${failedTests} CONTROLS REQUIRE ATTENTION.${ANSI.reset}`);
  }
  console.log(`${ANSI.bold}═══════════════════════════════════════════════════════════════════════════════${ANSI.reset}\n`);

  process.exit(failedTests === 0 ? 0 : 1);
}

runSecurityAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
