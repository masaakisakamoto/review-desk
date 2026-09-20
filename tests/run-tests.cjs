const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { createRequire } = require("node:module");
const dep = createRequire(path.resolve(__dirname, "../package.json"));
const { IDBFactory } = dep("fake-indexeddb");
const JSZip = require("jszip");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const ext = path.resolve(__dirname, "../extension");
const src = (name) => fs.readFileSync(path.join(ext, name), "utf8");
const log = [];
async function test(name, fn) {
  try {
    await fn();
    log.push({ name, result: "PASS" });
    console.log("PASS " + name);
  } catch (e) {
    log.push({ name, result: "FAIL", error: e.stack });
    console.error("FAIL " + name + "\n" + e.stack);
    process.exitCode = 1;
  }
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, label) {
  for (let i = 0; i < 100; i++) {
    if (await fn()) return;
    await pause(10);
  }
  throw Error("Timed out: " + label);
}
const shotCanvas = createCanvas(1000, 700);
shotCanvas.getContext("2d").fillStyle = "#f2f4ed";
shotCanvas.getContext("2d").fillRect(0, 0, 1000, 700);
const jpeg = shotCanvas.toDataURL("image/jpeg");
const cap = {
  url: "https://example.test/booking?token=secret#day",
  title: "予約",
  screen: "予約カレンダー",
  role: "クライアント",
  kind: "text",
  viewport: { width: 1000, height: 700, dpr: 1 },
  rect: { x: 200, y: 100, width: 250, height: 80 },
  scroll: { x: 0, y: 0 },
  target: { selector: "#book", tag: "button", text: "予約を確定する" },
  userAgent: "test",
};
const ctx = vm.createContext({
  self: {},
  crypto: webcrypto,
  indexedDB: new IDBFactory(),
  console,
  Date,
  URL,
  setTimeout,
  clearTimeout,
  structuredClone,
});
ctx.self = ctx;
vm.runInContext(src("core.js"), ctx);
vm.runInContext(src("db.js"), ctx);
const C = ctx.ReviewCore,
  D = ctx.ReviewDB;
