// Exercise shipped UI/DB code with complete pointer gestures. Caret hit-testing,
// Range geometry and capture are simulated; browser acceptance is separate.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { source, database, until } = require("./helpers.cjs");
const results = [],
  windows = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, result: "PASS" });
    console.log("PASS " + name);
  } catch (error) {
    results.push({ name, result: "FAIL", error: error.stack });
    console.error("FAIL " + name, error);
    process.exitCode = 1;
  }
}
(async () => {
  const { Window } = await import("happy-dom");
  async function setup(
    html = '<a id="target" href="/destination">選択する文字</a>',
  ) {
    const w = new Window({
      url: "https://example.test/review",
      width: 1200,
      height: 800,
    });
    windows.push(w);
    require("./shadow-inspector.cjs")(w);
    w.document.body.innerHTML = "<main>" + html + "</main>";
    const db = database().ReviewDB,
      project = await db.active();
    const control = {
      capture: null,
      update: null,
      captures: 0,
      target: w.document.getElementById("target"),
      point: null,
    };
    w.document.elementFromPoint = () => control.target;
    w.document.caretRangeFromPoint = (x) => {
      if (control.point) return control.point(x);
      const text = control.target?.firstChild;
      if (text?.nodeType !== 3) return null;
      const r = w.document.createRange();
      r.setStart(text, Math.max(0, Math.min(text.length, Math.round(x / 10))));
      r.collapse(true);
      return r;
    };
    w.Range.prototype.getBoundingClientRect = () =>
      new w.DOMRect(120, 200, 200, 32);
    w.Range.prototype.getClientRects = () => [new w.DOMRect(120, 200, 200, 32)];
    for (const el of w.document.querySelectorAll("main *"))
      el.getBoundingClientRect = () => new w.DOMRect(120, 200, 200, 32);
    w.ReviewClient = {
      async request(type, args) {
        if (type === "CONTEXT") return project;
        if (type === "LIST") return (await db.bundle(project.id)).notes;
        if (type === "CAPTURE") {
          control.captures++;
          if (control.capture) await control.capture;
          return { screenshot: "data:image/png;base64,AAA=" };
        }
        if (type === "CREATE_NOTE")
          return db.createNote(args.projectId, args.capture, args.screenshot);
        if (type === "GET_NOTE") return db.get("notes", args.id);
        if (type === "UPDATE_NOTE") {
          if (control.update) await control.update;
          return db.updateNote(args.id, args.revision, args.patch);
        }
        throw Error("Unexpected request: " + type);
      },
    };
    w.eval(source("core.js"));
    await w.eval(source("content.js"));
    const sh = w.testShadow(w.document.getElementById("__review_desk_1"));
    const selectMode = (mode) =>
      sh.querySelector(`[data-mode="${mode}"]`).click();
    const pointer = (type, x = 0, options = {}) => {
      const event = new w.PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: x,
        clientY: 200,
        ...options,
      });
      control.target.dispatchEvent(event);
      return event;
    };
    const drag = (start = 0, end = 40) => {
      pointer("pointerdown", start);
      pointer("pointermove", end);
      pointer("pointerup", end);
    };
    const event = (name, target = control.target) => {
      const e = new w.Event(name, {
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      target.dispatchEvent(e);
      return e;
    };
    const notes = async () => (await db.bundle(project.id)).notes;
    const done = () =>
      until(
        () =>
          sh.getElementById("memo") &&
          sh.getElementById("modeState").textContent === "閲覧中",
      );
    return {
      w,
      db,
      project,
      control,
      sh,
      selectMode,
      pointer,
      drag,
      event,
      notes,
      done,
    };
  }
  await test("Link text shows guidance, suppresses link drag/navigation and records the chosen substring", async () => {
    const p = await setup();
    let siteActions = 0;
    for (const name of [
      "click",
      "mousedown",
      "mouseup",
      "dragstart",
      "auxclick",
    ])
      p.control.target.addEventListener(name, () => siteActions++);
    p.selectMode("text");
    p.pointer("pointermove", 0);
    assert.match(p.sh.getElementById("hintText").textContent, /リンク内/);
    p.pointer("pointerdown", 0);
    assert.ok(p.event("dragstart").defaultPrevented);
    assert.ok(p.event("mousedown").defaultPrevented);
    assert.ok(p.event("auxclick").defaultPrevented);
    p.pointer("pointermove", 40);
    assert.equal(p.w.getSelection().toString(), "選択する");
    p.pointer("pointerup", 40);
    p.control.target.click();
    await p.done();
    assert.equal(siteActions, 0);
    assert.equal((await p.notes())[0].target.text, "選択する");
    assert.equal(p.control.target.getAttribute("href"), "/destination");
  });
  await test("Selection-disabled text is assisted and exact original inline priorities return on Escape", async () => {
    const p = await setup(
      '<p id="target" style="user-select:none!important;cursor:help;color:red">選択する文字</p>',
    );
    p.selectMode("text");
    p.pointer("pointermove");
    assert.equal(
      p.control.target.style.getPropertyValue("user-select"),
      "text",
    );
    p.pointer("pointerdown");
    p.pointer("pointermove", 40);
    assert.equal(p.w.getSelection().toString(), "選択する");
    p.w.document.dispatchEvent(
      new p.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    assert.equal(
      p.control.target.style.getPropertyValue("user-select"),
      "none",
    );
    assert.equal(
      p.control.target.style.getPropertyPriority("user-select"),
      "important",
    );
    assert.equal(p.control.target.style.cursor, "help");
    assert.equal(p.control.target.style.color, "red");
    p.pointer("pointerup", 40);
    assert.equal((await p.notes()).length, 0);
  });
  await test("Button labels can be selected without activating the button", async () => {
    const p = await setup(
      '<button id="target" type="button">選択する文字</button>',
    );
    let activations = 0;
    p.control.target.addEventListener("click", () => activations++);
    p.selectMode("text");
    p.drag();
    p.control.target.click();
    await p.done();
    assert.equal(activations, 0);
    assert.equal((await p.notes())[0].target.text, "選択する");
  });
  await test("Image inside link is not mislabelled text and the alternative records the image", async () => {
    const p = await setup(
      '<a href="/destination"><img id="target" alt="Readable words in artwork"></a>',
    );
    p.selectMode("text");
    p.pointer("pointermove");
    assert.match(p.sh.getElementById("hintText").textContent, /画像・図形/);
    p.drag();
    assert.equal((await p.notes()).length, 0);
    assert.equal(
      p.sh.getElementById("hintActions").classList.contains("hidden"),
      false,
    );
    p.sh.querySelector('[data-fallback="element"]').click();
    // Previous pointer release suppresses the browser's following click.
    await new Promise((r) => setTimeout(r, 410));
    p.control.target.click();
    await p.done();
    assert.equal((await p.notes())[0].kind, "image");
  });
  await test("SVG, canvas and empty background targets offer alternatives without claiming OCR", async () => {
    for (const html of [
      '<svg id="target"><text>見える文字</text></svg>',
      '<canvas id="target"></canvas>',
      '<div id="target" style="background-image:linear-gradient(red,blue)"></div>',
    ]) {
      const p = await setup(html);
      p.selectMode("text");
      p.pointer("pointermove");
      p.drag();
      assert.equal((await p.notes()).length, 0);
      assert.equal(
        p.sh.getElementById("hintActions").classList.contains("hidden"),
        false,
      );
      assert.ok(
        !p.sh.getElementById("hintText").textContent.includes("画像です"),
      );
    }
  });
  await test("Input, password, textarea, select and editable text do not become original-text records", async () => {
    for (const html of [
      '<input id="target" value="PRIVATE">',
      '<input id="target" type="password" value="PRIVATE">',
      '<textarea id="target">PRIVATE</textarea>',
      '<select id="target"><option>PRIVATE</option></select>',
      '<div id="target" contenteditable="true">PRIVATE</div>',
    ]) {
      const p = await setup(html);
      p.selectMode("text");
      p.pointer("pointermove");
      assert.match(p.sh.getElementById("hintText").textContent, /入力欄/);
      p.drag();
      assert.equal((await p.notes()).length, 0);
      assert.ok(
        (p.control.target.value || p.control.target.textContent).includes(
          "PRIVATE",
        ),
      );
    }
  });
  await test("Dragging across editable content is refused even if both endpoints are ordinary text", async () => {
    const p = await setup(
      '<p id="target">前文<span contenteditable="true">PRIVATE</span>後文</p>',
    );
    p.control.point = (x) => {
      const r = p.w.document.createRange();
      r.setStart(
        x === 0 ? p.control.target.firstChild : p.control.target.lastChild,
        x === 0 ? 0 : 2,
      );
      r.collapse(true);
      return r;
    };
    p.selectMode("text");
    p.drag();
    assert.equal((await p.notes()).length, 0);
    assert.equal(
      p.sh.getElementById("hintActions").classList.contains("hidden"),
      false,
    );
  });
  await test("Stale selection, right-button release and a click without dragging create no note", async () => {
    const p = await setup();
    p.selectMode("text");
    const range = p.w.document.createRange();
    range.selectNodeContents(p.control.target);
    p.w.getSelection().addRange(range);
    p.pointer("pointerup", 40);
    assert.equal((await p.notes()).length, 0);
    p.pointer("pointerdown", 0, { button: 2 });
    p.pointer("pointerup", 40, { button: 2 });
    assert.equal((await p.notes()).length, 0);
    p.drag(20, 20);
    assert.equal((await p.notes()).length, 0);
    assert.equal(
      p.sh.getElementById("hintActions").classList.contains("hidden"),
      false,
    );
  });
  await test("Cancelled gestures and window blur cannot leave a stale selection to capture", async () => {
    const p = await setup();
    p.selectMode("text");
    p.pointer("pointerdown");
    p.pointer("pointermove", 40);
    p.event("pointercancel");
    p.pointer("pointerup", 40);
    assert.equal((await p.notes()).length, 0);
    p.pointer("pointerdown");
    p.pointer("pointermove", 40);
    p.w.dispatchEvent(new p.w.Event("blur"));
    p.pointer("pointerup", 40);
    assert.equal((await p.notes()).length, 0);
    assert.equal(p.w.getSelection().toString(), "");
  });
  await test("Area clicks are not recorded; reverse dragging still records the intended rectangle", async () => {
    const p = await setup();
    p.selectMode("area");
    p.drag(20, 22);
    assert.equal((await p.notes()).length, 0);
    p.pointer("pointerdown", 90, { clientY: 300 });
    p.pointer("pointercancel");
    p.pointer("pointerup", 10, { clientY: 200 });
    assert.equal((await p.notes()).length, 0);
    p.pointer("pointerdown", 90, { clientY: 300 });
    p.pointer("pointerup", 10, { clientY: 200 });
    await p.done();
    const note = (await p.notes())[0];
    assert.equal(note.kind, "area");
    assert.deepEqual(JSON.parse(JSON.stringify(note.rect)), {
      x: 10,
      y: 200,
      width: 80,
      height: 100,
    });
  });
  await test("Repeat-text action waits for saves and records another note under the next code", async () => {
    const p = await setup();
    p.selectMode("text");
    p.drag();
    await p.done();
    let release;
    p.control.update = new Promise((resolve) => (release = resolve));
    p.sh.getElementById("memo").value = "First request";
    p.sh.getElementById("memo").dispatchEvent(new p.w.Event("input"));
    p.sh.getElementById("repeat").click();
    assert.equal(
      p.sh.getElementById("panel").classList.contains("hidden"),
      false,
    );
    release();
    await until(
      () => p.sh.getElementById("modeState").textContent === "文字を選択中",
    );
    p.drag(40, 60);
    await until(() => p.control.captures === 2);
    await p.done();
    const notes = await p.notes();
    assert.deepEqual(
      notes.map((n) => n.code),
      ["R-0001", "R-0002"],
    );
    assert.equal(notes[0].memo, "First request");
    assert.equal(notes[1].target.text, "文字");
  });
  await test("Failed save keeps the draft panel and blocks changing selection modes", async () => {
    const p = await setup();
    p.selectMode("text");
    p.drag();
    await p.done();
    p.control.update = Promise.resolve().then(() => {
      throw Error("Injected save failure");
    });
    p.control.update.catch(() => {});
    p.sh.getElementById("memo").value = "Unsaved text";
    p.sh.getElementById("memo").dispatchEvent(new p.w.Event("input"));
    await until(() =>
      p.sh.getElementById("status").textContent.includes("未保存"),
    );
    p.selectMode("area");
    assert.equal(
      p.sh.getElementById("panel").classList.contains("hidden"),
      false,
    );
    assert.equal(p.sh.getElementById("memo").value, "Unsaved text");
    assert.equal(p.sh.getElementById("modeState").textContent, "閲覧中");
  });
  await test("Capture in progress ignores mode changes and Escape; overlay stays hidden until capture completes", async () => {
    const p = await setup();
    let release;
    p.control.capture = new Promise((resolve) => (release = resolve));
    p.selectMode("text");
    p.drag();
    await until(() => p.control.captures === 1);
    p.w.document.dispatchEvent(
      new p.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    p.selectMode("area");
    p.sh.getElementById("show").click();
    assert.equal(
      p.w.document.getElementById("__review_desk_1").style.visibility,
      "hidden",
    );
    assert.equal(p.sh.getElementById("modeState").textContent, "撮影中…");
    release();
    await p.done();
    assert.equal((await p.notes()).length, 1);
  });
  await test("Reverse selection across inline markup uses caret positions and preserves original text", async () => {
    const p = await setup(
      '<a id="target" href="/destination">Hello <strong>world</strong></a>',
    );
    p.control.point = (x) => {
      const r = p.w.document.createRange();
      r.setStart(
        x === 0
          ? p.control.target.firstChild
          : p.control.target.lastChild.firstChild,
        x === 0 ? 0 : 5,
      );
      r.collapse(true);
      return r;
    };
    p.selectMode("text");
    p.drag(40, 0);
    await p.done();
    assert.equal((await p.notes())[0].target.text, "Hello world");
  });
  await test("Browse/close restores ordinary page actions and preserves newer style edits made by the site", async () => {
    const p = await setup();
    let clicks = 0;
    p.control.target.addEventListener("click", () => clicks++);
    p.selectMode("text");
    p.pointer("pointermove");
    p.control.target.style.setProperty("user-select", "all", "important");
    p.selectMode("browse");
    assert.equal(p.control.target.style.getPropertyValue("user-select"), "all");
    assert.equal(p.sh.getElementById("modeState").textContent, "閲覧中");
    p.event("click");
    assert.equal(clicks, 1);
    assert.equal(p.event("dragstart").defaultPrevented, false);
    p.selectMode("text");
    p.pointer("pointermove");
    p.sh.getElementById("close").click();
    await until(() => !p.w.document.getElementById("__review_desk_1"));
    assert.equal(p.control.target.style.getPropertyValue("user-select"), "all");
    assert.equal(p.event("mousedown").defaultPrevented, false);
  });
  for (const w of windows) await w.happyDOM.close();
  fs.writeFileSync(
    path.join(__dirname, "../reports/selection-tests.json"),
    JSON.stringify(
      {
        environment:
          "Node / happy-dom and fake-indexeddb; caret geometry and Chrome capture simulated",
        tests: results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${results.filter((r) => r.result === "PASS").length}/${results.length} PASS`,
  );
})();
