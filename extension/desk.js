(async function () {
  "use strict";
  const C = ReviewCore,
    D = ReviewDB,
    $ = (id) => document.getElementById(id);
  let bundle,
    selected = "",
    session = null,
    rename = false,
    attachmentBusy = false,
    exportBundle;
  const status = (text, error = false) => {
    $("globalStatus").textContent = text;
    $("globalStatus").classList.toggle("error", error);
  };
  const ready = (value) => {
    for (const id of [
      "project",
      "newProject",
      "rename",
      "backup",
      "import",
      "export",
    ])
      $(id).disabled = !value;
  };
  const options = (map, value) =>
    Object.entries(map)
      .map(
        ([key, label]) =>
          `<option value="${C.esc(key)}" ${value === key ? "selected" : ""}>${C.esc(label)}</option>`,
      )
      .join("");
  if (!self.chrome?.runtime?.id) $("demoBanner").classList.remove("hidden");
  ready(false);
  async function load() {
    const project = await D.active();
    bundle = await D.bundle(project.id);
    $("project").innerHTML = (await D.all("projects"))
      .map(
        (p) =>
          `<option value="${C.esc(p.id)}" ${p.id === project.id ? "selected" : ""}>${C.esc(p.title)}</option>`,
      )
      .join("");
    const roleFilter = $("roleFilter").value;
    const roles = C.roles([
      ...(project.roles || C.ROLES),
      ...bundle.notes.map((n) => n.role),
    ]);
    $("roleFilter").innerHTML = options(
      { all: "すべての役割", ...Object.fromEntries(roles.map((r) => [r, r])) },
      roleFilter,
    );
    renderList();
    ready(true);
  }
  function filtered() {
    const query = $("search").value.toLocaleLowerCase(),
      filter = $("filter").value,
      role = $("roleFilter").value;
    return bundle.notes.filter(
      (n) =>
        (filter === "trash" ? n.deleted : !n.deleted) &&
        (filter === "all" ||
          filter === "trash" ||
          n.status === filter ||
          n.progress === filter) &&
        (role === "all" || n.role === role) &&
        [n.code, n.memo, n.replacement, n.screen, n.role]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query),
    );
  }
  function renderList() {
    if (!bundle) return;
    const active = bundle.notes.filter((n) => !n.deleted);
    $("stats").innerHTML = [
      ["記録", active.length],
      [
        "実装依頼",
        active.filter((n) => n.status === "decided" && n.progress === "todo")
          .length,
      ],
      ["確認待ち", active.filter((n) => n.progress === "verify").length],
    ]
      .map(([a, b]) => `<div><b>${b}</b><span>${a}</span></div>`)
      .join("");
    $("notes").innerHTML =
      filtered()
        .map(
          (n) =>
            `<button class="note-card ${n.id === selected ? "active" : ""}" data-id="${C.esc(n.id)}" aria-pressed="${n.id === selected}"><div class="row spread"><span class="code">${n.code}</span><span class="pill ${n.status}">${C.STATUS[n.status]}</span></div><div class="headline">${C.esc(C.label(n))}</div><div class="meta">${C.esc(n.screen)} · ${C.esc(n.role)}<br>${C.PROGRESS[n.progress]}</div></button>`,
        )
        .join("") ||
      '<p class="muted empty-list">該当するメモはありません。</p>';
    $("notes")
      .querySelectorAll("[data-id]")
      .forEach((button) => (button.onclick = () => select(button.dataset.id)));
  }
  function empty() {
    $("detail").innerHTML =
      `<div class="empty"><span class="eyebrow">CAPTURE → DECIDE → HAND OFF → VERIFY</span><h2>「ここを変えたい」を、<br>同じ番号で最後まで。</h2><div class="step"><b>01</b><div><h3>確認したいWebサイトで開く</h3><p>Chromeの拡張機能 → Review Desk →「この画面でメモする」。</p></div></div><div class="step"><b>02</b><div><h3>場所を指定して、短くメモ</h3><p>文字・画像・範囲を指定すると、画面とメモが端末に保存されます。</p></div></div><div class="step"><b>03</b><div><h3>決まった項目を「修正確定」に</h3><p>修正依頼をZIPで書き出し、人やAIへ渡します。</p></div></div><div class="step"><b>04</b><div><h3>修正後の画像と、確認した結果を残す</h3><p>指摘番号を保ち、確認待ちから確認済みへ進めます。</p></div></div><p><a href="demo.html">架空のサイトで操作を練習する ↗</a></p><div id="checks" class="checks"></div></div>`;
    renderChecks();
  }
  function renderChecks() {
    const element = $("checks");
    if (!element) return;
    element.innerHTML =
      '<h3>画面の確認記録</h3><p class="muted">打ち合わせで見た画面の記録です。修正完了の承認とは別です。</p>' +
      bundle.checks
        .map(
          (c) =>
            `<div class="check-row"><span>${C.esc(c.screen)} / ${C.esc(c.role)} / ${c.viewport.width}px<br>${c.checked ? "確認済み" : "未確認"}</span><button data-key="${C.esc(c.id)}">${c.checked ? "未確認に戻す" : "確認済みに"}</button></div>`,
        )
        .join("");
    element.querySelectorAll("button").forEach(
      (button) =>
        (button.onclick = async () => {
          try {
            const check = bundle.checks.find(
              (c) => c.id === button.dataset.key,
            );
            await D.check(bundle.project.id, check, !check.checked);
            bundle = await D.bundle(bundle.project.id);
            renderChecks();
          } catch (error) {
            status(error.message, true);
          }
        }),
    );
  }
  async function flush() {
    if (attachmentBusy) {
      status("画像を保存しています。完了までお待ちください。");
      return false;
    }
    if (session) await session.tail;
    if (session?.failed) {
      status(
        "未保存の入力があります。入力をダウンロードしてから開き直してください。",
        true,
      );
      return false;
    }
    return true;
  }
  async function select(id) {
    if (!(await flush())) return;
    try {
      const note = await D.get("notes", id);
      if (!note) throw Error("メモが見つかりません。");
      selected = id;
      session = { note, tail: Promise.resolve(), failed: false, pending: 0 };
      renderList();
      renderDetail(note);
    } catch (error) {
      status(error.message, true);
    }
  }
  function renderDetail(note) {
    const rect = note.rect,
      viewport = note.viewport;
    const box = rect
      ? `left:${(100 * rect.x) / viewport.width}%;top:${(100 * rect.y) / viewport.height}%;width:${(100 * rect.width) / viewport.width}%;height:${(100 * rect.height) / viewport.height}%`
      : "";
    const roles = C.roles([...(bundle.project.roles || C.ROLES), note.role]);
    $("detail").innerHTML =
      `<div class="detail-head"><div><span class="eyebrow">${note.code} / ${C.KINDS[note.kind]}</span><h2>${C.esc(note.screen)}</h2></div><button id="home">確認記録へ</button></div><div class="detail-grid"><div class="evidence"><span class="eyebrow">BEFORE / 記録時</span><div class="shot" id="shot" role="button" tabindex="0" aria-label="修正前の画像を拡大">${note.screenshot ? `<img src="${note.screenshot}" alt="修正前の画面">` : "画像なし"}${rect ? `<span class="mark" style="${box}"></span>` : ""}</div><div class="metadata">${C.esc(note.url)}<br>${C.esc(note.role)} · ${viewport.width} × ${viewport.height}<br>${C.esc(note.createdAt)}</div><span class="eyebrow">AFTER / 修正後</span><div id="afterPreview">${note.afterImage ? `<img class="attachment" src="${note.afterImage}" alt="修正後の画面">` : '<p class="muted">修正後の画面を添付すると比較できます。</p>'}</div><label>修正後の画像<input type="file" id="afterFile" accept="image/png,image/jpeg,image/webp"></label>${note.target?.text ? `<div class="source"><strong>記録した元の表示</strong>${C.esc(note.target.text)}</div>` : ""}<details><summary>参考・差し替え画像</summary><input type="file" id="attachmentFile" aria-label="参考画像" accept="image/png,image/jpeg,image/webp"><div id="attachmentPreview">${note.attachment ? `<img class="attachment" src="${note.attachment}" alt="参考画像">` : ""}</div><button id="removeAttachment">参考画像を外す</button></details></div><div><label>打ち合わせメモ<textarea id="memo" maxlength="12000" placeholder="どう変えたいか、短く入力">${C.esc(note.memo)}</textarea></label>${note.kind === "text" ? `<label>変更後の文章<textarea id="replacement" maxlength="12000">${C.esc(note.replacement)}</textarea></label>` : ""}<div class="row"><label>判断<select id="decision">${options(C.STATUS, note.status)}</select></label><label>変更の範囲<select id="scope">${options({ this: "この箇所だけ", common: "同じ種類の項目にも" }, note.scope)}</select></label></div><details><summary>画面名・役割</summary><label>画面名<input id="screen" maxlength="200" value="${C.esc(note.screen)}"></label><label>確認する役割<select id="role">${options(Object.fromEntries(roles.map((r) => [r, r])), note.role)}</select></label></details><div class="verification"><h3>修正後の確認</h3><label>対応内容・確認メモ<textarea id="resolution" maxlength="12000" placeholder="何を修正し、何を確認したか。残件があれば記入。">${C.esc(note.resolution)}</textarea></label><label>確認者（任意）<input id="reviewer" maxlength="200" value="${C.esc(note.reviewer || "")}"></label><label>修正の対応状況<select id="progress">${options(C.PROGRESS, note.progress)}</select></label><p id="verifiedAt" class="muted">${note.verifiedAt ? "確認日時: " + C.esc(note.verifiedAt) : "確認結果を入力してから「確認済み」にします。"}</p></div><div id="saveStatus" class="statusline" role="status">端末に保存済み</div><div id="recovery" class="hidden notice"><p>未保存の入力を保存し、最新の記録と照合できます。</p><button id="downloadDraft">未保存の入力をダウンロード</button><button id="reloadNote" disabled>保存済みの記録を開き直す</button></div><details><summary>判断・対応の履歴</summary><div id="history"></div></details><button class="danger" id="trash">${note.deleted ? "ごみ箱から戻す" : "ごみ箱に移す"}</button></div></div>`;
    for (const id of [
      "memo",
      "replacement",
      "screen",
      "resolution",
      "reviewer",
    ])
      if ($(id)) $(id).oninput = () => save({ [id]: $(id).value });
    for (const id of ["decision", "scope", "role", "progress"])
      $(id).onchange = () => {
        if (
          $("decision").value === "decided" &&
          !$("memo").value.trim() &&
          !$("replacement")?.value.trim()
        ) {
          $("decision").value = session.note.status;
          localStatus("メモまたは修正文を入力してから確定してください。", true);
          return;
        }
        if (
          $("progress").value !== "todo" &&
          $("decision").value !== "decided"
        ) {
          $("progress").value = session.note.progress;
          localStatus("修正確定の項目で対応状況を設定してください。", true);
          return;
        }
        if ($("progress").value === "done" && !$("resolution").value.trim()) {
          $("progress").value = session.note.progress;
          localStatus("確認した内容を記入してください。", true);
          return;
        }
        save({ [id === "decision" ? "status" : id]: $(id).value });
      };
    $("home").onclick = async () => {
      if (!(await flush())) return;
      selected = "";
      session = null;
      renderList();
      empty();
    };
    $("trash").onclick = async () => {
      if (!(await flush())) return;
      await save({ deleted: !session.note.deleted });
      if (!session.failed) {
        selected = "";
        session = null;
        await load();
        empty();
      }
    };
    const zoom = async () => {
      try {
        if (!session.note.screenshot) return;
        $("zoomImage").src = await ReviewExport.marked(session.note);
        $("zoom").showModal();
      } catch (error) {
        localStatus(error.message, true);
      }
    };
    $("shot").onclick = zoom;
    $("shot").onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        zoom();
      }
    };
    $("attachmentFile").onchange = (event) => attach(event, "attachment");
    $("afterFile").onchange = (event) => attach(event, "afterImage");
    $("removeAttachment").onclick = async () => {
      if (!(await flush())) return;
      await save({ attachment: "", attachmentName: "" });
      if (!session.failed) $("attachmentPreview").replaceChildren();
    };
    $("downloadDraft").onclick = () => {
      ReviewExport.download(
        new Blob(
          [
            JSON.stringify(
              {
                format: "review-desk-draft-v1",
                code: session.note.code,
                issueId: session.note.issueId || session.note.id,
                patch: formValues(),
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
        "ReviewDesk_Unsaved_" + session.note.code + ".json",
      );
      $("reloadNote").disabled = false;
    };
    $("reloadNote").onclick = async () => {
      const id = selected;
      session = null;
      await select(id);
    };
    renderHistory(note);
  }
  function renderHistory(note) {
    if ($("history"))
      $("history").innerHTML =
        (note.history || [])
          .slice()
          .reverse()
          .map(
            (h) =>
              `<p class="muted">${C.esc(h.at)}<br>${C.esc(C.STATUS[h.status] || h.status)} / ${C.esc(C.PROGRESS[h.progress] || h.progress)}${h.toProgress ? " → " + C.esc(C.STATUS[h.toStatus]) + " / " + C.esc(C.PROGRESS[h.toProgress]) : ""}</p>`,
          )
          .join("") || '<p class="muted">まだ変更はありません。</p>';
  }
  function formValues() {
    if (
      $("decision").value === "decided" &&
      !$("memo").value.trim() &&
      !$("replacement")?.value.trim()
    )
      $("decision").value = "discuss";
    return {
      memo: $("memo").value,
      replacement: $("replacement")?.value || "",
      screen: $("screen").value,
      role: $("role").value,
      status: $("decision").value,
      scope: $("scope").value,
      progress: $("progress").value,
      resolution: $("resolution").value,
      reviewer: $("reviewer").value,
    };
  }
  function localStatus(text, error = false) {
    if ($("saveStatus")) {
      $("saveStatus").textContent = text;
      $("saveStatus").classList.toggle("error", error);
    }
  }
  function save(patch, owner = session) {
    if (!owner) return Promise.resolve();
    owner.pending++;
    localStatus("保存中…");
    owner.tail = owner.tail
      .then(async () => {
        if (owner.failed)
          throw Error("未保存の入力をダウンロードしてから開き直してください。");
        owner.note = await D.updateNote(
          owner.note.id,
          owner.note.revision,
          patch,
        );
        bundle.notes = bundle.notes.map((n) =>
          n.id === owner.note.id ? owner.note : n,
        );
        renderList();
        if (owner === session) {
          // Apply only automatic invalidation. Never replace fields the reviewer is still typing.
          if (owner.pending === 1) {
            $("progress").value = owner.note.progress;
            $("decision").value = owner.note.status;
          }
          if (
            owner.note.status === "discuss" &&
            $("decision").value === "decided" &&
            !$("memo").value.trim() &&
            !$("replacement")?.value.trim()
          )
            $("decision").value = "discuss";
          $("verifiedAt").textContent = owner.note.verifiedAt
            ? "確認日時: " + owner.note.verifiedAt
            : "確認結果を記録できます。";
          localStatus(
            owner.pending === 1
              ? "端末に保存済み · " + new Date().toLocaleTimeString("ja-JP")
              : "保存中…",
          );
          renderHistory(owner.note);
        }
      })
      .catch((error) => {
        owner.failed = true;
        if (owner === session) {
          localStatus(error.message, true);
          $("recovery")?.classList.remove("hidden");
        }
        status("未保存の入力があります。", true);
      })
      .finally(() => owner.pending--);
    return owner.tail;
  }
  async function attach(event, key) {
    const owner = session;
    attachmentBusy = true;
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024)
        throw Error("画像は8MB以下にしてください。");
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(Error("画像を読み込めません。"));
        reader.readAsDataURL(file);
      });
      C.imageData(data, false);
      const image = new Image();
      image.src = data;
      await image.decode();
      if (image.naturalWidth * image.naturalHeight > 40000000)
        throw Error("画像の解像度を小さくしてください（40メガピクセルまで）。");
      await save(
        {
          [key]: data,
          ...(key === "attachment" ? { attachmentName: file.name } : {}),
        },
        owner,
      );
      if (owner === session && !owner.failed) {
        $(
          key === "attachment" ? "attachmentPreview" : "afterPreview",
        ).innerHTML =
          `<img class="attachment" src="${data}" alt="${key === "afterImage" ? "修正後の画面" : "参考画像"}">`;
        $("progress").value = owner.note.progress;
      }
    } catch (error) {
      localStatus(error.message, true);
    } finally {
      attachmentBusy = false;
      event.target.value = "";
    }
  }
  $("search").oninput =
    $("filter").onchange =
    $("roleFilter").onchange =
      renderList;
  $("project").onchange = async () => {
    try {
      if (!(await flush())) {
        $("project").value = bundle.project.id;
        return;
      }
      await D.selectProject($("project").value);
      selected = "";
      session = null;
      await load();
      empty();
    } catch (error) {
      status(error.message, true);
    }
  };
  async function settings(existing) {
    if (!(await flush())) return;
    rename = existing;
    $("newName").value = existing
      ? bundle.project.title
      : "Review / " + new Date().toISOString().slice(0, 10);
    $("newRoles").value = C.roles(existing ? bundle.project.roles : undefined)
      .filter((r) => r !== "未指定")
      .join("\n");
    $("settingsError").textContent = "";
    $("nameDialog").showModal();
  }
  $("newProject").onclick = () => settings(false);
  $("rename").onclick = () => settings(true);
  $("cancelName").onclick = () => $("nameDialog").close();
  $("nameForm").onsubmit = async (event) => {
    event.preventDefault();
    try {
      if (!(await flush())) return;
      const roles = $("newRoles")
        .value.split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (roles.length > 29) throw Error("役割は29個まで設定できます。");
      if (rename)
        await D.updateProject(bundle.project.id, {
          title: $("newName").value,
          roles,
        });
      else {
        await D.createProject($("newName").value, roles);
        selected = "";
        session = null;
      }
      $("nameDialog").close();
      await load();
      if (selected) await select(selected);
      else empty();
    } catch (error) {
      $("settingsError").textContent = error.message;
    }
  };
  $("backup").onclick = async () => {
    try {
      if (!(await flush())) return;
      ReviewExport.backup(await D.bundle(bundle.project.id));
      status("バックアップを保存しました。ごみ箱も含みます。");
    } catch (error) {
      status(error.message, true);
    }
  };
  function preview() {
    const notes = exportBundle.notes.filter(
      (n) =>
        !n.deleted &&
        ($("exportScope").value === "meeting" ||
          (n.status === "decided" && n.progress === "todo")),
    );
    $("exportPreview").textContent =
      `共有する記録 ${notes.length}件 / 実装依頼 ${notes.filter((n) => n.status === "decided" && n.progress === "todo").length}件。${notes.map((n) => n.code).join("、") || "該当なし"}`;
    $("confirmExport").disabled = !notes.length;
  }
  $("export").onclick = async () => {
    try {
      if (!(await flush())) return;
      exportBundle = await D.bundle(bundle.project.id);
      preview();
      $("exportDialog").showModal();
    } catch (error) {
      status(error.message, true);
    }
  };
  $("exportScope").onchange = preview;
  $("cancelExport").onclick = () => $("exportDialog").close();
  $("confirmExport").onclick = async () => {
    $("confirmExport").disabled = true;
    status("画像付きZIPを作成しています…");
    try {
      const result = await ReviewExport.zip(exportBundle, {
        scope: $("exportScope").value,
        language: $("exportLanguage").value,
        images: $("exportImages").checked,
      });
      $("exportDialog").close();
      status(
        `ZIPを保存しました。実装依頼 ${result.decided}件 / 共有記録 ${result.count}件。`,
      );
    } catch (error) {
      status("書き出せませんでした：" + error.message, true);
    } finally {
      $("confirmExport").disabled = false;
    }
  };
  $("import").onclick = () => $("importFile").click();
  $("importFile").onchange = async (event) => {
    try {
      if (!(await flush())) return;
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 100 * 1024 * 1024)
        throw Error("バックアップは100MBまで読み込めます。");
      await D.restore(JSON.parse(await file.text()));
      selected = "";
      session = null;
      await load();
      empty();
      status(
        "別の打ち合わせとして復元しました。元の記録と指摘番号を保持しています。",
      );
    } catch (error) {
      status("読み込めませんでした：" + error.message, true);
    } finally {
      event.target.value = "";
    }
  };
  $("closeZoom").onclick = () => $("zoom").close();
  window.addEventListener("beforeunload", (event) => {
    if (session?.failed || session?.pending || attachmentBusy) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  async function start() {
    ready(false);
    try {
      await load();
      let wanted = "";
      try {
        wanted = decodeURIComponent(location.hash.slice(1));
      } catch {}
      if (wanted) {
        const note = await D.get("notes", wanted);
        if (note) {
          if (note.projectId !== bundle.project.id) {
            await D.selectProject(note.projectId);
            await load();
          }
          await select(wanted);
        } else empty();
      } else empty();
      status("端末に保存済みの記録を表示しています。");
    } catch (error) {
      status("記録を開けませんでした：" + error.message, true);
      $("detail").innerHTML =
        '<div class="empty"><h2>記録を開けませんでした</h2><p>ほかのReview Desk画面を閉じ、再試行してください。保存済みデータは削除しません。</p><button id="retryLoad">読み込みをやり直す</button></div>';
      $("retryLoad").onclick = start;
    }
  }
  await start();
})();
