const fs = require("fs");

if (process.platform === "win32") {
  const origMkdir = fs.promises.mkdir;
  fs.promises.mkdir = async function (...args) {
    for (let i = 0; i < 15; i++) {
      try {
        return await origMkdir.apply(this, args);
      } catch (e) {
        if (e && e.code === "EPERM" && i < 14) {
          await new Promise((r) => setTimeout(r, 60 * (i + 1)));
          continue;
        }
        throw e;
      }
    }
  };

  const origMkdirSync = fs.mkdirSync;
  fs.mkdirSync = function (...args) {
    for (let i = 0; i < 15; i++) {
      try {
        return origMkdirSync.apply(this, args);
      } catch (e) {
        if (e && e.code === "EPERM" && i < 14) {
          const start = Date.now();
          while (Date.now() - start < 60 * (i + 1)) {}
          continue;
        }
        throw e;
      }
    }
  };
}

