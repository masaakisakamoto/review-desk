/* Explicit practice adapter. Never loaded by the popup or injected into a website. */
let practiceProject;
async function practiceShot() {
  const canvas = document.createElement("canvas");
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f1eb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#252729";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("PRACTICE — synthetic image / Review Desk", 40, 48);
  ctx.font = "14px sans-serif";
  ctx.fillText(
    "This is not a screenshot. Live-tab capture requires the Chrome extension.",
    40,
    77,
  );
  for (const element of document.querySelectorAll(
    ".sample button,.sample h1,.sample .cell,.sample #description,.sample img",
  )) {
    const r = element.getBoundingClientRect();
    if (r.y > innerHeight) continue;
    ctx.strokeStyle = "#a6a49d";
    ctx.strokeRect(r.x, r.y, r.width, r.height);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#555d5b";
    ctx.fillText(
      (element.innerText || element.alt || "").slice(0, 50),
      r.x + 6,
      r.y + 20,
    );
    if (element.tagName === "IMG")
      ctx.drawImage(element, r.x, r.y, r.width, r.height);
  }
  return canvas.toDataURL("image/jpeg", 0.9);
}
self.ReviewClient = {
  request: async (type, message = {}) => {
    switch (type) {
      case "CONTEXT":
        return (practiceProject = await ReviewDB.active());
      case "PROJECT_ROLE":
        return (practiceProject = await ReviewDB.updateProject(
          message.projectId,
          { role: message.role },
        ));
      case "CAPTURE":
        return { screenshot: await practiceShot() };
      case "CREATE_NOTE":
        return ReviewDB.createNote(
          message.projectId,
          message.capture,
          message.screenshot,
        );
      case "UPDATE_NOTE":
        return ReviewDB.updateNote(message.id, message.revision, message.patch);
      case "LIST":
        return (await ReviewDB.bundle(message.projectId)).notes.filter(
          (note) => !note.deleted,
        );
      case "GET_NOTE":
        return ReviewDB.get("notes", message.id);
      case "CHECK":
        return ReviewDB.check(
          message.projectId,
          message.capture,
          message.checked,
        );
      case "OPEN_DESK":
        window.open(
          "desk.html" + (message.id ? "#" + message.id : ""),
          "reviewdesk_practice",
        );
        return true;
      default:
        throw Error("Unsupported practice action");
    }
  },
};
document.getElementById("launch").onclick = async () => {
  const button = document.getElementById("launch");
  button.disabled = true;
  try {
    if (!practiceProject) {
      practiceProject = (await ReviewDB.all("projects")).find(
        (project) => project.title === "Demo / Fieldnotes Studio",
      );
      if (!practiceProject)
        practiceProject = await ReviewDB.createProject(
          "Demo / Fieldnotes Studio",
        );
      else await ReviewDB.selectProject(practiceProject.id);
    }
    const script = document.createElement("script");
    script.src = "content.js";
    script.onload = () => script.remove();
    script.onerror = () => {
      button.textContent = "読み込めません。ページを再読み込みしてください。";
    };
    document.body.append(script);
  } catch (error) {
    button.textContent = error.message;
  } finally {
    button.disabled = false;
  }
};
document.getElementById("explore").onclick = () => {
  document.getElementById("clicked").textContent =
    "架空の操作です。外部へ情報は送信しません。";
};