(async () => {
  let p, n;
  await test("URLからクエリと資格情報を除去する", () => {
    assert.equal(
      C.safeUrl("https://u:p@example.test/a?token=SECRET#view"),
      "https://example.test/a#view",
    );
    assert.equal(C.safeUrl("javascript:alert(1)"), "");
    assert.equal(
      C.safeUrl("https://example.test/#token=SECRET"),
      "https://example.test/",
    );
  });
  await test("危険なHTMLが文字列としてエスケープされる", () =>
    assert.equal(
      C.esc('<img src=x onerror="x">'),
      "&lt;img src=x onerror=&quot;x&quot;&gt;",
    ));
  await test("SVGと非画像データは添付できない", () => {
    assert.throws(() => C.imageData("data:image/svg+xml;base64,AAA="));
    assert.throws(() => C.imageData("https://track.example.test/pixel"));
  });
  await test("初回の打ち合わせ作成と永続IDの再利用", async () => {
    p = await D.active();
    assert.equal((await D.active()).id, p.id);
  });
  await test("画面・役割・画像をまとめて保存できる", async () => {
    n = await D.createNote(p.id, cap, jpeg);
    assert.equal(n.code, "R-0001");
    assert.equal(n.url, "https://example.test/booking#day");
    assert.equal((await D.get("notes", n.id)).screenshot, jpeg);
  });
  await test("並行作成でも指摘番号が重複しない", async () => {
    const ns = await Promise.all(
      Array.from({ length: 5 }, () => D.createNote(p.id, cap, jpeg)),
    );
    assert.equal(new Set(ns.map((n) => n.code)).size, 5);
  });
  await test("空の依頼は修正確定にできない", async () => {
    await assert.rejects(D.updateNote(n.id, n.revision, { status: "decided" }));
    assert.equal((await D.get("notes", n.id)).revision, n.revision);
  });
  await test("文章修正と状態を保存して再読込できる", async () => {
    n = await D.updateNote(n.id, n.revision, {
      memo: "ボタン名を変更",
      replacement: "この内容で予約確定",
      status: "decided",
    });
    const re = await D.get("notes", n.id);
    assert.equal(re.replacement, "この内容で予約確定");
    assert.equal(re.history.length, 1);
  });
  await test("別画面からの古い更新を拒否し最新データを保持", async () => {
    await assert.rejects(D.updateNote(n.id, 1, { memo: "stale" }), /別の画面/);
    assert.equal((await D.get("notes", n.id)).memo, "ボタン名を変更");
  });
  await test("ごみ箱は復元できる", async () => {
    n = await D.updateNote(n.id, n.revision, { deleted: true });
    assert.equal(n.deleted, true);
    n = await D.updateNote(n.id, n.revision, { deleted: false });
    assert.equal(n.deleted, false);
  });
  await test("画面の確認記録が役割別に独立している", async () => {
    await D.check(p.id, cap, true);
    await D.check(p.id, { ...cap, role: "デザイナー" }, false);
    const b = await D.bundle(p.id);
    assert.equal(b.checks.length, 2);
    assert.equal(b.checks.filter((c) => c.checked).length, 1);
  });
  await test("確定・相談・保留・完了を依頼文で区別する", async () => {
    const a = {
        ...n,
        id: "a",
        code: "R-0100",
        status: "hold",
        memo: "保留の変更",
      },
      d = {
        ...n,
        id: "b",
        code: "R-0101",
        status: "discuss",
        memo: "相談の変更",
      },
      f = {
        ...n,
        id: "c",
        code: "R-0102",
        progress: "done",
        memo: "完了の変更",
      };
    const md = C.requestMarkdown(p, [n, a, d, f], []);
    const active = md.split("## 今回の実装対象外")[0];
    assert.ok(active.includes("この内容で予約確定"));
    assert.ok(!active.includes("保留の変更"));
    assert.ok(!active.includes("相談の変更"));
    assert.ok(!active.includes("完了の変更"));
  });
  await test("バックアップの読み込みは別の打ち合わせに復元する", async () => {
    const b = await D.bundle(p.id);
    const restored = await D.restore(b);
    assert.notEqual(restored.id, p.id);
    const nb = await D.bundle(restored.id);
    assert.equal(nb.notes.length, b.notes.length);
    assert.equal((await D.bundle(p.id)).notes.length, b.notes.length);
    assert.equal(nb.notes[0].screenshot, jpeg);
  });
  await test("壊れたバックアップの読み込みが既存記録を変更しない", async () => {
    const prior = (await D.all("projects")).length;
    await assert.rejects(D.restore({ format: "wrong" }));
    assert.equal((await D.all("projects")).length, prior);
  });
  await test("重複番号を持つバックアップを拒否する", async () => {
    const b = await D.bundle(p.id);
    b.notes[1].code = b.notes[0].code;
    await assert.rejects(D.restore(b), /指摘番号/);
  });
  await test("画像付き再開後の番号が既存番号と衝突しない", async () => {
    const b = await D.bundle(p.id);
    b.notes[0].code = "R-0290";
    const r = await D.restore(b);
    const next = await D.createNote(r.id, cap, jpeg);
    assert.equal(next.code, "R-0291");
  });
  const chromeMock = {
    runtime: {
      id: "test-extension",
      getURL: (p) => "chrome-extension://test-extension/" + p,
      onMessage: { addListener: (f) => {} },
    },
    tabs: {
      get: async () => ({ id: 7, active: true, url: cap.url }),
      captureVisibleTab: async () => jpeg,
      query: async () => [{ id: 7 }],
      create: async () => ({}),
    },
  };
  ctx.chrome = chromeMock;
  ctx.importScripts = () => {};
  vm.runInContext(src("background.js"), ctx);
  const sender = {
    id: "test-extension",
    url: cap.url,
    frameId: 0,
    tab: { id: 7, windowId: 4 },
  };
  await test("表示中の同じタブだけを撮影できる", async () =>
    assert.equal(
      (await ctx.reviewMessage({ type: "CAPTURE" }, sender)).screenshot,
      jpeg,
    ));
  await test("他拡張・iframeからの要求は拒否する", async () => {
    await assert.rejects(
      ctx.reviewMessage({ type: "CONTEXT" }, { ...sender, id: "other" }),
    );
    await assert.rejects(
      ctx.reviewMessage({ type: "CONTEXT" }, { ...sender, frameId: 1 }),
    );
  });
  await test("撮影中にアクティブタブが変わったら画像を採用しない", async () => {
    chromeMock.tabs.query = async () => [{ id: 99 }];
    await assert.rejects(
      ctx.reviewMessage({ type: "CAPTURE" }, sender),
      /タブが変わりました/,
    );
    chromeMock.tabs.query = async () => [{ id: 7 }];
  });
  await test("非アクティブなタブから撮影を要求できない", async () => {
    chromeMock.tabs.get = async () => ({ active: false, url: cap.url });
    await assert.rejects(ctx.reviewMessage({ type: "CAPTURE" }, sender));
    chromeMock.tabs.get = async () => ({ active: true, url: cap.url });
  });
  const { Window } = await import(dep.resolve("happy-dom"));
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
  w.indexedDB = new IDBFactory();
  w.document.body.innerHTML =
    '<main><h1>予約カレンダー</h1><button id="book">予約を確定する</button><p id="copy">担当デザイナーと相談して日程を決めましょう。</p><img id="photo" alt="デザイナー画像"></main>';
  w.eval(src("core.js"));
  w.eval(src("db.js"));
  let clicked = 0,
    captures = 0;
  w.document.getElementById("book").onclick = () => clicked++;
  for (const el of w.document.querySelectorAll("button,p,img"))
    el.getBoundingClientRect = () => ({
      x: 200,
      y: 100,
      width: 250,
      height: 80,
    });
  w.chrome = {
    runtime: {
      sendMessage: async (m) => {
        try {
          const d = w.ReviewDB;
          let data;
          switch (m.type) {
            case "CONTEXT":
              data = await d.active();
              break;
            case "PROJECT_ROLE":
              data = await d.updateProject(m.projectId, { role: m.role });
              break;
            case "LIST":
              data = (await d.bundle(m.projectId)).notes.filter(
                (n) => !n.deleted,
              );
              break;
            case "GET_NOTE":
              data = await d.get("notes", m.id);
              break;
            case "CAPTURE":
              assert.equal(
                w.document.getElementById("__review_desk_1").style.visibility,
                "hidden",
              );
              captures++;
              data = { screenshot: jpeg };
              break;
            case "CREATE_NOTE":
              data = await d.createNote(m.projectId, m.capture, m.screenshot);
              break;
            case "UPDATE_NOTE":
              data = await d.updateNote(m.id, m.revision, m.patch);
              break;
            case "CHECK":
              data = await d.check(m.projectId, m.capture, m.checked);
              break;
            case "OPEN_DESK":
              data = true;
              break;
            default:
              throw Error(m.type);
          }
          return { ok: true, data };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      },
    },
  };
  const legacyRequest = w.chrome.runtime.sendMessage;
  w.chrome.runtime.sendMessage = (m, reply) => {
    legacyRequest(m).then(reply);
  };
  w.eval(src("client.js"));
  let sh;
  await test("メモパネルが起動して役割を選べる（DOMテスト）", async () => {
    w.eval(src("content.js"));
    await until(
      () =>
        w
          .testShadow(w.document.getElementById("__review_desk_1"))
          ?.getElementById("role"),
      "panel",
    );
    sh = w.testShadow(w.document.getElementById("__review_desk_1"));
    assert.equal(w.document.getElementById("__review_desk_1").shadowRoot, null);
    const role = sh.getElementById("role");
    role.value = "クライアント";
    role.dispatchEvent(new w.Event("change"));
    await pause(20);
    assert.equal((await w.ReviewDB.active()).role, "クライアント");
  });
  await test("指定モードのクリックは予約操作を実行しない", async () => {
    sh.querySelector('[data-pick="element"]').click();
    w.document.getElementById("book").click();
    await until(() => sh.getElementById("memo"), "capture");
    assert.equal(clicked, 0);
    assert.equal(captures, 1);
    assert.equal(sh.getElementById("role").value, "クライアント");
  });
  await test("Element selection blocks bubbling pointer handlers on the target", async () => {
    let events = 0;
    const target = w.document.getElementById("book");
    target.addEventListener("pointerdown", () => events++);
    target.addEventListener("pointerup", () => events++);
    sh.querySelector('[data-mode="element"]').click();
    target.dispatchEvent(
      new w.PointerEvent("pointerdown", {
        isPrimary: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    target.dispatchEvent(
      new w.PointerEvent("pointerup", {
        isPrimary: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    assert.equal(events, 0);
    sh.querySelector('[data-mode="browse"]').click();
  });
  await test("短時間の連続入力を順番どおり自動保存する", async () => {
    const input = sh.getElementById("memo");
    for (const v of ["変", "変更", "変更してください"]) {
      input.value = v;
      input.dispatchEvent(new w.Event("input"));
    }
    await until(
      () => sh.getElementById("status").textContent.includes("保存済み"),
      "autosave",
    );
    const b = await w.ReviewDB.bundle((await w.ReviewDB.active()).id);
    assert.equal(b.notes[0].memo, "変更してください");
  });
  await test("確定したメモを保存し次の場所を指定できる", async () => {
    sh.getElementById("decision").value = "decided";
    sh.getElementById("decision").dispatchEvent(new w.Event("change"));
    sh.getElementById("save").click();
    await until(() => sh.querySelector('[data-pick="area"]'), "home");
    const b = await w.ReviewDB.bundle((await w.ReviewDB.active()).id);
    assert.equal(b.notes[0].status, "decided");
  });
  await test("範囲ドラッグの座標を保存する", async () => {
    sh.querySelector('[data-pick="area"]').click();
    w.document.body.dispatchEvent(
      new w.PointerEvent("pointerdown", {
        isPrimary: true,
        bubbles: true,
        clientX: 400,
        clientY: 180,
      }),
    );
    w.document.body.dispatchEvent(
      new w.PointerEvent("pointermove", {
        isPrimary: true,
        bubbles: true,
        clientX: 650,
        clientY: 300,
      }),
    );
    w.document.body.dispatchEvent(
      new w.PointerEvent("pointerup", {
        isPrimary: true,
        bubbles: true,
        clientX: 650,
        clientY: 300,
      }),
    );
    await until(() => sh.getElementById("memo"), "area");
    const b = await w.ReviewDB.bundle((await w.ReviewDB.active()).id);
    assert.equal(b.notes[1].rect.x, 400);
    assert.equal(b.notes[1].rect.width, 250);
    assert.equal(b.notes[1].rect.height, 120);
  });
  await test("空メモの確定失敗後も入力を続けて保存できる", async () => {
    const dec = sh.getElementById("decision");
    dec.value = "decided";
    dec.dispatchEvent(new w.Event("change"));
    assert.equal(dec.value, "discuss");
    const m = sh.getElementById("memo");
    m.value = "囲んだエリアを整理";
    m.dispatchEvent(new w.Event("input"));
    sh.getElementById("save").click();
    await until(() => sh.querySelector('[data-pick="element"]'), "recover");
  });
  await test("通常操作に戻るとサイトのボタンを押せる", async () => {
    sh.querySelector('[data-mode="browse"]').click();
    await pause(450);
    w.document.getElementById("book").click();
    assert.equal(clicked, 1);
  });
  await test("閉じて再起動しても保存したメモが残る", async () => {
    sh.getElementById("close").click();
    await until(() => !w.document.getElementById("__review_desk_1"), "close");
    w.eval(src("content.js"));
    await until(
      () =>
        w
          .testShadow(w.document.getElementById("__review_desk_1"))
          ?.getElementById("role"),
      "reopen",
    );
    sh = w.testShadow(w.document.getElementById("__review_desk_1"));
    assert.equal(sh.querySelectorAll(".noteitem").length, 2);
  });
  await test("文字を選択して変更前の文章と修正文を保存する", async () => {
    sh.querySelector('[data-pick="text"]').click();
    const el = w.document.getElementById("copy"),
      range = w.document.createRange();
    range.selectNodeContents(el);
    range.getBoundingClientRect = () => ({
      x: 200,
      y: 300,
      width: 400,
      height: 35,
    });
    el.dispatchEvent(
      new w.PointerEvent("pointerdown", {
        isPrimary: true,
        bubbles: true,
        button: 0,
        clientX: 200,
        clientY: 300,
      }),
    );
    w.getSelection().removeAllRanges();
    w.getSelection().addRange(range);
    el.dispatchEvent(
      new w.PointerEvent("pointerup", {
        isPrimary: true,
        bubbles: true,
        clientX: 600,
        clientY: 335,
      }),
    );
    await until(() => sh.getElementById("replacement"), "text selection");
    sh.getElementById("replacement").value =
      "担当デザイナーと内容・日程を相談します。";
    sh.getElementById("replacement").dispatchEvent(new w.Event("input"));
    sh.getElementById("save").click();
    await until(() => sh.querySelector('[data-pick="element"]'), "text saved");
    const b = await w.ReviewDB.bundle((await w.ReviewDB.active()).id);
    assert.equal(
      b.notes[2].target.text,
      "担当デザイナーと相談して日程を決めましょう。",
    );
    assert.equal(
      b.notes[2].replacement,
      "担当デザイナーと内容・日程を相談します。",
    );
  });
  await test("画像の指定を画像変更の記録として保存する", async () => {
    await pause(450);
    sh.querySelector('[data-pick="element"]').click();
    w.document.getElementById("photo").click();
    await until(() => sh.getElementById("memo"), "image capture");
    const b = await w.ReviewDB.bundle((await w.ReviewDB.active()).id);
    assert.equal(b.notes[3].kind, "image");
    assert.equal(b.notes[3].target.alt, "デザイナー画像");
  });
  const dw = new Window({
    url: "https://reviewdesk.test/desk.html",
    settings: {
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
    },
  });
  dw.indexedDB = w.indexedDB;
  dw.document.write(
    src("desk.html").replace(/<script[^>]*>.*?<\/script>/gs, ""),
  );
  dw.eval(src("core.js"));
  dw.eval(src("db.js"));
  dw.ReviewExport = {
    marked: async () => jpeg,
    zip: async () => ({ decided: 1, count: 4 }),
    backup: () => {},
  };
  dw.eval(src("desk.js"));
  await test("メモ一覧が保存済みデータを読み込む", async () => {
    await until(
      () => dw.document.querySelectorAll(".note-card").length === 4,
      "desk notes",
    );
    assert.equal(dw.document.getElementById("project").options.length, 1);
  });
  await test("一覧から編集・確定・保存の状態を確認できる", async () => {
    dw.document.querySelector(".note-card").click();
    await until(() => dw.document.getElementById("memo"), "desk editor");
    const m = dw.document.getElementById("memo");
    m.value = "一覧から修正したメモ";
    m.dispatchEvent(new dw.Event("input"));
    await until(
      () =>
        dw.document
          .getElementById("saveStatus")
          .textContent.includes("保存済み"),
      "desk save",
    );
    const b = await dw.ReviewDB.bundle((await dw.ReviewDB.active()).id);
    assert.equal(b.notes[0].memo, "一覧から修正したメモ");
  });
  await test("確定済みメモをいったん消して書き直しても保存が止まらない", async () => {
    const m = dw.document.getElementById("memo");
    m.value = "";
    m.dispatchEvent(new dw.Event("input"));
    m.value = "書き直したメモ";
    m.dispatchEvent(new dw.Event("input"));
    await until(
      () =>
        dw.document
          .getElementById("saveStatus")
          .textContent.includes("保存済み"),
      "desk retype",
    );
    const b = await dw.ReviewDB.bundle((await dw.ReviewDB.active()).id);
    assert.equal(b.notes[0].memo, "書き直したメモ");
    assert.equal(b.notes[0].status, "discuss");
  });
  await test("一覧の検索と状態フィルタが機能する", async () => {
    const f = dw.document.getElementById("filter");
    f.value = "hold";
    f.dispatchEvent(new dw.Event("change"));
    assert.equal(dw.document.querySelectorAll(".note-card").length, 0);
    f.value = "all";
    f.dispatchEvent(new dw.Event("change"));
    const q = dw.document.getElementById("search");
    q.value = "書き直した";
    q.dispatchEvent(new dw.Event("input"));
    assert.equal(dw.document.querySelectorAll(".note-card").length, 1);
  });
  await dw.happyDOM.close();
  // Export uses the shipped code with a real canvas encoder in place of the DOM canvas.
  const ex = vm.createContext({
    self: {},
    ReviewCore: C,
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
    setTimeout: (f) => 0,
    Blob,
    URL: {
      createObjectURL: (blob) => {
        ex.output = blob;
        return "blob:unit-test";
      },
      revokeObjectURL: () => {},
    },
    document: {
      body: { append: () => {} },
      createElement: (tag) => {
        if (tag === "a") return { click() {}, remove() {} };
        const c = createCanvas(1, 1),
          orig = c.getContext.bind(c);
        c.getContext = function (...a) {
          const ctx = orig(...a);
          const draw = ctx.drawImage.bind(ctx);
          ctx.drawImage = (img, ...args) => draw(img.native || img, ...args);
          return ctx;
        };
        return c;
      },
    },
  });
  ex.self = ex;
  vm.runInContext(src("export.js"), ex);
  await test("ZIPの画像・依頼文・バックアップが実データと一致する", async () => {
    const b = await D.bundle(p.id);
    b.notes.push({
      ...n,
      id: "trash",
      code: "R-0900",
      deleted: true,
      memo: "ごみ箱の秘密メモ",
    });
    await ex.ReviewExport.zip(b, { scope: "meeting" });
    const z = await JSZip.loadAsync(await ex.output.arrayBuffer());
    assert.ok(z.file("REQUEST.md"));
    assert.ok(z.file("images/R-0001-marked.jpg"));
    const md = await z.file("REQUEST.md").async("string");
    assert.ok(md.includes("この内容で予約確定"));
    assert.ok(!md.includes("ごみ箱の秘密メモ"));
    const backup = JSON.parse(
      await z.file("backup.review.json").async("string"),
    );
    assert.equal(backup.notes.length, 6);
    assert.ok(!JSON.stringify(backup).includes("ごみ箱の秘密メモ"));
    assert.equal(backup.notes[0].screenshot, jpeg);
    fs.writeFileSync(
      path.resolve(__dirname, "test-export.zip"),
      Buffer.from(await ex.output.arrayBuffer()),
    );
  });
  await test("赤枠の画像が描画され原画像を変更しない", async () => {
    const result = await ex.ReviewExport.marked(n);
    const im = await loadImage(result);
    const c = createCanvas(1000, 700);
    c.getContext("2d").drawImage(im, 0, 0);
    const rgb = c.getContext("2d").getImageData(201, 150, 1, 1).data;
    assert.ok(rgb[0] > rgb[1] + 30);
    assert.equal(n.screenshot, jpeg);
  });
  await test("HTML一覧にメモのHTMLを実行可能な形で出力しない", async () => {
    const b = await D.bundle(p.id);
    b.notes[0].memo = "<script>alert(1)</script>";
    await ex.ReviewExport.zip(b, { scope: "meeting" });
    const z = await JSZip.loadAsync(await ex.output.arrayBuffer());
    const html = await z.file("MEETING_REVIEW.html").async("string");
    assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
    assert.ok(!html.includes("<script>alert"));
  });
  await test("権限は手動起動タブだけ・外部接続なし", () => {
    const manifest = JSON.parse(src("manifest.json"));
    assert.deepEqual(manifest.permissions, ["activeTab", "scripting"]);
    assert.equal(manifest.host_permissions, undefined);
    assert.equal(manifest.externally_connectable, undefined);
    assert.ok(
      manifest.content_security_policy.extension_pages.includes(
        "connect-src 'none'",
      ),
    );
    for (const name of ["content.js", "background.js", "desk.js"])
      assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(src(name)));
  });
  await w.happyDOM.close();
  fs.writeFileSync(
    path.resolve(__dirname, "../reports/functional-tests.json"),
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        tests: log,
        limitations: [
          "DOM simulation and mocked Chrome extension APIs; no real Chrome extension installation or live website capture tested in this environment.",
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
