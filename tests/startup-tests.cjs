const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { createRequire } = require("node:module");
const dep = createRequire(path.resolve(__dirname, "../package.json"));
const { IDBFactory } = dep("fake-indexeddb");
const ext = path.resolve(__dirname, "../extension");
const src = (name) => fs.readFileSync(path.join(ext, name), "utf8");
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = [];
async function until(fn) {
  for (let i = 0; i < 160; i++) {
    if (await fn()) return;
    await pause(10);
  }
  throw Error("Timed out");
}
async function test(name, fn) {
  try {
    await fn();
    log.push({ name, result: "PASS" });
    console.log("PASS " + name);
  } catch (error) {
    log.push({ name, result: "FAIL", error: error.stack });
    console.error("FAIL " + name + "\n" + error.stack);
    process.exitCode = 1;
  }
}
function worker(database = new IDBFactory()) {
  let listener;
  const sw = vm.createContext({
    console,
    URL,
    Date,
    setTimeout,
    clearTimeout,
    crypto: webcrypto,
    indexedDB: database,
  });
  sw.self = sw;
  sw.chrome = {
    runtime: {
      id: "test-extension",
      getURL: (p) => "chrome-extension://test-extension/" + p,
      onMessage: { addListener: (f) => (listener = f) },
    },
    tabs: {
      get: async () => ({
        id: 7,
        active: true,
        url: "https://example.test/booking",
      }),
      query: async () => [{ id: 7 }],
      captureVisibleTab: async () => "data:image/jpeg;base64,AAA=",
      create: async () => ({ id: 8 }),
    },
  };
  sw.importScripts = (...files) =>
    files.forEach((f) => vm.runInContext(src(f), sw, { filename: f }));
  vm.runInContext(src("background.js"), sw, { filename: "background.js" });
  const messages = [];
  return {
    sw,
    messages,
    sendMessage(message, reply, sender) {
      messages.push(message.type);
      const result = listener(
        JSON.parse(JSON.stringify(message)),
        sender || {
          id: "test-extension",
          url: "https://example.test/booking",
          frameId: 0,
          tab: { id: 7, windowId: 1 },
        },
        (response) => reply(JSON.parse(JSON.stringify(response))),
      );
      assert.equal(
        result,
        true,
        "The shipped listener must keep the callback channel open",
      );
    },
  };
}
(async () => {
  const { Window } = await import(dep.resolve("happy-dom"));
  const windows = [];
  function page(backend) {
    const w = new Window({
      url: "https://example.test/booking",
      width: 1000,
      height: 700,
      settings: {
        disableJavaScriptFileLoading: true,
        disableCSSFileLoading: true,
      },
    });
    require("./shadow-inspector.cjs")(w);
    windows.push(w);
    w.document.body.innerHTML =
      '<main><h1>予約カレンダー</h1><button id="book">新しい予約</button></main>';
    w.document.getElementById("book").getBoundingClientRect = () => ({
      x: 50,
      y: 100,
      width: 200,
      height: 40,
    });
    w.chrome = {
      runtime: { sendMessage: (m, reply) => backend.sendMessage(m, reply) },
    };
    w.eval(src("core.js"));
    w.eval(src("client.js"));
    return w;
  }
  const panel = (w) =>
    w.testShadow(w.document.getElementById("__review_desk_1"));
  await test("初期化の応答待ちには箇所指定を開始できない", async () => {
    const bg = worker(),
      active = bg.sw.ReviewDB.active;
    let release;
    bg.sw.ReviewDB.active = () =>
      new Promise((resolve) => (release = () => active().then(resolve)));
    const w = page(bg),
      opening = w.eval(src("content.js")),
      sh = panel(w);
    assert.ok(sh.getElementById("body").textContent.includes("準備"));
    assert.equal(sh.querySelector('[data-mode="element"]').disabled, true);
    sh.querySelector('[data-mode="element"]').click();
    w.document.getElementById("book").click();
    assert.ok(!bg.messages.includes("CAPTURE"));
    release();
    assert.equal((await opening).ok, true);
    assert.equal(sh.querySelector('[data-mode="element"]').disabled, false);
  });
  await test("初回の接続失敗は読み取りだけを一度再試行する", async () => {
    const bg = worker(),
      active = bg.sw.ReviewDB.active;
    let calls = 0;
    bg.sw.ReviewDB.active = async () => {
      if (++calls === 1) throw Error("Temporary startup failure");
      return active();
    };
    const w = page(bg);
    assert.equal((await w.eval(src("content.js"))).ok, true);
    assert.equal(calls, 2);
    assert.ok(panel(w).getElementById("role"));
    assert.deepEqual(bg.messages, ["CONTEXT", "CONTEXT", "LIST"]);
  });
  await test("初期化失敗後も空白にならず再試行と原因が表示される", async () => {
    const bg = worker();
    bg.sw.ReviewDB.active = async () => {
      throw Error("Storage unavailable");
    };
    const w = page(bg);
    assert.equal((await w.eval(src("content.js"))).ok, false);
    const sh = panel(w);
    assert.ok(sh.getElementById("retry"));
    assert.ok(
      sh.getElementById("body").textContent.includes("BACKGROUND_CONTEXT"),
    );
    sh.querySelector('[data-mode="element"]').click();
    w.document.getElementById("book").click();
    await pause(180);
    assert.ok(!sh.textContent.includes("Cannot read properties of undefined"));
    assert.ok(!bg.messages.includes("CAPTURE"));
  });
  await test("再試行からコメント入力・自動保存・再起動まで進める", async () => {
    const bg = worker(),
      active = bg.sw.ReviewDB.active;
    bg.sw.ReviewDB.active = async () => {
      throw Error("Temporary failure");
    };
    const w = page(bg);
    await w.eval(src("content.js"));
    bg.sw.ReviewDB.active = active;
    let sh = panel(w);
    sh.getElementById("retry").click();
    await until(() => sh.getElementById("role"));
    sh.querySelector('[data-mode="element"]').click();
    w.document.getElementById("book").click();
    await until(() => sh.getElementById("memo"));
    sh.getElementById("memo").value = "ここに担当者の写真を追加";
    sh.getElementById("memo").dispatchEvent(new w.Event("input"));
    await until(() =>
      sh.getElementById("status").textContent.includes("保存済み"),
    );
    const p = await active(),
      before = await bg.sw.ReviewDB.bundle(p.id);
    assert.equal(before.notes[0].memo, "ここに担当者の写真を追加");
    assert.equal(before.notes[0].screenshot, "data:image/jpeg;base64,AAA=");
    sh.getElementById("close").click();
    await until(() => !w.document.getElementById("__review_desk_1"));
    await w.eval(src("content.js"));
    sh = panel(w);
    assert.equal(sh.querySelectorAll(".noteitem").length, 1);
    const after = await bg.sw.ReviewDB.bundle(p.id);
    assert.equal(after.notes[0].id, before.notes[0].id);
    assert.equal(after.notes[0].memo, before.notes[0].memo);
  });
  await test("空の打ち合わせ応答を成功扱いにせず再試行できる", async () => {
    const bg = worker();
    bg.sw.ReviewDB.active = async () => undefined;
    const w = page(bg);
    assert.equal((await w.eval(src("content.js"))).ok, false);
    assert.ok(panel(w).textContent.includes("EMPTY_CONTEXT"));
    assert.ok(panel(w).getElementById("retry"));
  });
  await test("一覧の読み込み失敗でも既存の会議を維持して再試行できる", async () => {
    const bg = worker(),
      bundle = bg.sw.ReviewDB.bundle,
      p = await bg.sw.ReviewDB.active();
    bg.sw.ReviewDB.bundle = async () => {
      throw Error("List unavailable");
    };
    const w = page(bg);
    await w.eval(src("content.js"));
    assert.ok(panel(w).textContent.includes("保存済みメモの読み込み"));
    bg.sw.ReviewDB.bundle = bundle;
    panel(w).getElementById("retry").click();
    await until(() => panel(w).getElementById("role"));
    assert.equal((await bg.sw.ReviewDB.active()).id, p.id);
  });
  await test("拡張機能を更新した古い画面には再読み込みを案内する", async () => {
    const w = page(worker());
    w.chrome.runtime.sendMessage = () => {
      throw Error("Extension context invalidated.");
    };
    await w.eval(src("content.js"));
    assert.ok(panel(w).textContent.includes("Webページを再読み込み"));
    assert.ok(panel(w).getElementById("retry"));
  });
  await test("通信が無応答の場合は待機を終え、遅い返答を二重処理しない", async () => {
    const w = page(worker());
    let callback;
    w.chrome.runtime.sendMessage = (m, reply) => (callback = reply);
    await assert.rejects(
      w.ReviewClient.request("CONTEXT", {}, { timeout: 20 }),
      (error) => error.code === "TIMEOUT_CONTEXT",
    );
    callback({ ok: true, data: { id: "late" } });
  });
  await test("Chromeが返す通信エラーを読み込んで日本語で案内する", async () => {
    const w = page(worker());
    w.chrome.runtime.sendMessage = (m, reply) => {
      w.chrome.runtime.lastError = { message: "Receiving end does not exist." };
      reply();
      delete w.chrome.runtime.lastError;
    };
    await assert.rejects(
      w.ReviewClient.request("CONTEXT"),
      (error) =>
        error.code === "RUNTIME_CONTEXT" &&
        error.message.includes("再読み込み"),
    );
  });
  await test("送信元の情報欠落は理由付きで拒否し内部例外にしない", async () => {
    const bg = worker();
    await assert.rejects(
      bg.sw.reviewMessage({ type: "CONTEXT" }, undefined),
      /拡張機能からの操作を確認/,
    );
  });
  await test("再度アイコンから開いた場合も初期化のやり直しに進める", async () => {
    const bg = worker(),
      active = bg.sw.ReviewDB.active;
    bg.sw.ReviewDB.active = async () => {
      throw Error("Temporary failure");
    };
    const w = page(bg);
    await w.eval(src("content.js"));
    bg.sw.ReviewDB.active = active;
    const reopened = await w.eval(src("content.js"));
    assert.equal(reopened.ok, true);
    assert.ok(panel(w).getElementById("role"));
  });
  await test("ポップアップは保存先とパネルの準備が完了するまで待つ", async () => {
    const bg = worker(),
      w = page(bg),
      popup = page(bg);
    let closed = false,
      injected = false,
      release;
    popup.document.body.innerHTML =
      '<button id="start"></button><button id="desk"></button><p id="message"></p>';
    popup.close = () => (closed = true);
    popup.chrome.tabs = {
      query: async () => [{ id: 7, url: w.location.href }],
      create: async () => {},
    };
    popup.chrome.scripting = {
      executeScript: async (spec) => {
        injected = true;
        assert.deepEqual(Array.from(spec.files), [
          "core.js",
          "client.js",
          "content.js",
        ]);
        await new Promise((resolve) => (release = resolve));
        return [{ frameId: 0, result: await w.eval(src("content.js")) }];
      },
    };
    popup.eval(src("popup.js"));
    popup.document.getElementById("start").click();
    await until(() => injected);
    assert.equal(closed, false);
    release();
    await until(() => closed);
    assert.ok(panel(w).getElementById("role"));
  });
  await test("ポップアップで準備が失敗した場合は空のパネルを注入しない", async () => {
    const bg = worker();
    bg.sw.ReviewDB.active = async () => {
      throw Error("Storage unavailable");
    };
    const popup = page(bg);
    popup.document.body.innerHTML =
      '<button id="start"></button><button id="desk"></button><p id="message"></p>';
    popup.chrome.tabs = {
      query: async () => [{ id: 7, url: popup.location.href }],
    };
    popup.chrome.scripting = {
      executeScript: async () => {
        throw Error("must not inject");
      },
    };
    popup.eval(src("popup.js"));
    popup.document.getElementById("start").click();
    await until(() => !popup.document.getElementById("start").disabled);
    assert.ok(
      popup.document
        .getElementById("message")
        .textContent.includes("Storage unavailable"),
    );
    assert.ok(!popup.document.getElementById("__review_desk_1"));
  });
  for (const w of windows) await w.happyDOM.close();
  fs.writeFileSync(
    path.join(__dirname, "../reports/startup-tests.json"),
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        tests: log,
        limitations: [
          "Node VM, simulated DOM and IndexedDB, mocked Chrome boundary. The real Mac startup failure is not yet identified; failed-startup handling is reproduced and verified.",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    `\n${log.filter((x) => x.result === "PASS").length}/${log.length} PASS`,
  );
})();
