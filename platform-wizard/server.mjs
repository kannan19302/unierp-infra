import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SSO_SECRET = process.env.SSO_SECRET || 'unierp-master-sso-secret-key-2026-secure';

// ── 10 Platforms Inventory & Metadata ─────────────────────────────────────────
const PLATFORMS = [
  {
    id: 'p1',
    code: 'P1',
    name: 'Marketing Site',
    repo: 'marketing-site',
    layer: 'L4 Presentation',
    port: 4001,
    url: 'http://localhost:4001',
    category: 'public',
    isPublic: true,
    requiredRole: 'guest',
    icon: 'globe',
    description: 'Corporate front door, pricing, product showcases, and self-service tenant registration.',
    badge: 'Public Portal',
    tags: ['Next.js', 'SSG', 'Public', 'L4 Presentation'],
    features: ['Tenant Registration', 'Feature Matrix', 'Pricing Engine', 'Case Studies']
  },
  {
    id: 'p2',
    code: 'P2',
    name: 'Provider Admin OS',
    repo: 'provider-admin-os',
    layer: 'L4 Presentation',
    port: 4002,
    url: 'http://localhost:4002',
    category: 'internal',
    isPublic: false,
    requiredRole: 'unierp_team',
    icon: 'shield-alert',
    description: 'Internal multi-tenant operator OS for platform-wide infrastructure, billing, and telemetry.',
    badge: '🔒 UniERP Internal Only',
    tags: ['React', 'Operator OS', 'Internal', 'SuperAdmin'],
    features: ['Cluster Telemetry', 'Tenant Provisioning', 'Billing Invoicing', 'RLS Policy Audit']
  },
  {
    id: 'p3',
    code: 'P3',
    name: 'Tenant Apps / ERP',
    repo: 'tenant-apps',
    layer: 'L4 Presentation',
    port: 4003,
    url: 'http://localhost:4003',
    category: 'tenant',
    isPublic: false,
    requiredRole: 'customer_employee',
    icon: 'layout-grid',
    description: 'Core enterprise business applications suite: Finance, HR, Sales, CRM, and Supply Chain (45 modules).',
    badge: 'Business Core',
    tags: ['React', 'Enterprise Suite', '45 Modules', 'Multi-Tenant'],
    features: ['General Ledger (GL)', 'Supply Chain / Inventory', 'CRM / Pipeline', 'HR & Payroll']
  },
  {
    id: 'p4',
    code: 'P4',
    name: 'Tenant Websites',
    repo: 'tenant-sites',
    layer: 'L4 Presentation',
    port: 4004,
    url: 'http://localhost:4004',
    category: 'public',
    isPublic: true,
    requiredRole: 'guest',
    icon: 'store',
    description: 'Customer-facing published websites, digital storefronts, portfolios, and brand landing pages.',
    badge: 'Public Storefront',
    tags: ['Astro', 'Tenant Sites', 'E-Commerce', 'Public'],
    features: ['Digital Catalog', 'Customer Cart / Checkout', 'Brand Landing', 'Dynamic Themes']
  },
  {
    id: 'p5',
    code: 'P5',
    name: 'Web Studio',
    repo: 'web-studio',
    layer: 'L4 Presentation',
    port: 4005,
    url: 'http://localhost:4005',
    category: 'tenant',
    isPublic: false,
    requiredRole: 'tenant_admin',
    icon: 'palette',
    description: 'Visual drag-and-drop no-code / low-code builder for authoring custom pages and tenant sites.',
    badge: 'Tenant Admin',
    tags: ['React', 'Visual Builder', 'WYSIWYG', 'No-Code'],
    features: ['Drag & Drop Canvas', 'Block Library', 'Design Tokens Preview', '1-Click Publish']
  },
  {
    id: 'p6',
    code: 'P6',
    name: 'Tenant Admin Console',
    repo: 'tenant-admin',
    layer: 'L4 Presentation',
    port: 4006,
    url: 'http://localhost:4006',
    category: 'tenant',
    isPublic: false,
    requiredRole: 'tenant_admin',
    icon: 'settings-2',
    description: 'Organization administration portal for managing team members, roles, domain routing, and subscriptions.',
    badge: 'Tenant Admin',
    tags: ['React', 'Org Console', 'RBAC', 'Governance'],
    features: ['User & Role Management', 'Custom Domains', 'Subscription Plans', 'Audit Log Viewer']
  },
  {
    id: 'p7',
    code: 'P7',
    name: 'Marketplace',
    repo: 'marketplace',
    layer: 'L4 Presentation',
    port: 4007,
    url: 'http://localhost:4007',
    category: 'public',
    isPublic: true,
    requiredRole: 'guest',
    icon: 'shopping-bag',
    description: 'App ecosystem, integration connectors, verified 3rd-party plugins, and 1-click module installer.',
    badge: 'Open Catalog',
    tags: ['Next.js', 'Ecosystem', 'Connectors', 'Public'],
    features: ['Verified Extensions', 'Integration Catalog', '1-Click Install', 'Developer Monetization']
  },
  {
    id: 'p8',
    code: 'P8',
    name: 'Developer Platform',
    repo: 'developer-platform',
    layer: 'L4 Presentation',
    port: 4008,
    url: 'http://localhost:4008',
    category: 'public',
    isPublic: true,
    requiredRole: 'guest',
    icon: 'code-2',
    description: 'Public API documentation, webhook builder, OpenAPI schemas, and SDK reference kits.',
    badge: 'Open Docs',
    tags: ['Docusaurus', 'OpenAPI', 'SDKs', 'Public'],
    features: ['Interactive API Console', 'Webhook Sandbox', 'SDK Code Snippets', 'GraphQL Playground']
  },
  {
    id: 'p9',
    code: 'P9',
    name: 'Mobile App',
    repo: 'unierp-mobile',
    layer: 'L5 Client',
    port: 4009,
    url: 'http://localhost:4009',
    category: 'client',
    isPublic: false,
    requiredRole: 'customer_employee',
    icon: 'smartphone',
    description: 'Touch-optimized Flutter Web mobile client for field operations, inventory scanning, and staff workflows.',
    badge: 'Mobile Client',
    tags: ['Flutter Web', 'Cross-Platform', 'Barcode Scanning', 'L5 Client'],
    features: ['Barcode / QR Scanner', 'Offline POS Mode', 'Push Approvals', 'Field Service']
  },
  {
    id: 'p10',
    code: 'P10',
    name: 'Desktop App',
    repo: 'desktop-app',
    layer: 'L5 Client',
    port: 4010,
    url: 'http://localhost:4010',
    category: 'client',
    isPublic: false,
    requiredRole: 'customer_employee',
    icon: 'monitor',
    description: 'Heavyweight desktop client web preview with offline-ready local synchronization and native shell telemetry.',
    badge: 'Desktop Client',
    tags: ['Tauri / Electron', 'Offline Sync', 'Native Shell', 'L5 Client'],
    features: ['Local SQLite Cache', 'Hardware Device Bridge', 'Multi-Window Workspace', 'Batch Processing']
  }
];

