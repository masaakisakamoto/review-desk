/* Produce explicitly synthetic sample evidence; never reads a user's browser. */
const fs = require("node:fs");
const path = require("node:path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const JSZip = require("jszip");
const { database, exporter } = require("../tests/helpers.cjs");
const root = path.resolve(__dirname, "..");
async function image(after = false) {
  const canvas = createCanvas(1200, 800),
    ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f1eb";
  ctx.fillRect(0, 0, 1200, 800);
  ctx.fillStyle = "#ded8ce";
  ctx.fillRect(0, 0, 1200, 48);
  ctx.fillStyle = "#373d3f";
  ctx.font = "14px sans-serif";
  ctx.fillText(
    "SYNTHETIC DEMO / FICTIONAL DATA / NOT A BROWSER SCREENSHOT",
    38,
    30,
  );
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("FIELDNOTES / STUDIO", 60, 100);
  ctx.font = "15px sans-serif";
  ctx.fillText("Collection                  Visit", 924, 100);
  ctx.strokeStyle = "#d1ccc4";
  ctx.beginPath();
  ctx.moveTo(60, 126);
  ctx.lineTo(1140, 126);
  ctx.stroke();
  ctx.font = "12px sans-serif";
  ctx.fillText("OBJECTS & ORDINARY DAYS / 001", 60, 205);
  ctx.font = "58px sans-serif";
  ctx.fillText("A little space.", 60, 285);
  ctx.fillText("A slower day.", 60, 350);
  ctx.font = "18px sans-serif";
  ctx.fillText("Everyday objects, chosen with care.", 60, 413);
  ctx.fillStyle = "#292c2d";
  ctx.fillRect(60, 452, 300, 60);
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText(after ? "Check availability" : "Learn more", 83, 490);
  const art = await loadImage(
    fs.readFileSync(path.join(root, "extension/sample-object.svg")),
  );
  ctx.drawImage(art, 620, 175, 520, 416);
  ctx.fillStyle = "#333b3b";
  ctx.font = "13px sans-serif";
  for (const [i, title] of [
    "01 / TOUCH",
    "02 / CHOOSE",
    "03 / VISIT",
  ].entries())
    ctx.fillText(title, 60 + i * 372, 652);
  ctx.font = "22px sans-serif";
  for (const [i, title] of [
    "Meet the material.",
    "Find your everyday.",
    "Visit the studio.",
  ].entries())
    ctx.fillText(title, 60 + i * 372, 692);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#646b6a";
  ctx.fillText(
    "Fictional example prepared for Review Desk. No user or customer information.",
    60,
    758,
  );
  return canvas.toDataURL("image/png");
}
(async () => {
  const before = await image(),
    after = await image(true),
    time = "2026-09-19T00:00:00.000Z";
  const project = {
    id: "sample-project",
    title: "Demo / Fieldnotes Studio",
    roles: ["未指定", "Content owner", "Designer", "Reviewer"],
    role: "Content owner",
    nextNumber: 5,
    createdAt: time,
  };
  const base = {
    projectId: project.id,
    url: "https://example.test/studio",
    title: "Fictional studio",
    screen: "Studio introduction",
    role: "Content owner",
    viewport: { width: 1200, height: 800, dpr: 1 },
    scroll: { x: 0, y: 0 },
    createdAt: time,
    updatedAt: time,
    userAgent: "Synthetic sample — no browser capture",
    revision: 1,
    scope: "this",
    status: "discuss",
    progress: "todo",
    kind: "text",
    memo: "",
    replacement: "",
    resolution: "",
    reviewer: "",
    verifiedAt: "",
    screenshot: before,
    attachment: "",
    afterImage: "",
    deleted: false,
    history: [],
  };
  const records = [
    {
      kind: "text",
      memo: "ボタンの行き先がわかる文言に変更する。 / Make the button destination clear.",
      replacement: "Check availability",
      status: "decided",
      rect: { x: 60, y: 452, width: 300, height: 60 },
      target: {
        selector: "#explore",
        tag: "button",
        text: "Learn more",
        alt: "",
      },
    },
    {
      kind: "image",
      memo: "写真の候補を見比べてから決める。 / Compare image options before deciding.",
      rect: { x: 620, y: 175, width: 520, height: 416 },
      target: {
        selector: "#objectPhoto",
        tag: "img",
        text: "",
        alt: "Fictional vase and plant",
      },
    },
    {
      kind: "area",
      memo: "説明の余白調整は次回検討する。 / Revisit spacing in the next review.",
      status: "hold",
      rect: { x: 55, y: 615, width: 1090, height: 110 },
      target: { selector: "", tag: "", text: "", alt: "" },
    },
    {
      kind: "text",
      memo: "見出しの内容を確認する（サンプル）。 / Verify the heading (sample).",
      status: "decided",
      progress: "done",
      afterImage: after,
      reviewer: "Sample reviewer",
      verifiedAt: time,
      resolution:
        "サンプルの確認記録です。実機検証の結果ではありません。 / Example verification record, not a real-device test result.",
      rect: { x: 55, y: 226, width: 520, height: 143 },
      target: {
        selector: "#heading",
        tag: "h1",
        text: "A little space. A slower day.",
        alt: "",
      },
    },
  ];
  const notes = records.map((note, i) => ({
    ...base,
    ...note,
    id: "sample-issue-" + (i + 1),
    issueId: "sample-issue-" + (i + 1),
    code: "R-" + String(i + 1).padStart(4, "0"),
  }));
  const bundle = {
    format: "review-desk-v1",
    version: "1.1.0-beta.1",
    exportedAt: time,
    project,
    notes,
    checks: [],
  };
  fs.mkdirSync(path.join(root, "examples"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "examples/sample.review.json"),
    JSON.stringify(bundle, null, 2) + "\n",
  );
  const ctx = database(),
    ex = exporter(ctx.ReviewCore);
  for (const scope of ["request", "meeting"]) {
    await ex.ReviewExport.zip(bundle, { scope, language: "en" });
    const bytes = Buffer.from(await ex.output.arrayBuffer());
    fs.writeFileSync(path.join(root, "examples", scope + ".zip"), bytes);
    const archive = await JSZip.loadAsync(bytes);
    for (const [name, file] of Object.entries(archive.files)) {
      if (file.dir) continue;
      const target = path.join(root, "examples", scope, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, await file.async("nodebuffer"));
    }
  }
  console.log("Created synthetic sample backup and request/meeting packets.");
})();
