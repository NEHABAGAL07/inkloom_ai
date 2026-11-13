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

  const origMkdir = fs.mkdir;
  fs.mkdir = function (...args) {
    const callback = typeof args[args.length - 1] === "function" ? args[args.length - 1] : null;
    if (!callback) return origMkdir.apply(this, args);
    const otherArgs = args.slice(0, args.length - 1);
    const retry = (attempt) => {
      origMkdir.apply(fs, [
        ...otherArgs,
        (err, res) => {
          if (err && (err.code === "EPERM" || err.code === "EBUSY") && attempt < 19) {
            setTimeout(() => retry(attempt + 1), 50 * (attempt + 1));
            return;
          }
          callback(err, res);
        },
      ]);
    };
    retry(0);
  };
}