// Backend services for health monitoring
const BACKEND_SERVICES = [
  { id: 'api', name: 'API Backend Monolith', port: 3001, url: 'http://localhost:3001/health', layer: 'L3 Service', description: 'Central Fastify API gateway and 45 business domains' },
  { id: 'idp', name: 'Identity Provider (IdP)', port: 3005, url: 'http://localhost:3005/health', layer: 'L3 Service', description: 'OAuth2/OIDC, Multi-tenant JWT minting, RBAC authority' },
  { id: 'storybook', name: 'Design System Storybook', port: 6006, url: 'http://localhost:6006', layer: 'Support', description: 'Living UI component catalog and token documentation' }
];

// Demo Personas for Quick Switcher & Global Authentication
const DEMO_PERSONAS = {
  guest: {
    id: 'guest',
    name: 'Public Guest',
    email: 'guest@visitor.unierp.internal',
    role: 'guest',
    tenant: 'Public Access',
    tenantId: 'tenant_public',
    tier: 'Guest Visitor',
    badge: 'Guest Visitor',
    avatar: 'G',
    allowedPlatforms: ['p1', 'p4', 'p7', 'p8']
  },
  customer_employee: {
    id: 'usr_emp_492',
    name: 'Sarah Chen',
    title: 'Finance Analyst',
    email: 'sarah.chen@acme-corp.com',
    role: 'customer_employee',
    tenant: 'Acme Global Ltd (Tenant #104)',
    tenantId: 'tenant_acme_104',
    tier: 'Enterprise Tenant',
    badge: 'Tenant Staff',
    avatar: 'S',
    allowedPlatforms: ['p1', 'p3', 'p4', 'p7', 'p8', 'p9', 'p10']
  },
  tenant_admin: {
    id: 'usr_adm_101',
    name: 'Alex Rivera',
    title: 'IT Director & Org Admin',
    email: 'alex.rivera@acme-corp.com',
    role: 'tenant_admin',
    tenant: 'Acme Global Ltd (Tenant #104)',
    tenantId: 'tenant_acme_104',
    tier: 'Enterprise Tenant',
    badge: 'Tenant Administrator',
    avatar: 'A',
    allowedPlatforms: ['p1', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']
  },
  unierp_team: {
    id: 'usr_staff_001',
    name: 'Kannan',
    title: 'UniERP Core Platform Lead',
    email: 'kannan@unierp.internal',
    role: 'unierp_team',
    tenant: 'UniERP Provider Realm',
    tenantId: 'tenant_provider_realm',
    tier: 'SuperAdmin / Platform Engineer',
    badge: 'UniERP Core Team',
    avatar: 'K',
    allowedPlatforms: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']
  }
};

// In-memory session store
const SESSIONS = new Map();

// Helper: Sign SSO token
function createSSOToken(user, targetPlatformId = 'wizard') {
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenant: user.tenant,
    tenantId: user.tenantId || 'tenant_public',
    targetPlatform: targetPlatformId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SSO_SECRET).update(str).digest('base64url');
  return `${str}.${sig}`;
}

