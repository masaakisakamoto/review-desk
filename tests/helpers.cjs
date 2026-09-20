const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { IDBFactory } = require("fake-indexeddb");
const JSZip = require("jszip");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const extension = path.resolve(__dirname, "../extension");
const source = (name) => fs.readFileSync(path.join(extension, name), "utf8");
function database(indexedDB = new IDBFactory(), extra = {}) {
  const ctx = vm.createContext({
    self: null,
    crypto: webcrypto,
    indexedDB,
    console,
    Date,
    URL,
    setTimeout,
    clearTimeout,
    structuredClone,
    ...extra,
  });
  ctx.self = ctx;
  vm.runInContext(source("core.js"), ctx);
  vm.runInContext(source("db.js"), ctx);
  return ctx;
}
const cap = {
  url: "https://example.test/studio?demo=1",
  title: "Fictional demo",
  screen: "Studio",
  role: "未指定",
  kind: "text",
  viewport: { width: 1000, height: 700, dpr: 1 },
  rect: { x: 40, y: 200, width: 250, height: 60 },
  scroll: { x: 0, y: 0 },
  target: { selector: "#explore", tag: "button", text: "詳しくはこちら" },
  userAgent: "Test fixture",
};
function picture(label = "SYNTHETIC TEST IMAGE") {
  const canvas = createCanvas(1000, 700),
    ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f1eb";
  ctx.fillRect(0, 0, 1000, 700);
  ctx.fillStyle = "#292c2d";
  ctx.font = "28px sans-serif";
  ctx.fillText(label, 40, 60);
  ctx.fillRect(40, 200, 250, 60);
  return canvas.toDataURL("image/png");
}
function exporter(core) {
  const context = vm.createContext({
    self: null,
    ReviewCore: core,
    JSZip,
    Image: class {
      set src(s) {
        this.loaded = loadImage(s).then((i) => (this.native = i));
      }
      async decode() {
        await this.loaded;
      }
      get naturalWidth() {
        return this.native.width;
      }
      get naturalHeight() {
        return this.native.height;
      }
    },
    console,
    setTimeout: () => 0,
    Blob,
    URL: {
      createObjectURL: (blob) => {
        context.output = blob;
        return "blob:test";
      },
      revokeObjectURL() {},
    },
    document: {
      body: { append() {} },
      createElement: (tag) => {
        if (tag === "a") return { click() {}, remove() {} };
        const canvas = createCanvas(1, 1),
          original = canvas.getContext.bind(canvas);
        canvas.getContext = (...args) => {
          const ctx = original(...args),
            draw = ctx.drawImage.bind(ctx);
          ctx.drawImage = (image, ...rest) =>
            draw(image.native || image, ...rest);
          return ctx;
        };
        return canvas;
      },
    },
  });
  context.self = context;
  vm.runInContext(source("export.js"), context);
  return context;
}
async function until(fn, message = "timed out") {
  for (let i = 0; i < 150; i++) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw Error(message);
}
module.exports = { source, database, cap, picture, exporter, until };
