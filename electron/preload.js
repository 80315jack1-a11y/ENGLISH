const { contextBridge } = require("electron");
const path = require("path");
const fs = require("fs");

// Use APPDATA for persistent storage
const dataDir = path.join(
  process.env.APPDATA || path.join(require("os").homedir(), "AppData", "Roaming"),
  "english-vocab-app"
);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dataFile = path.join(dataDir, "vocab-data.json");

function readData() {
  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Failed to read data file:", e);
  }
  return null;
}

function writeData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to write data file:", e);
    return false;
  }
}

// Expose file-based storage API to renderer
contextBridge.exposeInMainWorld("electronStore", {
  get: (key) => {
    const data = readData() || {};
    return data[key] || null;
  },
  set: (key, value) => {
    const data = readData() || {};
    data[key] = value;
    return writeData(data);
  },
  remove: (key) => {
    const data = readData() || {};
    delete data[key];
    return writeData(data);
  },
  getAll: () => {
    return readData() || {};
  },
});

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
});