// Helper: Verify SSO token
function verifySSOToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [dataStr, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SSO_SECRET).update(dataStr).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Helper: Parse cookie
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return list;
}

// Helper: Check URL health
async function checkUrl(url, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const start = Date.now();
    try {
      const u = new URL(url);
      const req = http.request({
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers: { 'User-Agent': 'UniERP-Platform-Wizard/1.0' },
        timeout: timeoutMs
      }, (res) => {
        const latency = Date.now() - start;
        const ok = res.statusCode >= 200 && res.statusCode < 400;
        res.resume();
        resolve({ ok, statusCode: res.statusCode, latency });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, statusCode: 504, latency: Date.now() - start, error: 'Timeout' });
      });

      req.on('error', (err) => {
        resolve({ ok: false, statusCode: 503, latency: Date.now() - start, error: err.message });
      });

      req.end();
    } catch (e) {
      resolve({ ok: false, statusCode: 500, latency: Date.now() - start, error: e.message });
    }
  });
}

// Helper: Filter platforms for role
function getPlatformsForRole(role) {
  if (role === 'unierp_team' || role === 'superadmin') {
    return PLATFORMS; // All 10 platforms visible
  }
  if (role === 'tenant_admin') {
    // Tenant Admin sees all tenant suite + public, but NOT Provider Admin OS (P2)
    return PLATFORMS.filter(p => p.id !== 'p2');
  }
  if (role === 'customer_employee') {
    // Tenant Employee sees ERP, Mobile, Desktop, and Public platforms
    return PLATFORMS.filter(p => ['p1', 'p3', 'p4', 'p7', 'p8', 'p9', 'p10'].includes(p.id));
  }
  // Guest / Public visitor: sees only public platforms
  return PLATFORMS.filter(p => p.isPublic);
}

// Helper: Authenticate Request Context
function authenticateRequest(req, url) {
  const cookies = parseCookies(req);
  const sessionId = cookies['unierp_wizard_session'];

  // 1. Check Bearer Token in Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifySSOToken(token);
    if (payload) {
      return {
        user: {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          tenant: payload.tenant,
          tenantId: payload.tenantId,
          badge: DEMO_PERSONAS[payload.role]?.badge || payload.role
        },
        authMethod: 'bearer'
      };
    }
  }

  // 2. Check Session Cookie
  if (sessionId && SESSIONS.has(sessionId)) {
    return {
      user: SESSIONS.get(sessionId),
      authMethod: 'session'
    };
  }

  // 3. Query Param or Header Role Override (for backward compatibility with E2E test runners)
  const roleOverride = url.searchParams.get('role') || req.headers['x-user-role'];
  if (roleOverride && DEMO_PERSONAS[roleOverride]) {
    return {
      user: DEMO_PERSONAS[roleOverride],
      authMethod: 'role-override'
    };
  }

  // 4. Default Guest Persona Context
  return {
    user: DEMO_PERSONAS.guest,
    authMethod: 'guest-default'
  };
}

