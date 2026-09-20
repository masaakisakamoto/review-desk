const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const JSZip = require("jszip");
const { IDBFactory } = require("fake-indexeddb");
const {
  source,
  database,
  cap,
  picture,
  exporter,
  until,
} = require("./helpers.cjs");
const log = [];
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
(async () => {
  const ctx = database(),
    D = ctx.ReviewDB,
    C = ctx.ReviewCore;
  let p = await D.active();
  await test("Clipped targets keep the intersection with the visible viewport", () => {
    assert.deepEqual(
      JSON.parse(
        JSON.stringify(
          C.rect(
            { x: -100, y: -20, width: 300, height: 100 },
            { width: 1000, height: 700 },
          ),
        ),
      ),
      { x: 0, y: 0, width: 200, height: 80 },
    );
    assert.throws(() =>
      C.rect(
        { x: 0, y: 0, width: Infinity, height: 100 },
        { width: 1000, height: 700 },
      ),
    );
  });
  await test("Custom roles survive capture, edit and a backup round trip", async () => {
    p = await D.updateProject(p.id, {
      title: "Fictional studio",
      roles: ["Content owner", "Reviewer <A>"],
      role: "Content owner",
    });
    const note = await D.createNote(
      p.id,
      { ...cap, role: "Content owner" },
      picture(),
    );
    const restored = await D.restore(await D.bundle(p.id));
    const bundle = await D.bundle(restored.id);
    assert.equal(bundle.notes[0].role, "Content owner");
    assert.equal(restored.role, "Content owner");
    assert.ok(restored.roles.includes("Reviewer <A>"));
    assert.equal(bundle.notes[0].code, note.code);
    assert.equal(bundle.notes[0].issueId, note.id);
    assert.notEqual(bundle.notes[0].id, note.id);
  });
  await test("Legacy 1.0.1 backup retains every note, image, code and deleted record", async () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(__dirname, "fixtures/v1.0.1.review.json")),
    );
    const restored = await D.restore(fixture),
      bundle = await D.bundle(restored.id);
    for (const [index, old] of fixture.notes.entries()) {
      const note = bundle.notes[index];
      for (const key of [
        "code",
        "memo",
        "screenshot",
        "afterImage",
        "deleted",
        "status",
        "progress",
      ])
        assert.equal(note[key], old[key]);
      assert.equal(note.issueId, old.id);
    }
    const next = await D.createNote(restored.id, cap, picture());
    assert.equal(next.code, "R-0005");
  });
  await test("Same IndexedDB stores reopen without a migration or changed IDs", async () => {
    const factory = new IDBFactory(),
      one = database(factory),
      project = await one.ReviewDB.active(),
      note = await one.ReviewDB.createNote(project.id, cap, picture());
    const two = database(factory);
    assert.equal((await two.ReviewDB.active()).id, project.id);
    assert.equal(
      (await two.ReviewDB.get("notes", note.id)).screenshot,
      note.screenshot,
    );
    assert.equal((await factory.databases())[0].version, 1);
  });
  let note = await D.createNote(p.id, cap, picture());
  note = await D.updateNote(note.id, note.revision, {
    memo: "Use a clear visit label",
    status: "decided",
  });
  await test("Verification needs a result, preserves the issue ID and records time", async () => {
    await assert.rejects(
      D.updateNote(note.id, note.revision, { progress: "done" }),
    );
    note = await D.updateNote(note.id, note.revision, {
      progress: "verify",
      afterImage: picture("AFTER / SYNTHETIC"),
    });
    note = await D.updateNote(note.id, note.revision, {
      progress: "done",
      resolution: "The label matches the agreed wording.",
      reviewer: "Demo reviewer",
    });
    assert.ok(note.verifiedAt);
    assert.equal(note.history.at(-1).toProgress, "done");
    assert.equal(note.history.at(-1).reviewer, "Demo reviewer");
    assert.equal(note.issueId, note.id);
  });
  await test("Changing agreed requirements reopens verified work and clears the approval time", async () => {
    note = await D.updateNote(note.id, note.revision, {
      memo: "Revised requirement",
    });
    assert.equal(note.progress, "todo");
    assert.equal(note.verifiedAt, "");
    note = await D.updateNote(note.id, note.revision, {
      progress: "done",
      resolution: "Checked revised text",
    });
    note = await D.updateNote(note.id, note.revision, {
      afterImage: picture("SECOND AFTER / SYNTHETIC"),
    });
    assert.equal(note.progress, "verify");
    assert.equal(note.verifiedAt, "");
  });
  await test("Discussion, hold, verification and done are excluded from request-only packets", async () => {
    const base = await D.createNote(p.id, cap, picture());
    await D.updateNote(base.id, base.revision, {
      memo: "REQUEST-ME",
      status: "decided",
    });
    const hold = await D.createNote(p.id, cap, picture());
    await D.updateNote(hold.id, hold.revision, {
      memo: "KEEP-PRIVATE-HOLD",
      status: "hold",
    });
    const ex = exporter(C);
    await ex.ReviewExport.zip(await D.bundle(p.id));
    const zip = await JSZip.loadAsync(await ex.output.arrayBuffer());
    const backup = JSON.parse(
      await zip.file("backup.review.json").async("string"),
    );
    assert.equal(backup.notes.length, 1);
    assert.equal(backup.notes[0].memo, "REQUEST-ME");
    assert.equal(backup.checks.length, 0);
    for (const name of [
      "REQUEST.md",
      "review-data.json",
      "MEETING_REVIEW.html",
    ])
      assert.ok(
        !(await zip.file(name).async("string")).includes("KEEP-PRIVATE-HOLD"),
      );
  });
  await test("Meeting packets link PNG originals and after images correctly, without embedding scripts", async () => {
    const ex = exporter(C);
    await ex.ReviewExport.zip(await D.bundle(p.id), {
      scope: "meeting",
      language: "en",
    });
    const zip = await JSZip.loadAsync(await ex.output.arrayBuffer());
    const data = JSON.parse(await zip.file("review-data.json").async("string"));
    const html = await zip.file("MEETING_REVIEW.html").async("string");
    for (const n of data.notes) {
      for (const key of [
        "screenshot",
        "markedScreenshot",
        "attachment",
        "afterImage",
      ])
        if (n[key]) assert.ok(zip.file(n[key]), n[key]);
    }
    const after = data.notes.find((n) => n.afterImage);
    assert.ok(html.includes(after.afterImage));
    assert.ok(html.includes("Checked revised text"));
    assert.ok(html.includes("Demo reviewer"));
    assert.ok(!html.includes("<script"));
    assert.ok(zip.file(data.notes[0].screenshot).name.endsWith(".png"));
  });
  await test("Image-free export removes every image from every output format", async () => {
    const ex = exporter(C);
    await ex.ReviewExport.zip(await D.bundle(p.id), {
      scope: "meeting",
      images: false,
    });
    const zip = await JSZip.loadAsync(await ex.output.arrayBuffer());
    assert.ok(
      !Object.keys(zip.files).some((name) => name.startsWith("images/")),
    );
    for (const name of [
      "backup.review.json",
      "review-data.json",
      "MEETING_REVIEW.html",
    ])
      assert.ok(!(await zip.file(name).async("string")).includes("data:image"));
  });
  await test("Invalid prototype enum names and infinite viewport sizes are rejected", () => {
    assert.throws(() => C.patch({ status: "constructor" }));
    assert.throws(() => C.patch({ progress: "toString" }));
    assert.throws(() =>
      C.capture({ ...cap, viewport: { width: Infinity, height: 700 } }),
    );
  });
  await test("A blocked database fails explicitly and retries with a fresh connection", async () => {
    const requests = [];
    const custom = {
      open() {
        const r = {};
        requests.push(r);
        queueMicrotask(() => r.onblocked());
        return r;
      },
    };
    const blocked = database(custom);
    await assert.rejects(
      blocked.ReviewDB.active(),
      (error) => error.code === "DB_BLOCKED",
    );
    blocked.indexedDB = new IDBFactory();
    assert.ok((await blocked.ReviewDB.active()).id);
    let closed = false;
    requests[0].result = {
      close() {
        closed = true;
      },
    };
    requests[0].onsuccess();
    assert.ok(closed);
  });
  await test("Database open timeout is recoverable and no automatic write retry occurs", async () => {
    const timeout = database(
      {
        open() {
          return {};
        },
      },
      { setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 10)) },
    );
    await assert.rejects(
      timeout.ReviewDB.active(),
      (error) => error.code === "DB_OPEN_TIMEOUT",
    );
    timeout.indexedDB = new IDBFactory();
    assert.ok((await timeout.ReviewDB.active()).id);
  });
  const escapedRequest = C.requestMarkdown(
    { title: "Demo" },
    [
      {
        ...note,
        status: "decided",
        progress: "todo",
        memo: '![pixel](https://example.test/pixel.png) <img src="https://example.test/p">',
      },
    ],
    [],
  );
  assert.ok(!escapedRequest.includes("![pixel]("));
  assert.ok(!/(?<!\\)<img src=/.test(escapedRequest));
  const { Window } = await import("happy-dom");
  function window() {
    const w = new Window({
      url: "https://reviewdesk.test/desk.html",
      settings: {
        disableJavaScriptFileLoading: true,
        disableCSSFileLoading: true,
      },
    });
    w.indexedDB = new IDBFactory();
    w.document.write(
      source("desk.html").replace(/<script[^>]*>.*?<\/script>/gs, ""),
    );
    w.eval(source("core.js"));
    w.eval(source("db.js"));
    w.ReviewExport = {
      download() {},
      marked: async () => picture(),
      backup() {},
      zip: async () => ({ decided: 1, count: 1 }),
    };
    return w;
  }
  await test("Desk failed startup shows retry and disables writes until recovery", async () => {
    const w = window(),
      active = w.ReviewDB.active;
    w.ReviewDB.active = async () => {
      throw Error("Injected failure");
    };
    await w.eval(source("desk.js"));
    assert.ok(w.document.getElementById("retryLoad"));
    assert.ok(w.document.getElementById("export").disabled);
    w.ReviewDB.active = active;
    w.document.getElementById("retryLoad").click();
    await until(() => !w.document.getElementById("export").disabled);
    await w.happyDOM.close();
  });
  await test("Rapid edits of verified notes do not accidentally restore old approval", async () => {
    const w = window(),
      project = await w.ReviewDB.active();
    let n = await w.ReviewDB.createNote(project.id, cap, picture());
    n = await w.ReviewDB.updateNote(n.id, n.revision, {
      memo: "Before",
      status: "decided",
      progress: "done",
      resolution: "Checked",
    });
    await w.eval(source("desk.js"));
    w.document.querySelector(".note-card").click();
    await until(() => w.document.getElementById("memo"));
    for (const value of ["After 1", "After 2", "After 3"]) {
      w.document.getElementById("memo").value = value;
      w.document.getElementById("memo").dispatchEvent(new w.Event("input"));
    }
    await until(() =>
      w.document.getElementById("saveStatus").textContent.includes("保存済み"),
    );
    const saved = await w.ReviewDB.get("notes", n.id);
    assert.equal(saved.memo, "After 3");
    assert.equal(saved.progress, "todo");
    assert.equal(w.document.getElementById("progress").value, "todo");
    await w.happyDOM.close();
  });
  await test("Concurrent edit conflict keeps typed draft and offers a recovery download", async () => {
    const w = window(),
      project = await w.ReviewDB.active();
    let n = await w.ReviewDB.createNote(project.id, cap, picture());
    await w.eval(source("desk.js"));
    w.document.querySelector(".note-card").click();
    await until(() => w.document.getElementById("memo"));
    await w.ReviewDB.updateNote(n.id, n.revision, {
      memo: "Newer saved record",
    });
    const memo = w.document.getElementById("memo");
    memo.value = "My unsaved draft";
    memo.dispatchEvent(new w.Event("input"));
    await until(
      () => !w.document.getElementById("recovery").classList.contains("hidden"),
    );
    assert.equal(memo.value, "My unsaved draft");
    assert.equal(
      (await w.ReviewDB.get("notes", n.id)).memo,
      "Newer saved record",
    );
    w.document.getElementById("home").click();
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(w.document.getElementById("memo").value, "My unsaved draft");
    await w.happyDOM.close();
  });
  fs.writeFileSync(
    path.join(__dirname, "../reports/beta-tests.json"),
    JSON.stringify(
      {
        environment: "Node / simulated DOM, IndexedDB and Chrome APIs",
        tests: log,
      },
      null,
      2,
    ),
  );
  console.log(
    `${log.filter((t) => t.result === "PASS").length}/${log.length} PASS`,
  );
})();
