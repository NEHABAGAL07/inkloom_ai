const fs = require("fs");

if (process.platform === "win32") {
  const patchMkdir = (obj) => {
    if (!obj || !obj.mkdir) return;
    const orig = obj.mkdir;
    obj.mkdir = async function (...args) {
      for (let i = 0; i < 20; i++) {
        try {
          return await orig.apply(this, args);
        } catch (e) {
          if (e && (e.code === "EPERM" || e.code === "EBUSY") && i < 19) {
            await new Promise((r) => setTimeout(r, 50 * (i + 1)));
            continue;
          }
          throw e;
        }
      }
    };
  };

  try {
    patchMkdir(fs.promises);
  } catch {}
  try {
    patchMkdir(require("fs/promises"));
  } catch {}
  try {
    patchMkdir(require("node:fs/promises"));
  } catch {}

  const origMkdirSync = fs.mkdirSync;
  fs.mkdirSync = function (...args) {
    for (let i = 0; i < 20; i++) {
      try {
        return origMkdirSync.apply(this, args);
      } catch (e) {
        if (e && (e.code === "EPERM" || e.code === "EBUSY") && i < 19) {
          const start = Date.now();
          while (Date.now() - start < 50 * (i + 1)) {}
          continue;
        }
        throw e;
      }
    }
  };
}