// ── HTTP Request Handler ─────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const authContext = authenticateRequest(req, url);
  const currentUser = authContext.user;

  // JSON Response Helper
  const sendJson = (data, status = 200, headers = {}) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Role',
      ...headers
    });
    res.end(JSON.stringify(data));
  };

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Role'
    });
    return res.end();
  }

  // ── ROUTE: Global Login Page ───────────────────────────────────────────────
  if (pathname === '/login' || pathname === '/login.html') {
    const loginFilePath = path.join(PUBLIC_DIR, 'login.html');
    if (fs.existsSync(loginFilePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(loginFilePath));
    }
  }

  // ── API: Get Current Session (Public) ──────────────────────────────────────
  if (pathname === '/api/auth/session' && req.method === 'GET') {
    return sendJson({
      authenticated: currentUser.role !== 'guest',
      user: currentUser,
      authMethod: authContext.authMethod,
      personas: Object.values(DEMO_PERSONAS)
    });
  }

  // ── API: Get Available Personas & Realms (Public) ──────────────────────────
  if (pathname === '/api/auth/personas' && req.method === 'GET') {
    return sendJson({
      personas: Object.values(DEMO_PERSONAS),
      realms: [
        { domain: 'visitor.unierp.internal', name: 'Public Realm', defaultRole: 'guest' },
        { domain: 'acme-corp.com', name: 'Acme Global Ltd (Tenant #104)', defaultRole: 'customer_employee' },
        { domain: 'unierp.internal', name: 'UniERP Provider Realm', defaultRole: 'unierp_team' }
      ]
    });
  }

  // ── API: Switch Persona / Credential Login (Public) ────────────────────────
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        let authenticatedUser = null;

        // Mode A: Direct persona switch by role
        if (payload.role && DEMO_PERSONAS[payload.role]) {
          authenticatedUser = DEMO_PERSONAS[payload.role];
        } 
        // Mode B: Email / password credentials login
        else if (payload.email) {
          const emailLower = payload.email.toLowerCase().trim();
          
          if (emailLower.includes('kannan') || emailLower.endsWith('@unierp.internal') || payload.role === 'unierp_team') {
            authenticatedUser = DEMO_PERSONAS.unierp_team;
          } else if (emailLower.includes('alex') || emailLower.includes('admin') || payload.role === 'tenant_admin') {
            authenticatedUser = DEMO_PERSONAS.tenant_admin;
          } else if (emailLower.includes('sarah') || emailLower.includes('emp') || emailLower.endsWith('@acme-corp.com') || payload.role === 'customer_employee') {
            authenticatedUser = DEMO_PERSONAS.customer_employee;
          } else {
            // Dynamic custom tenant employee
            authenticatedUser = {
              id: `usr_${crypto.randomBytes(4).toString('hex')}`,
              name: payload.name || payload.email.split('@')[0],
              email: payload.email,
              role: 'customer_employee',
              tenant: payload.tenant || 'Custom Tenant Organization',
              tenantId: `tenant_${crypto.randomBytes(3).toString('hex')}`,
              tier: 'Standard Enterprise',
              badge: 'Tenant Staff',
              avatar: (payload.name || payload.email).charAt(0).toUpperCase()
            };
          }
        } else {
          authenticatedUser = DEMO_PERSONAS.guest;
        }

        const newSessionId = crypto.randomBytes(24).toString('hex');
        SESSIONS.set(newSessionId, authenticatedUser);

        const targetPlatform = payload.targetPlatform || 'wizard';
        const ssoToken = createSSOToken(authenticatedUser, targetPlatform);

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': `unierp_wizard_session=${newSessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
        });
        return res.end(JSON.stringify({
          success: true,
          authenticated: authenticatedUser.role !== 'guest',
          user: authenticatedUser,
          token: ssoToken,
          sessionId: newSessionId
        }));
      } catch (err) {
        return sendJson({ error: 'Invalid JSON payload' }, 400);
      }
    });
    return;
  }

  // ── API: Logout (Public) ───────────────────────────────────────────────────
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const cookies = parseCookies(req);
    const sessionId = cookies['unierp_wizard_session'];
    if (sessionId) SESSIONS.delete(sessionId);

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': 'unierp_wizard_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
    });
    return res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));
  }

  // ── API: Verify Token (Public) ─────────────────────────────────────────────
  if (pathname === '/api/auth/verify-token' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { token } = JSON.parse(body || '{}');
        const payload = verifySSOToken(token);
        if (!payload) {
          return sendJson({ valid: false, error: 'Invalid or expired SSO token' }, 401);
        }
        return sendJson({ valid: true, payload });
      } catch (e) {
        return sendJson({ valid: false, error: 'Invalid request' }, 400);
      }
    });
    return;
  }

  // ── API: Get Platforms Catalog (Authenticated & Role-Gated) ───────────────
  if (pathname === '/api/platforms' && req.method === 'GET') {
    const requestedRole = url.searchParams.get('role') || currentUser.role;
    const filtered = getPlatformsForRole(requestedRole);
    return sendJson({
      role: requestedRole,
      user: currentUser,
      count: filtered.length,
      totalAvailable: PLATFORMS.length,
      platforms: filtered
    });
  }

  // ── API: Launch Platform with SSO Token (Authenticated & Role-Gated) ───────
  if (pathname.startsWith('/api/sso/launch/')) {
    const platformId = pathname.replace('/api/sso/launch/', '').split('?')[0];
    const platform = PLATFORMS.find(p => p.id.toLowerCase() === platformId.toLowerCase() || p.code.toLowerCase() === platformId.toLowerCase());

    if (!platform) {
      return sendJson({ error: `Platform ${platformId} not found` }, 404);
    }

    // Role-Gate Verification
    const visiblePlatforms = getPlatformsForRole(currentUser.role);
    const isAllowed = visiblePlatforms.some(p => p.id === platform.id);

    if (!isAllowed) {
      return sendJson({
        error: '403 Forbidden: Your account role does not have permission to access this platform.',
        platformId: platform.id,
        platformName: platform.name,
        userRole: currentUser.role
      }, 403);
    }

    // Generate SSO Token with cryptographic signature
    const ssoToken = createSSOToken(currentUser, platform.id);
    const ssoUrl = `${platform.url}/sso?token=${encodeURIComponent(ssoToken)}&redirect=${encodeURIComponent('/')}`;

    // If format=redirect requested, 302 redirect
    if (url.searchParams.get('format') === 'redirect') {
      res.writeHead(302, { Location: ssoUrl });
      return res.end();
    }

    return sendJson({
      success: true,
      platform: platform.name,
      port: platform.port,
      ssoUrl,
      directUrl: platform.url,
      token: ssoToken,
      user: currentUser
    });
  }

  // ── API: Live Health Matrix (Authenticated) ────────────────────────────────
  if (pathname === '/api/health/matrix' && req.method === 'GET') {
    const targets = [
      ...PLATFORMS.map(p => ({ id: p.id, name: p.name, code: p.code, port: p.port, url: p.url, layer: p.layer, isPlatform: true, isPublic: p.isPublic })),
      ...BACKEND_SERVICES.map(s => ({ id: s.id, name: s.name, code: s.id.toUpperCase(), port: s.port, url: s.url, layer: s.layer, isPlatform: false, isPublic: s.id === 'storybook' }))
    ];

    const results = await Promise.all(
      targets.map(async (t) => {
        const resCheck = await checkUrl(t.url);
        return {
          ...t,
          status: resCheck.ok ? 'online' : 'offline',
          statusCode: resCheck.statusCode,
          latency: resCheck.latency,
          error: resCheck.error || null
        };
      })
    );

    const onlineCount = results.filter(r => r.status === 'online').length;
    return sendJson({
      timestamp: new Date().toISOString(),
      onlineCount,
      totalCount: results.length,
      allHealthy: onlineCount === results.length,
      user: currentUser,
      matrix: results
    });
  }

  // ── API: Trigger End-to-End Navigation Test (Protected - UniERP Team Only) ──
  if (pathname === '/api/test/run-e2e' && req.method === 'POST') {
    if (currentUser.role !== 'unierp_team' && currentUser.role !== 'superadmin') {
      return sendJson({ error: '403 Forbidden: Only UniERP Core Team / SuperAdmin may trigger E2E tests' }, 403);
    }

    const scriptPath = path.resolve(__dirname, '../../scripts/test-e2e-platforms.mjs');
    exec(`node "${scriptPath}"`, { timeout: 35000 }, (error, stdout, stderr) => {
      sendJson({
        success: !error,
        exitCode: error ? error.code : 0,
        output: stdout,
        errorOutput: stderr
      });
    });
    return;
  }

  // ── Static Files Serving ───────────────────────────────────────────────────
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  // Fallback to index.html for unknown files or directory requests
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n=============================================================`);
  console.log(`🔮 \x1b[1m\x1b[35mUniERP Master SSO Platform Wizard & Gateway\x1b[0m`);
  console.log(`=============================================================`);
  console.log(`  Local Gateway: \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  Global Login:  \x1b[36mhttp://localhost:${PORT}/login\x1b[0m`);
  console.log(`  Network:       \x1b[36mhttp://${HOST}:${PORT}\x1b[0m`);
  console.log(`  Access Modes:  \x1b[32mGuest (Public)\x1b[0m | \x1b[34mTenant User\x1b[0m | \x1b[33mTenant Admin\x1b[0m | \x1b[35mUniERP Team\x1b[0m`);
  console.log(`=============================================================\n`);
});
