document.getElementById("start").onclick = async () => {
  const msg = document.getElementById("message"),
    button = document.getElementById("start");
  button.disabled = true;
  msg.textContent = "保存先を準備しています…";
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!/^https?:/.test(tab?.url || ""))
      throw Error("確認したいWebページを開いてから押してください。");
    const project = await ReviewClient.request("CONTEXT");
    if (!project?.id)
      throw Error(
        "打ち合わせ情報を読み込めませんでした。もう一度押してください。",
      );
    msg.textContent = "メモパネルを準備しています…";
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["core.js", "client.js", "content.js"],
    });
    const result = results.find((r) => r.frameId === 0)?.result;
    if (result?.ok === false)
      throw Error(
        result.error || "画面上の「準備をやり直す」を押してください。",
      );
    window.close();
  } catch (e) {
    msg.textContent = "開始できませんでした。" + e.message;
  } finally {
    button.disabled = false;
  }
};
document.getElementById("desk").onclick = () =>
  chrome.tabs.create({ url: chrome.runtime.getURL("desk.html") });
