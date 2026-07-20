const crypto = require("crypto");
const fs = require("fs/promises");
const http = require("http");
const path = require("path");
const { Pool } = require("pg");
const querystring = require("querystring");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const USERNAME = process.env.WORKLOG_USERNAME || "admin";
const PASSWORD = process.env.WORKLOG_PASSWORD || "1q2w3e4r";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-session-secret";
const SESSION_COOKIE = "worklog_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const DATABASE_URL = process.env.DATABASE_URL || "";
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const CALENDAR_DATA_FILE = path.join(DATA_DIR, "calendar-data.json");
const PUBLIC_PATHS = new Set(["/login", "/login.html", "/register", "/register.html", "/styles.css", "/favicon.ico"]);
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

let dbPool = null;

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

    if (request.method === "GET" && (pathname === "/register" || pathname === "/register.html")) {
      if (session) {
        redirect(response, "/");
        return;
      }
      await serveFile(response, "register.html");
      return;
    }

    if (request.method === "POST" && pathname === "/login") {
      await handleLogin(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/register") {
      await handleRegister(request, response);
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
        users: users.map(publicUser)
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/users") {
      if (!requireAdmin(response, session)) return;
      await handleCreateUser(request, response);
      return;
    }

    if (request.method === "PUT" && pathname.startsWith("/api/users/")) {
      if (!requireAdmin(response, session)) return;
      await handleUpdateUser(request, response, session, decodeURIComponent(pathname.slice("/api/users/".length)));
      return;
    }

    if (request.method === "GET" && pathname === "/api/calendar-data") {
      if (!session) {
        sendJson(response, 401, { error: "unauthorized" });
        return;
      }
      sendJson(response, 200, await loadCalendarDataRecord(session.sub));
      return;
    }

    if ((request.method === "PUT" || request.method === "POST") && pathname === "/api/calendar-data") {
      if (!session) {
        sendJson(response, 401, { error: "unauthorized" });
        return;
      }
      await handleSaveCalendarData(request, response, session);
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

async function handleRegister(request, response) {
  const body = querystring.parse(await readBody(request));
  const userData = validateUserInput({
    email: body.email,
    name: body.name,
    password: body.password,
    role: "user",
    username: body.username
  });

  if (userData.error) {
    redirect(response, `/register?error=${encodeURIComponent(userData.error)}`);
    return;
  }

  const duplicate = await findDuplicateUser(userData.user.username, userData.user.email);
  if (duplicate) {
    redirect(response, `/register?error=${encodeURIComponent(duplicate)}`);
    return;
  }

  const user = {
    createdAt: new Date().toISOString(),
    email: userData.user.email,
    name: userData.user.name,
    passwordHash: hashPassword(userData.user.password),
    role: "user",
    username: userData.user.username
  };
  await createUser(user);
  setSessionCookie(response, user);
  redirect(response, "/");
}

async function handleCreateUser(request, response) {
  const body = await readJsonBody(request);
  const userData = validateUserInput(body);

  if (userData.error) {
    sendJson(response, 400, { error: getUserInputErrorMessage(userData.error) });
    return;
  }

  const duplicate = await findDuplicateUser(userData.user.username, userData.user.email);
  if (duplicate) {
    sendJson(response, 409, { error: getUserInputErrorMessage(duplicate) });
    return;
  }

  const user = {
    createdAt: new Date().toISOString(),
    email: userData.user.email,
    name: userData.user.name,
    passwordHash: hashPassword(userData.user.password),
    role: userData.user.role,
    username: userData.user.username
  };
  await createUser(user);

  sendJson(response, 201, {
    user: {
      createdAt: user.createdAt,
      email: user.email,
      name: user.name,
      role: user.role,
      username: user.username
    }
  });
}

async function handleUpdateUser(request, response, session, username) {
  const existing = await findUser(username);
  if (!existing) {
    sendJson(response, 404, { error: "사용자를 찾을 수 없습니다." });
    return;
  }

  const body = await readJsonBody(request);
  const userData = validateUserUpdateInput(body, existing);

  if (userData.error) {
    sendJson(response, 400, { error: getUserInputErrorMessage(userData.error) });
    return;
  }

  const duplicate = await findDuplicateUserEmail(userData.user.email, existing.username);
  if (duplicate) {
    sendJson(response, 409, { error: getUserInputErrorMessage(duplicate) });
    return;
  }

  if (existing.role === "admin" && userData.user.role !== "admin" && await isLastAdmin(existing.username)) {
    sendJson(response, 400, { error: "마지막 관리자 계정의 권한은 일반으로 변경할 수 없습니다." });
    return;
  }

  const user = {
    ...existing,
    email: userData.user.email,
    name: userData.user.name,
    passwordHash: userData.user.password ? hashPassword(userData.user.password) : existing.passwordHash,
    role: userData.user.role
  };
  await updateUser(user);

  if (session.sub.toLowerCase() === user.username.toLowerCase()) {
    setSessionCookie(response, user);
  }

  sendJson(response, 200, {
    user: publicUser(user)
  });
}

async function handleSaveCalendarData(request, response, session) {
  const body = await readJsonBody(request, 1_000_000);
  const data = normalizeCalendarData(body);
  await saveCalendarData(session.sub, data);
  sendJson(response, 200, { ok: true });
}

async function readBody(request, maxBytes = 1_000_000) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Request body too large");
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody(request, maxBytes) {
  const body = await readBody(request, maxBytes);
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
  if (DATABASE_URL) {
    await ensureDatabaseUserStore();
    return;
  }

  await ensureFileUserStore();
}

async function ensureDatabaseUserStore() {
  dbPool = new Pool({
    connectionString: DATABASE_URL
  });

  await withDatabaseRetry(async () => {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await dbPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''");
    await dbPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT ''");
    await dbPool.query("CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email)) WHERE email <> ''");
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS calendar_data (
        username TEXT PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const adminResult = await dbPool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
    if (adminResult.rowCount === 0) {
      await dbPool.query(
        "INSERT INTO users (username, password_hash, name, email, role, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT (username) DO NOTHING",
        [USERNAME, hashPassword(PASSWORD), "관리자", "", "admin"]
      );
    }
  });
}

async function withDatabaseRetry(task) {
  let lastError = null;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      console.warn(`Database is not ready yet. Retry ${attempt}/20.`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw lastError;
}

async function ensureFileUserStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(USERS_FILE);
  } catch {
    const initialAdmin = {
      createdAt: new Date().toISOString(),
      email: "",
      name: "관리자",
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
      email: "",
      name: "관리자",
      passwordHash: hashPassword(PASSWORD),
      role: "admin",
      username: USERNAME
    });
    await saveUsers(users);
  }
}

async function loadUsers() {
  if (dbPool) {
    const result = await dbPool.query(
      "SELECT username, password_hash, name, email, role, created_at FROM users ORDER BY created_at ASC, username ASC"
    );
    return result.rows.map((row) => ({
      createdAt: row.created_at.toISOString(),
      email: row.email || "",
      name: row.name || "",
      passwordHash: row.password_hash,
      role: row.role,
      username: row.username
    }));
  }

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
  if (dbPool) {
    throw new Error("saveUsers is not supported for database user store");
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`);
}

async function findUser(username) {
  const normalized = normalizeUsername(username);
  if (dbPool) {
    const result = await dbPool.query(
      "SELECT username, password_hash, name, email, role, created_at FROM users WHERE lower(username) = lower($1) LIMIT 1",
      [normalized]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      createdAt: row.created_at.toISOString(),
      email: row.email || "",
      name: row.name || "",
      passwordHash: row.password_hash,
      role: row.role,
      username: row.username
    };
  }

  const users = await loadUsers();
  return users.find((user) => user.username.toLowerCase() === normalized.toLowerCase());
}

async function createUser(user) {
  if (dbPool) {
    await dbPool.query(
      "INSERT INTO users (username, password_hash, name, email, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [user.username, user.passwordHash, user.name, user.email, user.role, user.createdAt]
    );
    return;
  }

  const users = await loadUsers();
  users.push(user);
  await saveUsers(users);
}

async function updateUser(user) {
  if (dbPool) {
    await dbPool.query(
      "UPDATE users SET password_hash = $1, name = $2, email = $3, role = $4 WHERE lower(username) = lower($5)",
      [user.passwordHash, user.name, user.email, user.role, user.username]
    );
    return;
  }

  const users = await loadUsers();
  const index = users.findIndex((item) => item.username.toLowerCase() === user.username.toLowerCase());
  if (index === -1) return;
  users[index] = user;
  await saveUsers(users);
}

async function isLastAdmin(username) {
  const users = await loadUsers();
  return users.filter((user) => user.role === "admin" && user.username.toLowerCase() !== username.toLowerCase()).length === 0;
}

function publicUser(user) {
  return {
    createdAt: user.createdAt,
    email: user.email || "",
    name: user.name || "",
    role: user.role,
    username: user.username
  };
}

async function loadCalendarData(username) {
  return (await loadCalendarDataRecord(username)).data;
}

async function loadCalendarDataRecord(username) {
  const storageUsername = getStorageUsername(username);
  if (dbPool) {
    const result = await dbPool.query(
      "SELECT data FROM calendar_data WHERE lower(username) = lower($1) LIMIT 1",
      [storageUsername]
    );
    return {
      data: normalizeCalendarData(result.rows[0]?.data || {}),
      exists: result.rowCount > 0
    };
  }

  const calendarData = await loadCalendarDataFile();
  return {
    data: normalizeCalendarData(calendarData[storageUsername] || {}),
    exists: Object.prototype.hasOwnProperty.call(calendarData, storageUsername)
  };
}

async function saveCalendarData(username, data) {
  const storageUsername = getStorageUsername(username);
  const normalizedData = normalizeCalendarData(data);
  if (dbPool) {
    await dbPool.query(
      `INSERT INTO calendar_data (username, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (username)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [storageUsername, normalizedData]
    );
    return;
  }

  const calendarData = await loadCalendarDataFile();
  calendarData[storageUsername] = normalizedData;
  await saveCalendarDataFile(calendarData);
}

async function loadCalendarDataFile() {
  try {
    const data = await fs.readFile(CALENDAR_DATA_FILE, "utf8");
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function saveCalendarDataFile(calendarData) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CALENDAR_DATA_FILE, `${JSON.stringify(calendarData, null, 2)}\n`);
}

function getStorageUsername(username) {
  return normalizeUsername(username).toLowerCase();
}

function normalizeCalendarData(data) {
  const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  return {
    holidays: Array.isArray(source.holidays) ? source.holidays.map(String) : [],
    shifts: Array.isArray(source.shifts) ? source.shifts.map(normalizeShiftData).filter(Boolean) : [],
    tagColors: normalizePlainObject(source.tagColors),
    tagMealSettings: normalizePlainObject(source.tagMealSettings),
    tagTargetMinutes: normalizePlainObject(source.tagTargetMinutes),
    weekClipboard: Array.isArray(source.weekClipboard) ? source.weekClipboard.map(normalizeWeekClipboardItem).filter(Boolean) : []
  };
}

function normalizeShiftData(shift) {
  if (!shift || typeof shift !== "object") return null;
  return {
    date: String(shift.date || ""),
    end: String(shift.end || ""),
    id: String(shift.id || crypto.randomUUID()),
    start: String(shift.start || ""),
    tag: String(shift.tag || ""),
    title: String(shift.title || "")
  };
}

function normalizeWeekClipboardItem(item) {
  if (!item || typeof item !== "object") return null;
  const dayOffset = Number(item.dayOffset);
  if (!Number.isInteger(dayOffset)) return null;
  return {
    dayOffset,
    end: String(item.end || ""),
    start: String(item.start || ""),
    tag: String(item.tag || ""),
    title: String(item.title || "")
  };
}

function normalizePlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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

function normalizeName(name) {
  return String(name || "").trim();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidUsername(username) {
  return /^[A-Za-z0-9_.-]{3,40}$/.test(username);
}

function isValidName(name) {
  return name.length >= 1 && name.length <= 80;
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUserInput(input) {
  const username = normalizeUsername(input.username);
  const password = String(input.password || "");
  const name = normalizeName(input.name);
  const email = normalizeEmail(input.email);
  const role = String(input.role || "user");

  if (!isValidUsername(username)) return { error: "invalid_username" };
  if (password.length < 6) return { error: "invalid_password" };
  if (!isValidName(name)) return { error: "invalid_name" };
  if (!isValidEmail(email)) return { error: "invalid_email" };
  if (!ROLES.has(role)) return { error: "invalid_role" };

  return {
    user: {
      email,
      name,
      password,
      role,
      username
    }
  };
}

function validateUserUpdateInput(input) {
  const password = String(input.password || "");
  const name = normalizeName(input.name);
  const email = normalizeEmail(input.email);
  const role = String(input.role || "user");

  if (password && password.length < 6) return { error: "invalid_password" };
  if (!isValidName(name)) return { error: "invalid_name" };
  if (!isValidEmail(email)) return { error: "invalid_email" };
  if (!ROLES.has(role)) return { error: "invalid_role" };

  return {
    user: {
      email,
      name,
      password,
      role
    }
  };
}

async function findDuplicateUser(username, email) {
  const users = await loadUsers();
  if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    return "duplicate_username";
  }
  if (users.some((user) => String(user.email || "").toLowerCase() === email.toLowerCase())) {
    return "duplicate_email";
  }
  return "";
}

async function findDuplicateUserEmail(email, currentUsername) {
  const users = await loadUsers();
  if (users.some((user) => (
    user.username.toLowerCase() !== currentUsername.toLowerCase()
    && String(user.email || "").toLowerCase() === email.toLowerCase()
  ))) {
    return "duplicate_email";
  }
  return "";
}

function getUserInputErrorMessage(error) {
  const messages = {
    duplicate_email: "이미 사용 중인 이메일입니다.",
    duplicate_username: "이미 존재하는 아이디입니다.",
    invalid_email: "이메일 형식을 확인해주세요.",
    invalid_name: "이름은 1-80자로 입력해주세요.",
    invalid_password: "비밀번호는 6자 이상으로 입력해주세요.",
    invalid_role: "권한은 일반 또는 관리자만 선택할 수 있습니다.",
    invalid_username: "아이디는 영문, 숫자, 점, 밑줄, 하이픈 3-40자로 입력해주세요."
  };
  return messages[error] || "계정을 만들 수 없습니다.";
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
