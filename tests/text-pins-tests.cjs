// Integration tests use the shipped content/core/DB code. Geometry and Chrome
// capture are simulated: these are not browser rendering acceptance tests.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { source, database, cap, until } = require("./helpers.cjs");
const log = [];
const windows = [];
async function test(name, fn) {
  try {
    await fn();
    log.push({ name, result: "PASS" });
    console.log("PASS " + name);
  } catch (e) {
    log.push({ name, result: "FAIL", error: e.stack });
    console.error(e);
    process.exitCode = 1;
  }
}
(async () => {
  const { Window } = await import("happy-dom");
  async function setup(html, target, options = {}) {
    const w = new Window({ url: cap.url, width: 1000, height: 700 });
    windows.push(w);
    require("./shadow-inspector.cjs")(w);
    w.document.body.innerHTML = html;
    const db = database().ReviewDB,
      project = await db.active();
    const capture = { ...cap, kind: options.kind || "text", target };
    if (!options.empty) await db.createNote(project.id, capture, "");
    const geometry = {
      x: 420,
      y: 200,
      width: 180,
      height: 36,
      fragments: null,
      calls: [],
    };
    const rect = () =>
      new w.DOMRect(geometry.x, geometry.y, geometry.width, geometry.height);
    w.Range.prototype.getClientRects = function () {
      geometry.calls.push(this.toString());
      return geometry.fragments || [rect()];
    };
    w.Range.prototype.getBoundingClientRect = rect;
    w.document.querySelector("#heading").getBoundingClientRect = () =>
      new w.DOMRect(40, 100, 900, 80);
    w.ReviewClient = {
      async request(type, args) {
        if (type === "CONTEXT") return project;
        if (type === "LIST") return (await db.bundle(project.id)).notes;
        if (type === "CAPTURE")
          return { screenshot: "data:image/png;base64,AAA=" };
        if (type === "CREATE_NOTE")
          return db.createNote(args.projectId, args.capture, args.screenshot);
        if (type === "GET_NOTE") return db.get("notes", args.id);
        throw Error("Unexpected request: " + type);
      },
    };
    w.eval(source("core.js"));
    await w.eval(source("content.js"));
    const sh = w.testShadow(w.document.getElementById("__review_desk_1"));
    const pin = () => sh.querySelector(".pin");
    const refresh = async (event = "scroll", target = w.document) => {
      target.dispatchEvent(new w.Event(event));
      await new Promise((resolve) => w.requestAnimationFrame(resolve));
    };
    return { w, db, project, sh, geometry, pin, refresh };
  }
  const legacy = { selector: "#heading", text: "選択した文字", tag: "h1" };
  await test("Legacy text pin uses selected glyphs, not the wide centered heading box", async () => {
    const p = await setup(
      '<h1 id="heading">前文 選択した文字 後文</h1>',
      legacy,
    );
    assert.equal(p.pin().style.left, "387px");
    assert.equal(p.pin().style.top, "204.5px");
    assert.equal(p.geometry.calls.at(-1), legacy.text);
    p.pin().click();
    await until(() => p.sh.getElementById("memo"));
    assert.ok(
      p.sh.getElementById("original").textContent.includes(legacy.text),
    );
  });
  await test("Document and nested-container scroll remeasure the text; offscreen pins disappear and return", async () => {
    const p = await setup(
      '<div id="scroller"><h1 id="heading">選択した文字</h1></div>',
      legacy,
    );
    p.geometry.y = 70;
    await p.refresh();
    assert.equal(p.pin().style.top, "74.5px");
    p.geometry.y = 20;
    await p.refresh("scroll", p.w.document.getElementById("scroller"));
    assert.equal(p.pin().style.top, "24.5px");
    p.geometry.y = -50;
    await p.refresh();
    assert.equal(p.pin(), null);
    p.geometry.y = 200;
    await p.refresh();
    assert.ok(p.pin());
    const container = p.w.document.getElementById("scroller");
    container.style.overflow = "auto";
    container.getBoundingClientRect = () => new p.w.DOMRect(200, 180, 600, 100);
    p.geometry.y = 120; // Inside viewport, but outside the scroll container.
    await p.refresh("scroll", container);
    assert.equal(p.pin(), null);
    p.geometry.y = 200;
    await p.refresh("scroll", container);
    assert.ok(p.pin());
  });
  await test("Text pins follow width changes and wrapping even beyond the old 30px viewport guard", async () => {
    const p = await setup('<h1 id="heading">選択した文字</h1>', legacy);
    p.w.happyDOM.setWindowSize({ width: 800, height: 700 });
    p.geometry.x = 250;
    p.geometry.y = 240;
    await p.refresh("resize", p.w);
    assert.equal(p.pin().style.left, "217px");
    assert.equal(p.pin().style.top, "244.5px");
  });
  await test("Selections crossing inline elements resolve to the first visible line fragment", async () => {
    const p = await setup(
      '<h1 id="heading">前文 選択<b>した</b>文字 後文</h1>',
      legacy,
    );
    assert.equal(p.geometry.calls.at(-1), legacy.text);
    p.geometry.fragments = [
      new p.w.DOMRect(420, -45, 100, 30),
      new p.w.DOMRect(300, 10, 80, 30),
    ];
    await p.refresh();
    assert.equal(p.pin().style.left, "267px");
    assert.equal(p.pin().style.top, "11.5px");
  });
  await test("New selection retains the chosen occurrence across save, import and subsequent DOM changes", async () => {
    const p = await setup(
      '<h1 id="heading">A 同じ文字 B 同じ文字 C</h1>',
      {},
      { empty: true },
    );
    const text = p.w.document.getElementById("heading").firstChild;
    const start = text.data.lastIndexOf("同じ文字");
    const range = p.w.document.createRange();
    range.setStart(text, start);
    range.setEnd(text, start + 4);
    p.sh.querySelector('[data-mode="text"]').click();
    p.w.document
      .getElementById("heading")
      .dispatchEvent(
        new p.w.PointerEvent("pointerdown", {
          isPrimary: true,
          bubbles: true,
          button: 0,
        }),
      );
    p.w.getSelection().addRange(range);
    p.w.document
      .getElementById("heading")
      .dispatchEvent(
        new p.w.PointerEvent("pointerup", { isPrimary: true, bubbles: true }),
      );
    await until(() => p.sh.getElementById("memo") && p.pin());
    const saved = (await p.db.bundle(p.project.id)).notes[0];
    assert.equal(saved.target.anchor.start, start);
    assert.equal(saved.target.anchor.end, start + 4);
    assert.equal(saved.target.text, "同じ文字");
    const imported = await p.db.restore(await p.db.bundle(p.project.id));
    const roundtrip = (await p.db.bundle(imported.id)).notes[0];
    assert.deepEqual(roundtrip.target.anchor, saved.target.anchor);
    // Use the persisted record in a fresh page, with a moved second occurrence.
    const q = await setup(
      '<h1 id="heading">追加 A 同じ文字 B 同じ文字 C</h1>',
      saved.target,
    );
    assert.ok(q.pin());
    assert.equal(q.geometry.calls.at(-1), "同じ文字");
    const seen = [];
    q.w.Range.prototype.getClientRects = function () {
      seen.push(this.startOffset);
      return [new q.w.DOMRect(500, 200, 80, 30)];
    };
    await q.refresh();
    assert.equal(seen.at(-1), start + 3);
  });
  await test("Missing or ambiguous legacy text hides only the pin and keeps the note", async () => {
    const p = await setup(
      '<h1 id="heading">選択した文字 / 選択した文字</h1>',
      legacy,
    );
    assert.equal(p.pin(), null);
    p.w.document.getElementById("heading").textContent = "修正後の文章";
    await p.refresh();
    assert.equal(p.pin(), null);
    assert.equal(
      (await p.db.bundle(p.project.id)).notes[0].target.text,
      legacy.text,
    );
    p.w.document.getElementById("heading").textContent = legacy.text;
    await p.refresh();
    assert.ok(p.pin());
  });
  await test("Zero-size hidden text has no pin; left-edge text uses the right side", async () => {
    const p = await setup('<h1 id="heading">選択した文字</h1>', legacy);
    p.geometry.width = 0;
    await p.refresh();
    assert.equal(p.pin(), null);
    p.geometry.width = 100;
    p.geometry.x = 4;
    await p.refresh();
    assert.equal(p.pin().style.left, "110px");
  });
  await test("Element targets still use their box; malformed text anchors are discarded on import", async () => {
    const p = await setup('<h1 id="heading">選択した文字</h1>', legacy, {
      kind: "element",
    });
    assert.equal(p.pin().style.left, "30px");
    assert.equal(p.pin().style.top, "90px");
    const core = database().ReviewCore;
    for (const anchor of [
      { start: -1, end: 5 },
      { start: 0, end: Infinity },
      { start: 0, end: 500 },
    ]) {
      assert.equal(
        core.capture({ ...cap, target: { ...legacy, anchor } }).target.anchor,
        undefined,
      );
    }
  });
  for (const w of windows) await w.happyDOM.close();
  fs.writeFileSync(
    path.join(__dirname, "../reports/text-pins-tests.json"),
    JSON.stringify(
      {
        environment:
          "Node / happy-dom and fake-indexeddb; Range geometry and capture mocked; no real browser layout",
        tests: log,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${log.filter((t) => t.result === "PASS").length}/${log.length} PASS`,
  );
})();
