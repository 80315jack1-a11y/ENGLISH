const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

// For portable mode: store user data next to the exe
const exeDir = path.dirname(app.getPath("exe"));
const userDataPath = path.join(exeDir, "english-vocab-data");
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}
app.setPath("userData", userDataPath);

let mainWindow;
let server;

const OUT_DIR = path.join(__dirname, "..", "out");

// Simple static file server
function startServer() {
  return new Promise((resolve) => {
    const mimeTypes = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".txt": "text/plain",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
    };

    server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split("?")[0]);

      // Try exact file
      let filePath = path.join(OUT_DIR, urlPath);

      // If path ends with / or has no extension, try as .html
      if (!path.extname(urlPath)) {
        // Try urlPath.html
        const htmlPath = path.join(OUT_DIR, urlPath + ".html");
        const indexPath = path.join(OUT_DIR, urlPath, "index.html");

        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath;
        } else if (fs.existsSync(indexPath)) {
          filePath = indexPath;
        } else if (fs.existsSync(path.join(OUT_DIR, urlPath + "/index.html"))) {
          filePath = path.join(OUT_DIR, urlPath + "/index.html");
        }
      }

      // Fallback to index.html for client-side routing
      if (!fs.existsSync(filePath)) {
        filePath = path.join(OUT_DIR, "index.html");
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = mimeTypes[ext] || "application/octet-stream";

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { "Content-Type": mime });
        res.end(content);
      } catch (err) {
        res.writeHead(404);
        res.end("Not Found");
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve(port);
    });
  });
}

async function createWindow() {
  const port = await startServer();

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    title: "英文單字卡",
    icon: path.join(__dirname, "..", "public", "icons", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      partition: "persist:vocab",
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) server.close();
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
