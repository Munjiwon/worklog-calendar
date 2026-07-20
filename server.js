const crypto = require("crypto");
const fs = require("fs/promises");
const http = require("http");
const path = require("path");
const querystring = require("querystring");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const USERNAME = process.env.WORKLOG_USERNAME || "admin";
const PASSWORD = process.env.WORKLOG_PASSWORD || "worklog";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-session-secret";
const SESSION_COOKIE = "worklog_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const PUBLIC_PATHS = new Set(["/login", "/login.html", "/styles.css", "/favicon.ico"]);

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

    if (pathname === "/health") {
      sendText(response, 200, "ok");
      return;
    }

    if (request.method === "GET" && (pathname === "/login" || pathname === "/login.html")) {
      if (isAuthenticated(request)) {
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

    if (request.method === "POST" && pathname === "/logout") {
      clearSessionCookie(response);
      redirect(response, "/login");
      return;
    }

    if (!PUBLIC_PATHS.has(pathname) && !isAuthenticated(request)) {
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

server.listen(PORT, () => {
  console.log(`Worklog calendar listening on http://0.0.0.0:${PORT}`);
});

async function handleLogin(request, response) {
  const body = querystring.parse(await readBody(request));
  const username = String(body.username || "");
  const password = String(body.password || "");

  if (safeEqual(username, USERNAME) && safeEqual(password, PASSWORD)) {
    setSessionCookie(response, username);
    redirect(response, "/");
    return;
  }

  redirect(response, "/login?error=1");
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
  const cookies = parseCookies(request.headers.cookie || "");
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(sign(payload), signature)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.sub === USERNAME && Number(session.exp) > Date.now();
  } catch {
    return false;
  }
}

function setSessionCookie(response, username) {
  const payload = Buffer.from(JSON.stringify({
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    sub: username
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
