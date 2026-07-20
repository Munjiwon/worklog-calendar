const crypto = require("crypto");
const fs = require("fs/promises");
const http = require("http");
const path = require("path");
const querystring = require("querystring");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const USERNAME = process.env.WORKLOG_USERNAME || "admin";
const PASSWORD = process.env.WORKLOG_PASSWORD || "1q2w3e4r";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-session-secret";
const SESSION_COOKIE = "worklog_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PUBLIC_PATHS = new Set(["/login", "/login.html", "/styles.css", "/favicon.ico"]);
const ROLES = new Set(["user", "admin"]);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET is not set. Set it in production to keep sessions private.");
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = normalizePath(url.pathname);
    const session = getSession(request);

    if (pathname === "/health") {
      sendText(response, 200, "ok");
      return;
    }

    if (request.method === "GET" && (pathname === "/login" || pathname === "/login.html")) {
      if (session) {
        redirect(response, "/");
        return;
      }
      await serveFile(response, "login.html");
      return;
    }

    if (request.method === "POST" && pathname === "/login") {
      await handleLogin(request, response);
      return;
    }

    if (request.method === "GET" && (pathname === "/admin" || pathname === "/admin.html" || pathname === "/admin.js")) {
      if (!session) {
        redirect(response, "/login");
        return;
      }
      if (session.role !== "admin") {
        redirect(response, "/");
        return;
      }
      await serveFile(response, pathname === "/admin.js" ? "admin.js" : "admin.html");
      return;
    }

    if (request.method === "GET" && pathname === "/api/session") {
      if (!session) {
        sendJson(response, 401, { error: "unauthorized" });
        return;
      }
      sendJson(response, 200, { role: session.role, username: session.sub });
      return;
    }

    if (request.method === "GET" && pathname === "/api/users") {
      if (!requireAdmin(response, session)) return;
      const users = await loadUsers();
      sendJson(response, 200, {
        users: users.map((user) => ({
          createdAt: user.createdAt,
          role: user.role,
          username: user.username
        }))
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/users") {
      if (!requireAdmin(response, session)) return;
      await handleCreateUser(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/logout") {
      clearSessionCookie(response);
      redirect(response, "/login");
      return;
    }

    if (!PUBLIC_PATHS.has(pathname) && !session) {
      redirect(response, "/login");
      return;
    }

    if (pathname === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }

    const filePath = pathname === "/" ? "index.html" : pathname.slice(1);
    await serveFile(response, filePath);
  } catch (error) {
    console.error(error);
    sendText(response, 500, "Internal Server Error");
  }
});

startServer();

async function startServer() {
  await ensureUserStore();
  server.listen(PORT, () => {
    console.log(`Worklog calendar listening on http://0.0.0.0:${PORT}`);
  });
}

async function handleLogin(request, response) {
  const body = querystring.parse(await readBody(request));
  const username = String(body.username || "");
  const password = String(body.password || "");
  const user = await findUser(username);

  if (user && verifyPassword(password, user.passwordHash)) {
    setSessionCookie(response, user);
    redirect(response, "/");
    return;
  }

  redirect(response, "/login?error=1");
}

async function handleCreateUser(request, response) {
  const body = await readJsonBody(request);
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  const role = String(body.role || "user");

  if (!isValidUsername(username)) {
    sendJson(response, 400, { error: "아이디는 영문, 숫자, 점, 밑줄, 하이픈 3-40자로 입력해주세요." });
    return;
  }

  if (password.length < 6) {
    sendJson(response, 400, { error: "비밀번호는 6자 이상으로 입력해주세요." });
    return;
  }

  if (!ROLES.has(role)) {
    sendJson(response, 400, { error: "권한은 일반 또는 관리자만 선택할 수 있습니다." });
    return;
  }

  const users = await loadUsers();
  if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    sendJson(response, 409, { error: "이미 존재하는 아이디입니다." });
    return;
  }

  const user = {
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
    role,
    username
  };
  users.push(user);
  await saveUsers(users);

  sendJson(response, 201, {
    user: {
      createdAt: user.createdAt,
      role: user.role,
      username: user.username
    }
  });
}

async function readBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 10_000) throw new Error("Request body too large");
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody(request) {
  const body = await readBody(request);
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return querystring.parse(body);
  }
}

async function serveFile(response, relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  if (!resolved.startsWith(ROOT)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(resolved);
    const contentType = MIME_TYPES[path.extname(resolved)] || "application/octet-stream";
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentType
    });
    response.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendText(response, 404, "Not Found");
      return;
    }
    throw error;
  }
}

function isAuthenticated(request) {
  return Boolean(getSession(request));
}

function getSession(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(sign(payload), signature)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.sub || Number(session.exp) <= Date.now()) return false;
    return {
      role: session.role === "admin" ? "admin" : "user",
      sub: String(session.sub)
    };
  } catch {
    return false;
  }
}

function setSessionCookie(response, user) {
  const payload = Buffer.from(JSON.stringify({
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    role: user.role,
    sub: user.username
  })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const secure = process.env.COOKIE_SECURE === "true" ? "; Secure" : "";

  response.setHeader("Set-Cookie", [
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
  ]);
}

function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", [
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  ]);
}

function sign(payload) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

async function ensureUserStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(USERS_FILE);
  } catch {
    const initialAdmin = {
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(PASSWORD),
      role: "admin",
      username: USERNAME
    };
    await saveUsers([initialAdmin]);
    return;
  }

  const users = await loadUsers();
  if (!users.some((user) => user.role === "admin")) {
    users.push({
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(PASSWORD),
      role: "admin",
      username: USERNAME
    });
    await saveUsers(users);
  }
}

async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    const users = JSON.parse(data);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function saveUsers(users) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`);
}

async function findUser(username) {
  const normalized = normalizeUsername(username);
  const users = await loadUsers();
  return users.find((user) => user.username.toLowerCase() === normalized.toLowerCase());
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [algorithm, salt, hash] = String(passwordHash || "").split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = crypto.scryptSync(String(password), salt, 64);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function normalizeUsername(username) {
  return String(username || "").trim();
}

function isValidUsername(username) {
  return /^[A-Za-z0-9_.-]{3,40}$/.test(username);
}

function requireAdmin(response, session) {
  if (!session) {
    sendJson(response, 401, { error: "unauthorized" });
    return false;
  }
  if (session.role !== "admin") {
    sendJson(response, 403, { error: "forbidden" });
    return false;
  }
  return true;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(header) {
  return header.split(";").reduce((cookies, item) => {
    const [name, ...parts] = item.trim().split("=");
    if (!name) return cookies;
    cookies[name] = decodeURIComponent(parts.join("="));
    return cookies;
  }, {});
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function redirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

function sendText(response, status, text) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(text);
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(data));
}
