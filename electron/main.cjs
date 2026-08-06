const { app, BrowserWindow, shell, protocol, session } = require("electron");
const path = require("path");
const fs = require("fs");
const url = require("url");

let mainWindow = null;

// Serve the packaged app over a custom "app://" protocol instead of file://.
// file:// blocks cross-origin fetch() to https:// by default; app:// with
// CORS headers + webSecurity lets the Supabase client call the backend normally.
const APP_PROTOCOL = "app";

function registerAppProtocol(distDir) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);

  app.whenReady().then(() => {
    protocol.handle(APP_PROTOCOL, (request) => {
      let requestPath = new URL(request.url).pathname;
      if (requestPath === "/" || requestPath === "") requestPath = "/index.html";

      // Decode and resolve safely inside the dist directory
      const decoded = decodeURIComponent(requestPath);
      const filePath = path.join(distDir, decoded);

      // Prevent path traversal
      if (!filePath.startsWith(distDir)) {
        return new Response("Forbidden", { status: 403 });
      }

      try {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".mjs": "text/javascript",
          ".css": "text/css",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
          ".webp": "image/webp",
          ".ico": "image/x-icon",
          ".woff": "font/woff",
          ".woff2": "font/woff2",
          ".ttf": "font/ttf",
          ".eot": "application/vnd.ms-fontobject",
          ".pdf": "application/pdf",
        };
        const mimeType = mimeTypes[ext] || "application/octet-stream";
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Length": String(buffer.length),
            "Cache-Control": "no-cache",
          },
        });
      } catch (err) {
        return new Response("Not Found", { status: 404 });
      }
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Antilles Legal",
    backgroundColor: "#f8fafc",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // Load via custom protocol — cross-origin fetch to https:// works.
    mainWindow.loadURL(`${APP_PROTOCOL}://./index.html`);
  }

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Register protocol before app is ready
const distDir = path.join(__dirname, "..", "dist");
registerAppProtocol(distDir);

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
