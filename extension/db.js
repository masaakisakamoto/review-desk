/* Keep this database name, version and stores stable across in-place updates. */
(function (root) {
  "use strict";
  const C = ReviewCore;
  let opening, openingToken;
  function db() {
    if (opening) return opening;
    const token = (openingToken = {});
    opening = new Promise((resolve, reject) => {
      let settled = false,
        request;
      const fail = (code, message) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (openingToken === token) opening = null;
        reject(Object.assign(new Error(message), { code }));
      };
      const timer = setTimeout(
        () =>
          fail(
            "DB_OPEN_TIMEOUT",
            "保存領域を開く処理が応答しません。ほかのReview Desk画面を閉じて再試行してください。",
          ),
        8000,
      );
      try {
        request = indexedDB.open("review-desk-v1", 1);
      } catch {
        fail(
          "DB_OPEN_ERROR",
          "保存領域を開けません。このChromeの設定と空き容量を確認してください。",
        );
        return;
      }
      request.onupgradeneeded = () => {
        if (settled) {
          request.transaction.abort();
          return;
        }
        for (const name of ["projects", "notes", "checks", "meta"]) {
          if (!request.result.objectStoreNames.contains(name))
            request.result.createObjectStore(name, { keyPath: "id" });
        }
      };
      request.onblocked = () =>
        fail(
          "DB_BLOCKED",
          "別のReview Desk画面が保存領域を使用中です。その画面を閉じて再試行してください。",
        );
      request.onerror = () =>
        fail(
          "DB_OPEN_ERROR",
          "保存領域を開けません。Chromeの設定と空き容量を確認してください。",
        );
      request.onsuccess = () => {
        const connection = request.result;
        if (settled) {
          connection.close();
          return;
        }
        settled = true;
        clearTimeout(timer);
        connection.onversionchange = () => {
          connection.close();
          if (openingToken === token) opening = null;
        };
        connection.onclose = () => {
          if (openingToken === token) opening = null;
        };
        resolve(connection);
      };
    });
    // Synchronous open failures must not leave a rejected promise cached.
    const current = opening;
    current.catch(() => {
      if (openingToken === token && opening === current) opening = null;
    });
    return current;
  }
  const req = (request) =>
    new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  async function tx(names, mode, fn) {
    const connection = await db(),
      transaction = connection.transaction(names, mode);
    const done = new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onabort = () =>
        reject(transaction.error || Error("保存を完了できませんでした。"));
      transaction.onerror = () => {};
    });
    try {
      const result = await fn(transaction);
      await done;
      return result;
    } catch (error) {
      try {
        transaction.abort();
      } catch {}
      await done.catch(() => {});
      if (error.name === "QuotaExceededError")
        throw Error(
          "端末の保存容量が不足しています。入力内容を控え、保存済みの記録をバックアップしてください。",
        );
      throw error;
    }
  }
  const get = (store, id) =>
    tx([store], "readonly", (t) => req(t.objectStore(store).get(id)));
  const all = (store) =>
    tx([store], "readonly", (t) => req(t.objectStore(store).getAll()));
  function newProject(title) {
    return {
      id: C.uid(),
      title:
        C.text(title, 120).trim() ||
        "Review / " + new Date().toISOString().slice(0, 10),
      role: "未指定",
      roles: C.roles(),
      nextNumber: 1,
      createdAt: new Date().toISOString(),
    };
  }
  async function active() {
    return tx(["meta", "projects"], "readwrite", async (t) => {
      const meta = t.objectStore("meta"),
        projects = t.objectStore("projects");
      const selection = await req(meta.get("active"));
      let project = selection && (await req(projects.get(selection.value)));
      if (!project) {
        project = newProject();
        projects.put(project);
        meta.put({ id: "active", value: project.id });
      }
      return project;
    });
  }
  const createProject = (title, roles) =>
    tx(["meta", "projects"], "readwrite", (t) => {
      const project = newProject(title);
      if (roles !== undefined) project.roles = C.roles(roles);
      t.objectStore("projects").put(project);
      t.objectStore("meta").put({ id: "active", value: project.id });
      return project;
    });
  async function selectProject(id) {
    return tx(["meta", "projects"], "readwrite", async (t) => {
      if (!(await req(t.objectStore("projects").get(id))))
        throw Error("打ち合わせが見つかりません。");
      t.objectStore("meta").put({ id: "active", value: id });
      return true;
    });
  }
  const updateProject = (id, patch) =>
    tx(["projects"], "readwrite", async (t) => {
      const store = t.objectStore("projects"),
        project = await req(store.get(id));
      if (!project) throw Error("打ち合わせが見つかりません。");
      if (patch.title !== undefined)
        project.title = C.text(patch.title, 120).trim() || project.title;
      if (patch.roles !== undefined) project.roles = C.roles(patch.roles);
      if (patch.role !== undefined) project.role = C.role(patch.role);
      store.put(project);
      return project;
    });
  async function createNote(projectId, capture, screenshot) {
    const c = C.capture(capture),
      image = C.imageData(screenshot);
    return tx(["projects", "notes"], "readwrite", async (t) => {
      const projects = t.objectStore("projects"),
        project = await req(projects.get(projectId));
      if (!project) throw Error("打ち合わせが見つかりません。");
      if (
        !Number.isSafeInteger(project.nextNumber) ||
        project.nextNumber < 1 ||
        project.nextNumber > 999999
      )
        throw Error(
          "指摘番号を確認できません。バックアップから別の打ち合わせに復元してください。",
        );
      const id = C.uid();
      const note = {
        ...c,
        id,
        issueId: id,
        projectId,
        code: "R-" + String(project.nextNumber++).padStart(4, "0"),
        revision: 1,
        memo: "",
        replacement: "",
        scope: "this",
        status: "discuss",
        progress: "todo",
        resolution: "",
        reviewer: "",
        verifiedAt: "",
        screenshot: image,
        attachment: "",
        afterImage: "",
        deleted: false,
        history: [],
        updatedAt: new Date().toISOString(),
      };
      projects.put(project);
      t.objectStore("notes").put(note);
      return note;
    });
  }
  const updateNote = (id, revision, raw) =>
    tx(["notes"], "readwrite", async (t) => {
      const patch = C.patch(raw),
        store = t.objectStore("notes"),
        note = await req(store.get(id));
      if (!note) throw Error("メモが見つかりません。");
      if (note.revision !== revision)
        throw Error(
          "別の画面でこのメモが更新されました。未保存の入力をダウンロードしてから開き直してください。",
        );
      const next = { ...note, ...patch };
      if (
        next.status === "decided" &&
        !next.memo.trim() &&
        !next.replacement.trim()
      )
        next.status = "discuss";
      if (patch.status === "decided" && next.status !== "decided")
        throw Error("メモまたは修正文を入れてから確定してください。");
      if (
        patch.progress === "done" &&
        note.progress !== "done" &&
        !next.resolution.trim()
      )
        throw Error("確認した内容を「対応内容・確認メモ」に記入してください。");
      if (next.status !== "decided" && next.progress !== "todo")
        next.progress = "todo";
      // Editing the agreed request reopens completed work; a stale approval cannot survive changed requirements.
      if (
        note.progress !== "todo" &&
        ["memo", "replacement", "scope"].some(
          (k) => k in patch && patch[k] !== note[k],
        )
      )
        next.progress = "todo";
      if (
        patch.afterImage !== undefined &&
        patch.afterImage !== note.afterImage &&
        note.progress === "done"
      )
        next.progress = "verify";
      const now = new Date().toISOString();
      if (next.status !== note.status || next.progress !== note.progress) {
        next.history = [
          ...(note.history || []),
          {
            at: now,
            status: note.status,
            progress: note.progress,
            toStatus: next.status,
            toProgress: next.progress,
            resolution: next.resolution,
            reviewer: next.reviewer || "",
          },
        ].slice(-200);
      }
      next.verifiedAt =
        next.progress === "done"
          ? note.progress === "done"
            ? note.verifiedAt || ""
            : now
          : "";
      next.issueId = note.issueId || note.id;
      Object.assign(next, { revision: note.revision + 1, updatedAt: now });
      store.put(next);
      return next;
    });
  const bundle = (projectId) =>
    tx(["projects", "notes", "checks"], "readonly", async (t) => {
      const project = await req(t.objectStore("projects").get(projectId));
      if (!project) throw Error("打ち合わせが見つかりません。");
      const notes = await req(t.objectStore("notes").getAll());
      const checks = await req(t.objectStore("checks").getAll());
      return {
        format: "review-desk-v1",
        version: "1.1.0-beta.3",
        exportedAt: new Date().toISOString(),
        project,
        notes: notes
          .filter((n) => n.projectId === projectId)
          .sort((a, b) => Number(a.code.slice(2)) - Number(b.code.slice(2))),
        checks: checks.filter((c) => c.projectId === projectId),
      };
    });
  async function check(projectId, capture, checked) {
    const c = C.capture(capture),
      key = C.screenKey(c);
    const data = {
      ...c,
      id: projectId + "|" + key,
      key,
      projectId,
      checked: !!checked,
    };
    await tx(["checks"], "readwrite", (t) => t.objectStore("checks").put(data));
    return data;
  }
  async function restore(raw) {
    const clean = C.validateBackup(raw);
    return tx(["projects", "notes", "checks", "meta"], "readwrite", (t) => {
      const project = {
        ...newProject(clean.project.title + "（読み込み）"),
        role: clean.project.role,
        roles: clean.project.roles,
      };
      let max = 0;
      for (const note of clean.notes) {
        max = Math.max(max, Number(note.code.slice(2)));
        t.objectStore("notes").put({
          ...note,
          id: C.uid(),
          issueId: note.issueId || note.id,
          projectId: project.id,
        });
      }
      project.nextNumber = max + 1;
      t.objectStore("projects").put(project);
      for (const check of clean.checks)
        t.objectStore("checks").put({
          ...check,
          id: project.id + "|" + check.key,
          projectId: project.id,
        });
      t.objectStore("meta").put({ id: "active", value: project.id });
      return project;
    });
  }
  root.ReviewDB = {
    active,
    createProject,
    selectProject,
    updateProject,
    createNote,
    updateNote,
    bundle,
    check,
    restore,
    all,
    get,
  };
})(self);
