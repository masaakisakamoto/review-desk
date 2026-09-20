importScripts("core.js", "db.js");
("use strict");
async function reviewMessage(m, sender) {
  if (!sender || sender.id !== chrome.runtime.id)
    throw Error(
      "拡張機能からの操作を確認できません。Webページを再読み込みして開き直してください。",
    );
  if (!m || typeof m.type !== "string")
    throw Error("操作の種類を確認できません。");
  const own = sender.url?.startsWith(chrome.runtime.getURL(""));
  if (!own && (sender.frameId !== 0 || !ReviewCore.safeUrl(sender.url)))
    throw Error("この画面では使用できません。");
  switch (m.type) {
    case "CONTEXT":
      return ReviewDB.active();
    case "PROJECT_ROLE":
      return ReviewDB.updateProject(m.projectId, { role: m.role });
    case "LIST": {
      const b = await ReviewDB.bundle(m.projectId);
      return b.notes
        .filter((n) => !n.deleted)
        .map(({ screenshot, attachment, afterImage, ...n }) => n);
    }
    case "GET_NOTE": {
      const note = await ReviewDB.get("notes", m.id);
      if (!note) throw Error("メモが見つかりません。");
      return note;
    }
    case "UPDATE_NOTE":
      return ReviewDB.updateNote(m.id, m.revision, m.patch);
    case "CHECK":
      return ReviewDB.check(m.projectId, m.capture, m.checked);
    case "OPEN_DESK":
      await chrome.tabs.create({
        url:
          chrome.runtime.getURL("desk.html") +
          (m.id ? "#" + encodeURIComponent(m.id) : ""),
      });
      return true;
    case "CAPTURE": {
      if (!sender.tab?.id) throw Error("対象のタブが見つかりません。");
      const before = await chrome.tabs.get(sender.tab.id);
      if (!before.active || before.url !== (m.pageUrl || sender.url))
        throw Error("対象の画面を手前に戻して、もう一度指定してください。");
      const shot = await chrome.tabs.captureVisibleTab(sender.tab.windowId, {
        format: "jpeg",
        quality: 87,
      });
      const [after, active] = await Promise.all([
        chrome.tabs.get(sender.tab.id),
        chrome.tabs.query({ active: true, windowId: sender.tab.windowId }),
      ]);
      if (
        !after.active ||
        active[0]?.id !== sender.tab.id ||
        after.url !== before.url
      )
        throw Error("撮影中にタブが変わりました。画面を指定し直してください。");
      return { screenshot: shot };
    }
    case "CREATE_NOTE":
      return ReviewDB.createNote(m.projectId, m.capture, m.screenshot);
    default:
      throw Error("対応していない操作です。");
  }
}
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  reviewMessage(m, sender).then(
    (data) => reply({ ok: true, data }),
    (e) =>
      reply({
        ok: false,
        error: e.message || "処理できませんでした。",
        code: e.code || "BACKGROUND_" + (m?.type || "UNKNOWN"),
      }),
  );
  return true;
});
