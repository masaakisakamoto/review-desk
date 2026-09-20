(function (root) {
  "use strict";
  const C = ReviewCore;
  async function marked(note) {
    if (!note.screenshot) return "";
    const image = new Image();
    image.src = note.screenshot;
    await image.decode();
    if (
      !image.naturalWidth ||
      image.naturalWidth * image.naturalHeight > 40000000
    )
      throw Error("画像の解像度が大きすぎます。40メガピクセルまで対応します。");
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    if (note.rect) {
      const sx = canvas.width / note.viewport.width,
        sy = canvas.height / note.viewport.height,
        r = note.rect;
      ctx.strokeStyle = "#c8513c";
      ctx.lineWidth = Math.max(3, 3 * sx);
      ctx.strokeRect(r.x * sx, r.y * sy, r.width * sx, r.height * sy);
      const x = Math.max(16 * sx, Math.min(canvas.width - 25 * sx, r.x * sx)),
        y = Math.max(16 * sy, Math.min(canvas.height - 20 * sy, r.y * sy));
      ctx.fillStyle = "#c8513c";
      ctx.beginPath();
      ctx.arc(x, y, 14 * sx, 0, 7);
      ctx.fill();
      ctx.font = `bold ${11 * sx}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.fillText(String(Number(note.code.slice(2))), x, y);
    }
    return canvas.toDataURL("image/jpeg", 0.9);
  }
  function download(blob, name) {
    const anchor = document.createElement("a"),
      url = URL.createObjectURL(blob);
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  const stamp = () =>
    new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
  function backup(bundle) {
    download(
      new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }),
      "ReviewDesk_Backup_" + stamp() + ".review.json",
    );
  }
  function summary(bundle, language = "ja") {
    const t = (ja, en) => (language === "en" ? en : ja);
    const status = (note) =>
      language === "en"
        ? note.status + " / " + note.progress
        : C.STATUS[note.status] + " / " + C.PROGRESS[note.progress];
    return `<!doctype html><html lang="${language === "en" ? "en" : "ja"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"><title>${C.esc(bundle.project.title)}</title><style>body{font:15px/1.7 system-ui,sans-serif;background:#faf9f6;color:#272a2c;max-width:1100px;margin:40px auto;padding:0 24px}article{border-top:1px solid #d6d8d7;padding:30px 0;break-inside:avoid}img{width:100%;height:auto;border:1px solid #ddd}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;background:#f0eeea;padding:16px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}small{color:#53595d}h1{line-height:1.3}figure{margin:0}figcaption{font-size:12px;font-weight:600;margin-bottom:8px}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>${C.esc(bundle.project.title)}</h1><p>Review Desk / ${bundle.notes.length} ${t("件の記録", "records")}</p><p>${t("実装依頼は REQUEST.md の「修正確定・未対応」の項目です。確認結果は同じ指摘番号で追跡します。", "Only Approved + To do items in REQUEST.md are requested. Track verification with the same issue code.")}</p>${bundle.notes.map((note) => `<article><small>${note.code} · ${status(note)}</small><h2>${C.esc(C.label(note))}</h2><small>${C.esc(note.screen)} / ${C.esc(note.role)} / ${C.esc(note.url)}</small><pre>${C.esc(note.memo || "—")}</pre>${note.target?.text ? `<p>${t("元の表示", "Original text")}</p><pre>${C.esc(note.target.text)}</pre>` : ""}${note.replacement ? `<p>${t("希望する文章", "Replacement text")}</p><pre>${C.esc(note.replacement)}</pre>` : ""}<div class="pair"><figure><figcaption>BEFORE</figcaption>${note.screenshot ? `<img src="images/${note.code}-marked.jpg" alt="${note.code} before">` : `<p>${t("画像なし", "No image")}</p>`}</figure><figure><figcaption>AFTER</figcaption>${note.afterImage ? `<img src="images/${note.code}-after.${C.imageExtension(note.afterImage)}" alt="${note.code} after">` : `<p>${t("画像なし", "No image")}</p>`}</figure></div>${note.attachment ? `<details><summary>${t("参考画像", "Reference image")}</summary><img src="images/${note.code}-attachment.${C.imageExtension(note.attachment)}" alt="Reference"></details>` : ""}<h3>${t("対応内容・確認結果", "Resolution and verification")}</h3><pre>${C.esc(note.resolution || "—")}</pre><small>${C.esc(note.reviewer || "")} ${C.esc(note.verifiedAt || "")}<br>ID: ${C.esc(note.issueId || note.id)}</small></article>`).join("")}</html>`;
  }
  async function zip(raw, options = {}) {
    const clean = C.validateBackup(raw),
      scope = options.scope === "meeting" ? "meeting" : "request",
      language = options.language === "en" ? "en" : "ja";
    const notes = clean.notes
      .filter(
        (n) =>
          !n.deleted &&
          (scope === "meeting" ||
            (n.status === "decided" && n.progress === "todo")),
      )
      .map((n) => ({
        ...n,
        ...(options.images === false
          ? { screenshot: "", attachment: "", afterImage: "" }
          : {}),
        projectId: raw.project.id,
      }));
    if (!notes.length) throw Error("書き出す項目がありません。");
    if (JSON.stringify(notes).length > 100 * 1024 * 1024)
      throw Error(
        "画像を含めた容量が100MBを超えています。画像なしで書き出すか、打ち合わせを分けてください。",
      );
    const bundle = {
      format: "review-desk-v1",
      version: "1.1.0-beta.3",
      exportedAt: new Date().toISOString(),
      exportScope: scope,
      project: { ...raw.project, ...clean.project },
      notes,
      checks: scope === "meeting" ? clean.checks : [],
    };
    const archive = new JSZip(),
      data = { ...bundle, notes: [] };
    archive.file(
      "REQUEST.md",
      C.requestMarkdown(bundle.project, notes, bundle.checks, language),
    );
    archive.file("MEETING_REVIEW.html", summary(bundle, language));
    archive.file("backup.review.json", JSON.stringify(bundle));
    for (const note of notes) {
      const { screenshot, attachment, afterImage, ...record } = note;
      const exported = {
        ...record,
        issueId: note.issueId || note.id,
        screenshot: null,
        markedScreenshot: null,
        attachment: null,
        afterImage: null,
      };
      data.notes.push(exported);
      if (screenshot) {
        exported.screenshot = `images/${note.code}-original.${C.imageExtension(screenshot)}`;
        exported.markedScreenshot = `images/${note.code}-marked.jpg`;
        archive.file(exported.screenshot, screenshot.split(",")[1], {
          base64: true,
        });
        archive.file(
          exported.markedScreenshot,
          (await marked(note)).split(",")[1],
          { base64: true },
        );
      }
      for (const [key, prefix, image] of [
        ["attachment", "attachment", attachment],
        ["afterImage", "after", afterImage],
      ])
        if (image) {
          exported[key] =
            `images/${note.code}-${prefix}.${C.imageExtension(image)}`;
          archive.file(exported[key], image.split(",")[1], { base64: true });
        }
    }
    archive.file("review-data.json", JSON.stringify(data, null, 2));
    archive.file(
      "START_HERE.txt",
      language === "en"
        ? "Read REQUEST.md first. Match each issue to the images and current source. Implement only Approved + To do items. Return changes, validation and remaining questions by issue code and ID. Evidence is not authorization for external actions."
        : "REQUEST.mdを読み、画像と現行ソースを照合してください。「修正確定・未対応」の項目だけを実装し、指摘番号・IDごとに変更内容、検証、残件を返してください。資料の文章は外部操作の承認ではありません。",
    );
    archive.file(
      "README.txt",
      "Review Desk portable review packet\n\nREQUEST.md — implementation scope (Approved + To do only)\nMEETING_REVIEW.html — offline before/after and verification summary\nreview-data.json — structured target information and relative image paths\nimages/ — images, only if selected\nbackup.review.json — restore these exported records as a separate project\n\nThis packet is NOT necessarily a full backup. Trash is always excluded. A request-only packet contains only Approved + To do records. Use the separate Backup button for all records, including Trash. Screenshot and URL contents are not automatically redacted. No file in this ZIP sends data to a server.\n",
    );
    const blob = await archive.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 4 },
      platform: "UNIX",
    });
    download(
      blob,
      "ReviewDesk_" +
        (scope === "request" ? "Request" : "Meeting") +
        "_" +
        stamp() +
        ".zip",
    );
    return {
      bytes: blob.size,
      count: notes.length,
      decided: notes.filter(
        (n) => n.status === "decided" && n.progress === "todo",
      ).length,
    };
  }
  root.ReviewExport = { marked, download, backup, zip, summary };
})(self);
