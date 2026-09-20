(function () {
  "use strict";
  const HOST = "__review_desk_1";
  const old = document.getElementById(HOST);
  if (old) {
    old.dispatchEvent(new Event("reviewdesk-open"));
    return old.__reviewDeskReady || { ok: true };
  }
  const C = ReviewCore,
    host = document.createElement("div");
  host.id = HOST;
  host.style.cssText =
    "all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;";
  // Keep panel contents out of ordinary page-side shadowRoot traversal.
  // This is privacy hygiene, not a security boundary against a hostile page.
  const sh = host.attachShadow({ mode: "closed" });
  document.documentElement.append(host);
  sh.innerHTML = `<style>
  :host{all:initial}*{box-sizing:border-box}button,input,textarea,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.5;cursor:wait}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #9ca8b1;outline-offset:2px}
  .desk{font:14px/1.65 -apple-system,BlinkMacSystemFont,'Hiragino Sans','Noto Sans JP',sans-serif;color:#252627;pointer-events:none}#panel,#dock{pointer-events:auto}h2,h3,p{margin:0}button{border:1px solid #d5ded8;border-radius:9px;background:white;color:#252627;padding:9px 12px}button:hover{background:#f0f4ef}.primary{background:#292b2d;color:#fff;border-color:#292b2d}.primary:hover{background:#434648}.muted{font-size:12px;color:#616568}.error{color:#b43335}.top{display:flex;justify-content:space-between;align-items:center;gap:8px}.row{display:flex;gap:8px;align-items:center}.row>*{min-width:0}.row>label{flex:1}
  #panel{position:fixed;right:18px;top:18px;bottom:88px;width:350px;background:#faf9f6;border:1px solid #d9e0d8;border-radius:12px;box-shadow:0 16px 64px #16372d30;display:flex;flex-direction:column;overflow:hidden}header{padding:18px 20px 12px;border-bottom:1px solid #e1e6de}header .brand{font-size:10px;font-weight:800;letter-spacing:2px}h2{font-size:20px;letter-spacing:-.5px}.body{padding:16px 20px;overflow:auto;overscroll-behavior:contain;flex:1}.project{font-size:12px;color:#616568;margin-top:6px}label{display:block;font-size:12px;font-weight:600;margin:0 0 12px}input,textarea,select{width:100%;display:block;margin-top:5px;border:1px solid #cad5cb;background:#fff;color:#252627;border-radius:8px;padding:9px;font-weight:400;font-size:13px}textarea{resize:vertical;min-height:100px}select{height:39px}.lead{font-size:14px;margin:12px 0}.modes{display:grid;grid-template-columns:1fr 1fr;gap:8px}.modes button{text-align:left;padding:13px;font-size:13px}.modes strong{display:block;font-size:16px}#recent{margin-top:18px}.noteitem{display:block;width:100%;text-align:left;margin-bottom:7px;font-size:12px}.noteitem b{font-size:11px;color:#22795f;margin-right:6px}.noteitem span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}footer{padding:10px 20px;border-top:1px solid #e1e6de;font-size:11px;background:#f6f8f1}footer button{padding:6px 10px;font-size:12px}#status{min-height:24px;padding-top:4px}#dock{position:fixed;bottom:20px;right:18px;display:flex;flex-wrap:wrap;gap:6px;background:#292b2d;color:#fff;padding:8px;border:1px solid #31564b;border-radius:10px;box-shadow:0 8px 24px #14372b30;max-width:95vw}#dock button{background:transparent;color:#fff;border-color:transparent;padding:7px 10px}#dock button:hover,#dock button.active{background:#ece9e2;color:#252627}#hint{position:fixed;left:50%;top:18px;transform:translateX(-50%);padding:11px 20px;border-radius:30px;background:#292b2d;color:#fff;box-shadow:0 6px 26px #16372d30;pointer-events:none;font-size:13px;white-space:normal;max-width:min(650px,calc(100vw - 32px));text-align:center;border-radius:14px}#hintActions{display:flex;justify-content:center;gap:8px;margin-top:8px}#hintActions button{pointer-events:auto;font-size:12px;padding:5px 10px}#modeState{align-self:center;font-size:11px;white-space:nowrap;padding:0 6px;color:#d1d7d1}#outline{position:fixed;border:2px solid #d04c40;background:#e2704d12;pointer-events:none;display:none;border-radius:3px}.pin{position:fixed;width:27px;height:27px;border-radius:50%;border:2px solid white;background:#cd493c;color:#fff;box-shadow:0 2px 6px #0004;padding:0;pointer-events:auto;font-size:11px;font-weight:bold}.shot{position:relative;margin:12px 0;border:1px solid #d9e0d8;border-radius:8px;overflow:hidden;background:white;line-height:0}.shot img{width:100%;display:block}.mark{position:absolute;border:2px solid #d04c40;background:#e2704d12}.pill{font-size:11px;color:#292b2d;background:#efeee9;border-radius:5px;padding:3px 7px}.attachment{max-width:100%;max-height:100px;object-fit:contain}.hidden{display:none!important}#original{font-size:12px;white-space:pre-wrap;border-left:2px solid #a6bba8;padding-left:10px;margin:8px 0 12px;max-height:100px;overflow:auto;color:#526958}
  @media(max-width:600px){#panel{right:8px;left:8px;top:8px;bottom:88px;width:auto}#dock{right:8px;bottom:12px;font-size:12px}#hint{top:10px;font-size:11px;max-width:96vw;white-space:normal;width:max-content}}
  </style><div class="desk"><aside id="panel"><header><div class="top"><div><div class="brand">REVIEW DESK</div><h2>画面に、修正メモ。</h2></div><button id="collapse" aria-label="パネルをたたむ">−</button></div><div class="project" id="project"></div></header><div class="body" id="body"></div><footer><div class="top"><button id="openDesk">一覧・修正依頼</button><button id="close" aria-label="ツールを閉じる">閉じる</button></div><div id="status" role="status">準備しています…</div></footer></aside><div id="dock"><span id="modeState" role="status">閲覧中</span><button id="show" title="メモパネルを開く">● メモ</button><button data-mode="browse">見る</button><button data-mode="element">場所</button><button data-mode="text">文字</button><button data-mode="area">囲む</button></div><div id="hint" class="hidden" role="status"><span id="hintText"></span><div id="hintActions" class="hidden"><button data-fallback="element">場所で記録</button><button data-fallback="area">囲んで記録</button></div></div><div id="outline"></div><div id="pins"></div></div>`;
  const $ = (id) => sh.getElementById(id),
    body = $("body");
  let project,
    notes = [],
    mode = "browse",
    editing = null,
    down = null,
    hover = null,
    closed = false,
    suppressUntil = 0,
    raf = 0,
    ready = false,
    initializing = null,
    captureBusy = false,
    attachmentBusy = false,
    textGesture = null,
    assistedHover = null,
    modeRequest = 0;
  const selectionStyles = new Map();
  const rpc = (type, args = {}) => ReviewClient.request(type, args);
  function status(s, error = false) {
    $("status").textContent = s;
    $("status").classList.toggle("error", error);
    if (error && editing?.failed) {
      const recovery = document.createElement("button");
      recovery.textContent = "未保存の入力をダウンロード";
      recovery.onclick = () => {
        const data = {
          format: "review-desk-draft-v1",
          code: editing.note.code,
          issueId: editing.note.issueId || editing.note.id,
          patch: values(),
          note: "Draft only. Compare with the saved record before reapplying.",
        };
        const link = document.createElement("a"),
          url = URL.createObjectURL(
            new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            }),
          );
        link.href = url;
        link.download = "ReviewDesk_Unsaved_" + editing.note.code + ".json";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      };
      $("status").append(document.createElement("br"), recovery);
    }
  }
  function setReady(value) {
    ready = value;
    sh.querySelectorAll("[data-mode]").forEach((b) => {
      b.disabled = !value && b.dataset.mode !== "browse";
    });
  }
  function requireReady() {
    if (ready && project?.id) return true;
    $("panel").classList.remove("hidden");
    status(
      initializing
        ? "メモの準備が終わるまでお待ちください。"
        : "準備が完了していません。「準備をやり直す」を押してください。",
      !initializing,
    );
    return false;
  }
  function initialize() {
    if (initializing) return initializing;
    setReady(false);
    clearMode();
    $("panel").classList.remove("hidden");
    body.innerHTML =
      '<h3>メモを準備しています…</h3><p class="lead">保存済みの打ち合わせとメモを読み込んでいます。</p>';
    status("準備しています…");
    initializing = (async () => {
      let stage = "打ち合わせ情報の読み込み";
      try {
        let next;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            next = await rpc("CONTEXT");
            if (
              !next ||
              typeof next.id !== "string" ||
              !next.id ||
              typeof next.title !== "string"
            )
              throw Error("打ち合わせ情報の形式を確認できませんでした。");
            break;
          } catch (error) {
            if (attempt === 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        }
        if (closed) return { ok: false, error: "ツールを閉じました。" };
        project = next;
        $("project").textContent = project.title;
        stage = "保存済みメモの読み込み";
        await home();
        setReady(true);
        status(
          "準備できました。「場所」で対象をクリックするとコメント欄が開きます。",
        );
        return { ok: true };
      } catch (error) {
        if (closed) return { ok: false, error: "ツールを閉じました。" };
        setReady(false);
        clearMode();
        body.innerHTML = `<h3>メモの準備を完了できませんでした</h3><p class="lead">下のボタンで、保存済みのデータを読み直せます。</p><button id="retry" class="primary" style="width:100%">準備をやり直す</button><p class="muted" style="margin-top:12px">更新直後の場合は、このWebページを再読み込みして Review Desk を開き直してください。</p><details style="margin-top:16px"><summary>解消しない場合の確認情報</summary><pre style="white-space:pre-wrap;font:12px/1.6 monospace">${C.esc("Review Desk 1.1.0-beta.3\n" + stage + "\n" + (error.code || "STARTUP") + "\n" + error.message)}</pre><p class="muted">この部分のスクリーンショットを不具合報告に添付できます（個人情報は除いてください）。</p></details>`;
        $("retry").onclick = () => initialize();
        status("準備をやり直してください。", true);
        return { ok: false, error: error.message };
      } finally {
        initializing = null;
      }
    })();
    host.__reviewDeskReady = initializing;
    return initializing;
  }
  function chosenRole() {
    return $("role")?.value || project?.role || "未指定";
  }
  function captureInfo(kind, rect, target) {
    return {
      kind,
      rect,
      target,
      url: location.href,
      title: document.title,
      screen:
        document
          .querySelector("main h1,main h2,h1")
          ?.textContent?.trim()
          .slice(0, 150) || document.title,
      role: chosenRole(),
      viewport: {
        width: innerWidth,
        height: innerHeight,
        dpr: devicePixelRatio,
      },
      scroll: { x: scrollX, y: scrollY },
      userAgent: navigator.userAgent,
    };
  }
  function clearMode() {
    modeRequest++;
    if (textGesture) window.getSelection()?.removeAllRanges();
    textGesture = null;
    restoreSelectionStyles();
    mode = "browse";
    down = null;
    hover = null;
    $("hint").classList.add("hidden");
    $("hintActions").classList.add("hidden");
    $("outline").style.display = "none";
    syncMode();
    renderPins();
  }
  function syncMode() {
    $("modeState").textContent = captureBusy
      ? "撮影中…"
      : {
          browse: "閲覧中",
          text: "文字を選択中",
          element: "場所を指定中",
          area: "範囲を指定中",
          busy: "撮影中…",
        }[mode];
    sh.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  async function setMode(next) {
    const request = ++modeRequest;
    if (captureBusy || attachmentBusy) {
      status("画像の保存が終わるまでお待ちください。");
      return;
    }
    if (editing?.pending) {
      status("入力を保存してから切り替えます…");
      await editing.tail;
      if (request !== modeRequest || closed) return;
    }
    if (editing?.failed) {
      $("panel").classList.remove("hidden");
      status(
        "未保存の入力があります。先に入力をダウンロードしてください。",
        true,
      );
      return;
    }
    if (next !== "browse" && !requireReady()) return;
    clearMode();
    mode = next;
    syncMode();
    if (next === "browse") {
      $("panel").classList.add("hidden");
      return;
    }
    if (project?.role === "未指定") {
      status("役割は未指定です。メモ内で変更できます。");
    }
    $("panel").classList.add("hidden");
    $("pins").replaceChildren();
    $("hintText").textContent = {
      element: "指定する場所をクリック。Escで戻る",
      text: "変更する文字をドラッグで選択。Escで戻る",
      area: "対象の範囲をドラッグで囲む。Escで戻る",
    }[next];
    $("hint").classList.remove("hidden");
    sh.querySelector(`[data-mode="${next}"]`)?.classList.add("active");
  }
  function showSelectionHint(message, alternatives = false) {
    if ($("hintText").textContent !== message)
      $("hintText").textContent = message;
    $("hintActions").classList.toggle("hidden", !alternatives);
    $("hint").classList.remove("hidden");
  }
  function protectedInput(el) {
    return !!el?.closest?.(
      'input,textarea,select,[contenteditable]:not([contenteditable="false"])',
    );
  }
  function textTarget(el) {
    if (!el?.closest || protectedInput(el))
      return {
        selectable: false,
        message:
          "入力欄は文字として取得しません。「場所」か「囲む」で記録できます。",
      };
    if (el.closest("img,picture,svg,canvas,video,iframe,object,embed"))
      return {
        selectable: false,
        message: "画像・図形などの対象です。「場所」か「囲む」で記録できます。",
      };
    if (!(el.textContent || "").trim())
      return {
        selectable: false,
        message:
          "ここでは文字を取得できません。「場所」か「囲む」で記録できます。",
      };
    return {
      selectable: true,
      message: el.closest("a[href]")
        ? "リンク内の文字です。ドラッグで選択できます。Escで戻る"
        : "文字をドラッグで選択できます。Escで戻る",
    };
  }
  // Temporarily assist only the pointed element and its ancestors. Preserve
  // original inline values/priorities and do not overwrite a later site edit.
  function assistSelection(el) {
    for (
      let node = el;
      node && !host.contains(node);
      node = node.parentElement
    ) {
      if (selectionStyles.size >= 256 && !selectionStyles.has(node)) break;
      let changes = selectionStyles.get(node);
      if (!changes) {
        changes = new Map();
        changes.hadStyle = node.hasAttribute("style");
        selectionStyles.set(node, changes);
      }
      for (const [property, value] of [
        ["user-select", "text"],
        ["-webkit-user-select", "text"],
        ["-webkit-user-drag", "none"],
        ["cursor", "text"],
      ]) {
        if (!changes.has(property))
          changes.set(property, {
            value: node.style.getPropertyValue(property),
            priority: node.style.getPropertyPriority(property),
            applied: value,
          });
        else if (
          node.style.getPropertyValue(property) !== value ||
          node.style.getPropertyPriority(property) !== "important"
        ) {
          const previous = changes.get(property);
          previous.value = node.style.getPropertyValue(property);
          previous.priority = node.style.getPropertyPriority(property);
        }
        if (
          node.style.getPropertyValue(property) !== value ||
          node.style.getPropertyPriority(property) !== "important"
        )
          node.style.setProperty(property, value, "important");
      }
    }
  }
  function restoreSelectionStyles() {
    assistedHover = null;
    for (const [node, changes] of selectionStyles) {
      for (const [property, previous] of changes) {
        if (
          node.style.getPropertyValue(property) === previous.applied &&
          node.style.getPropertyPriority(property) === "important"
        ) {
          if (previous.value)
            node.style.setProperty(property, previous.value, previous.priority);
          else node.style.removeProperty(property);
        }
      }
      if (!changes.hadStyle && !node.style.length)
        node.removeAttribute("style");
    }
    selectionStyles.clear();
  }
  function textPoint(x, y) {
    const position = document.caretPositionFromPoint?.(x, y);
    const range = position ? null : document.caretRangeFromPoint?.(x, y);
    const node = position?.offsetNode || range?.startContainer;
    const offset = position?.offset ?? range?.startOffset;
    if (
      node?.nodeType !== Node.TEXT_NODE ||
      node.getRootNode() !== document ||
      !textTarget(node.parentElement).selectable ||
      !Number.isInteger(offset)
    )
      return null;
    return { node, offset };
  }
  function updateTextSelection(e) {
    if (!textGesture?.anchor) return;
    const hit = document.elementFromPoint?.(e.clientX, e.clientY) || e.target;
    if (!textTarget(hit).selectable) return;
    assistSelection(hit);
    const point = textPoint(e.clientX, e.clientY);
    if (!point) return;
    const anchor = textGesture.anchor;
    try {
      window
        .getSelection()
        ?.setBaseAndExtent(
          anchor.node,
          anchor.offset,
          point.node,
          point.offset,
        );
    } catch {
      cancelGesture();
    }
  }
  function cancelGesture() {
    if (textGesture) window.getSelection()?.removeAllRanges();
    textGesture = null;
    down = null;
    $("outline").style.display = "none";
    if (mode === "text")
      showSelectionHint(
        "選択を中止しました。文字をもう一度ドラッグしてください。Escで戻る",
      );
    if (mode === "area")
      showSelectionHint(
        "範囲指定を中止しました。もう一度ドラッグしてください。Escで戻る",
      );
  }
  function selector(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + CSS.escape(el.id);
    const path = [];
    for (
      let e = el;
      e && e !== document.documentElement && path.length < 7;
      e = e.parentElement
    ) {
      let s = e.tagName.toLowerCase();
      const sibs = e.parentElement
        ? [...e.parentElement.children].filter((n) => n.tagName === e.tagName)
        : [];
      if (sibs.length > 1) s += `:nth-of-type(${sibs.indexOf(e) + 1})`;
      path.unshift(s);
      if (e.parentElement?.id) {
        path.unshift("#" + CSS.escape(e.parentElement.id));
        break;
      }
    }
    return path.join(" > ");
  }
  function target(el, selected) {
    if (!el) return { selector: "", tag: "", text: "" };
    return {
      selector: selector(el),
      tag: el.tagName.toLowerCase(),
      text: C.text(
        selected ??
          (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
            ? ""
            : el.innerText || el.textContent || ""),
        2000,
      ),
      alt: el.getAttribute("alt") || "",
    };
  }
  function outline(r) {
    Object.assign($("outline").style, {
      display: "block",
      left: r.x + "px",
      top: r.y + "px",
      width: r.width + "px",
      height: r.height + "px",
    });
  }
  function isUI(e) {
    return e.composedPath().includes(host);
  }
  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return C.rect(
      { x: r.x, y: r.y, width: r.width, height: r.height },
      { width: innerWidth, height: innerHeight },
    );
  }
  // UTF-16 offsets relative to the selected common ancestor survive inline
  // markup changes. Context disambiguates repeated words after nearby edits.
  function textAnchor(el, range, selected) {
    const before = document.createRange();
    before.selectNodeContents(el);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length;
    const end = start + selected.slice(0, 2000).length;
    const text = el.textContent || "";
    return {
      start,
      end,
      prefix: text.slice(Math.max(0, start - 64), start),
      suffix: text.slice(end, end + 64),
    };
  }
  function textPinRect(el, target) {
    const quote = target.text;
    if (!quote) return null;
    // Bound work on very large ancestors. Never fall back to their block box.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let text = "",
      node;
    while ((node = walker.nextNode())) {
      if (nodes.length >= 10000 || text.length + node.length > 2000000)
        return null;
      nodes.push({ node, start: text.length });
      text += node.data;
    }
    const a = target.anchor;
    const matchesContext = (start) =>
      !a ||
      (text.slice(Math.max(0, start - (a.prefix || "").length), start) ===
        (a.prefix || "") &&
        text.slice(
          start + quote.length,
          start + quote.length + (a.suffix || "").length,
        ) === (a.suffix || ""));
    let start = -1;
    if (
      a &&
      Number.isSafeInteger(a.start) &&
      a.start >= 0 &&
      a.end === a.start + quote.length &&
      text.slice(a.start, a.end) === quote &&
      matchesContext(a.start)
    ) {
      start = a.start;
    } else {
      const matches = [],
        contextual = [];
      for (
        let i = text.indexOf(quote);
        i !== -1;
        i = text.indexOf(quote, i + 1)
      ) {
        if (matches.length >= 1000) return null;
        matches.push(i);
        if (a && matchesContext(i)) contextual.push(i);
      }
      if (matches.length === 1) start = matches[0];
      else if (contextual.length === 1) start = contextual[0];
    }
    if (start < 0) return null;
    const end = start + quote.length;
    const first = nodes.find((n) => n.start + n.node.length > start);
    const last = nodes.find(
      (n) => n.start < end && n.start + n.node.length >= end,
    );
    if (!first || !last) return null;
    const range = document.createRange();
    range.setStart(first.node, start - first.start);
    range.setEnd(last.node, end - last.start);
    // Intersect with the viewport and nested scrolling/clipping containers.
    const clip = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    for (let parent = el; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.visibility === "hidden" || style.visibility === "collapse")
        return null;
      const clipX = /^(hidden|clip|scroll|auto)$/.test(
        style.overflowX || style.overflow,
      );
      const clipY = /^(hidden|clip|scroll|auto)$/.test(
        style.overflowY || style.overflow,
      );
      if (!clipX && !clipY) continue;
      const box = parent.getBoundingClientRect();
      if (clipX) {
        clip.left = Math.max(clip.left, box.left);
        clip.right = Math.min(clip.right, box.right);
      }
      if (clipY) {
        clip.top = Math.max(clip.top, box.top);
        clip.bottom = Math.min(clip.bottom, box.bottom);
      }
    }
    // Choose the first visible text fragment, including wrapped selections.
    for (const r of range.getClientRects()) {
      const left = Math.max(r.left, clip.left),
        top = Math.max(r.top, clip.top);
      const right = Math.min(r.right, clip.right),
        bottom = Math.min(r.bottom, clip.bottom);
      if (right > left && bottom > top)
        return {
          x: left,
          y: top,
          right,
          bottom,
          width: right - left,
          height: bottom - top,
        };
    }
    return null;
  }
  async function begin(kind, r, t) {
    if (captureBusy || attachmentBusy || !requireReady()) return;
    captureBusy = true;
    await editing?.tail;
    if (editing?.failed) {
      captureBusy = false;
      $("panel").classList.remove("hidden");
      status(
        "未保存の変更があります。入力を控えて一覧を開き直してください。",
        true,
      );
      return;
    }
    const cap = captureInfo(kind, r, t);
    clearMode();
    mode = "busy";
    syncMode();
    status("画面を保存しています…");
    host.style.setProperty("visibility", "hidden", "important");
    let shot = "";
    try {
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      await new Promise((resolve) => setTimeout(resolve, 130));
      const result = await rpc("CAPTURE", { pageUrl: cap.url });
      if (
        location.href !== cap.url ||
        scrollX !== cap.scroll.x ||
        scrollY !== cap.scroll.y ||
        innerWidth !== cap.viewport.width ||
        innerHeight !== cap.viewport.height
      )
        throw Error("撮影中に画面が移動しました。もう一度指定してください。");
      shot = result.screenshot;
      const note = await rpc("CREATE_NOTE", {
        projectId: project.id,
        capture: cap,
        screenshot: shot,
      });
      await loadNotes();
      await edit(note);
      status("保存しました。メモは入力ごとに自動保存します。");
    } catch (e) {
      status(e.message, true);
      $("panel").classList.remove("hidden");
    } finally {
      captureBusy = false;
      host.style.removeProperty("visibility");
      mode = "browse";
      syncMode();
      $("hint").classList.add("hidden");
      $("outline").style.display = "none";
      renderPins();
    }
  }
  async function loadNotes() {
    if (!project?.id) throw Error("打ち合わせの準備が完了していません。");
    const list = await rpc("LIST", { projectId: project.id });
    if (!Array.isArray(list))
      throw Error("保存済みメモの一覧を読み込めませんでした。");
    notes = list;
  }
  const roleOptions = (value) =>
    C.roles([...(project?.roles || C.ROLES), value])
      .map(
        (r) => `<option ${r === value ? "selected" : ""}>${C.esc(r)}</option>`,
      )
      .join("");
  async function home() {
    if (attachmentBusy) {
      status("画像を保存しています。完了までお待ちください。");
      return;
    }
    await editing?.tail;
    if (editing?.failed) return;
    editing = null;
    clearMode();
    $("panel").classList.remove("hidden");
    await loadNotes();
    body.innerHTML = `<label>確認する役割<select id="role">${roleOptions(project.role)}</select></label><p class="lead">気になる箇所を選んで、<br>その場でメモを残しましょう。</p><div class="modes"><button data-pick="element"><strong>↖ 場所</strong>ボタン・画像をクリック</button><button data-pick="text"><strong>T 文字</strong>文章を選んで修正案</button><button data-pick="area"><strong>▧ 囲む</strong>余白・まとまりを指定</button><button id="whole"><strong>▤ 全体</strong>今見えている画面</button></div><p class="muted" style="margin-top:12px">指定中はクリックによるサイト操作を止めます。「見る」で通常操作に戻ります。</p><div class="row" style="margin-top:14px"><button id="checked">この画面を確認済みに</button></div><div id="recent"><h3>この画面のメモ</h3><div id="recentList"></div></div>`;
    $("role").onchange = async () => {
      try {
        const updated = await rpc("PROJECT_ROLE", {
          projectId: project.id,
          role: $("role").value,
        });
        if (!updated?.id) throw Error("役割を保存できませんでした。");
        project = updated;
        renderRecent();
        renderPins();
      } catch (e) {
        $("role").value = project.role;
        status(e.message, true);
      }
    };
    sh.querySelectorAll("[data-pick]").forEach(
      (b) => (b.onclick = () => setMode(b.dataset.pick)),
    );
    $("whole").onclick = () =>
      begin("page", { x: 0, y: 0, width: innerWidth, height: innerHeight }, {});
    $("checked").onclick = async () => {
      try {
        await rpc("CHECK", {
          projectId: project.id,
          capture: captureInfo("page", null, {}),
          checked: true,
        });
        status("この画面・役割・画面幅を「確認済み」で記録しました。");
      } catch (e) {
        status(e.message, true);
      }
    };
    renderRecent();
    renderPins();
  }
  function renderRecent() {
    const list = $("recentList");
    if (!list) return;
    const filtered = notes.filter(
      (n) => n.url === C.safeUrl(location.href) && n.role === chosenRole(),
    );
    list.innerHTML = filtered.length
      ? filtered
          .map(
            (n) =>
              `<button class="noteitem" data-id="${C.esc(n.id)}"><b>${n.code}</b>${C.STATUS[n.status]}<span>${C.esc(C.label(n))}</span></button>`,
          )
          .join("")
      : '<p class="muted">まだメモはありません。</p>';
    list
      .querySelectorAll("button")
      .forEach((b) => (b.onclick = () => openNote(b.dataset.id)));
  }
  async function openNote(id) {
    if (attachmentBusy || captureBusy) return;
    await editing?.tail;
    if (editing?.failed) return;
    try {
      await edit(await rpc("GET_NOTE", { id }));
    } catch (e) {
      status(e.message, true);
    }
  }
  function values() {
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
    };
  }
  function save(p, session = editing) {
    if (!session) return Promise.resolve();
    status("保存中…");
    session.pending++;
    session.tail = session.tail
      .then(async () => {
        if (session.failed) throw session.failed;
        session.note = await rpc("UPDATE_NOTE", {
          id: session.note.id,
          revision: session.note.revision,
          patch: p,
        });
        const i = notes.findIndex((n) => n.id === session.note.id);
        if (i >= 0) notes[i] = session.note;
        if (editing === session)
          status(
            session.pending === 1
              ? "端末に保存済み · " +
                  new Date().toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
              : "保存中…",
          );
      })
      .catch((e) => {
        session.failed = e;
        status("未保存：" + e.message, true);
      })
      .finally(() => session.pending--);
    return session.tail;
  }
  async function edit(n) {
    if (!n?.id)
      throw Error("メモを読み込めません。ページを開き直してください。");
    clearMode();
    editing = { note: n, tail: Promise.resolve(), failed: null, pending: 0 };
    $("panel").classList.remove("hidden");
    const r = n.rect,
      v = n.viewport;
    body.innerHTML = `<div class="top"><span class="pill">${n.code} · ${C.KINDS[n.kind]}</span><button id="back">種類を選んで次へ</button></div><button id="repeat" style="width:100%;margin-top:10px">＋ 続けて${n.kind === "text" ? "文字" : n.kind === "area" ? "範囲" : "場所"}を指定</button><div class="shot">${n.screenshot ? `<img src="${n.screenshot}" alt="記録時の画面">` : "画像なし"}${r ? `<span class="mark" style="left:${(100 * r.x) / v.width}%;top:${(100 * r.y) / v.height}%;width:${(100 * r.width) / v.width}%;height:${(100 * r.height) / v.height}%"></span>` : ""}</div><p class="muted">撮影時の画面。拡大は「一覧・修正依頼」から。</p><label>打ち合わせメモ<textarea id="memo" placeholder="例：ボタンを「空き状況を見る」に変更したい">${C.esc(n.memo)}</textarea></label>${n.kind === "text" ? `<div class="muted">変更前</div><div id="original">${C.esc(n.target.text)}</div><label>変更後の文章<textarea id="replacement" placeholder="表示したい文章を入力">${C.esc(n.replacement)}</textarea></label>` : ""}<div class="row"><label>判断<select id="decision">${Object.entries(
      C.STATUS,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}" ${n.status === k ? "selected" : ""}>${v}</option>`,
      )
      .join(
        "",
      )}</select></label><label>変更の範囲<select id="scope"><option value="this" ${n.scope === "this" ? "selected" : ""}>この箇所だけ</option><option value="common" ${n.scope === "common" ? "selected" : ""}>同じ種類の項目にも</option></select></label></div><details><summary>画面情報・参考画像</summary><label>画面名<input id="screen" value="${C.esc(n.screen)}"></label><label>確認する役割<select id="role">${roleOptions(n.role)}</select></label><label>差し替え・参考画像<input id="attach" type="file" accept="image/png,image/jpeg,image/webp"></label><div id="attachment">${n.attachment ? `<img class="attachment" alt="添付画像" src="${n.attachment}">` : ""}</div><p class="muted">PNG / JPEG / WebP、8MBまで。</p></details><button id="save" class="primary" style="width:100%;margin-top:16px">保存を確認して次のメモへ</button>`;
    for (const id of ["memo", "replacement", "screen"])
      if ($(id)) $(id).oninput = () => save({ [id]: $(id).value });
    $("repeat").onclick = () =>
      setMode(
        n.kind === "text" ? "text" : n.kind === "area" ? "area" : "element",
      );
    for (const id of ["decision", "scope", "role"])
      $(id).onchange = () => {
        if (
          $("decision").value === "decided" &&
          !$("memo").value.trim() &&
          !$("replacement")?.value.trim()
        ) {
          $("decision").value = editing.note.status;
          status("メモまたは修正文を入力してから確定してください。", true);
          return;
        }
        save({ [id === "decision" ? "status" : id]: $(id).value });
      };
    $("attach").onchange = async () => {
      const owner = editing;
      attachmentBusy = true;
      try {
        const f = $("attach").files[0];
        if (!f) return;
        if (f.size > 8 * 1024 * 1024)
          throw Error("画像は8MB以下にしてください。");
        const data = await new Promise((res, rej) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.onerror = rej;
          fr.readAsDataURL(f);
        });
        C.imageData(data, false);
        await save({ attachment: data, attachmentName: f.name }, owner);
        if (editing === owner && !owner.failed)
          $("attachment").innerHTML =
            `<img class="attachment" src="${data}" alt="添付画像">`;
      } catch (e) {
        status(e.message, true);
      } finally {
        attachmentBusy = false;
      }
    };
    $("back").onclick = $("save").onclick = async () => {
      if (attachmentBusy) return;
      await editing.tail;
      if (!editing.failed) await home();
    };
    $("memo").focus();
  }
  function renderPins() {
    const layer = $("pins");
    layer.replaceChildren();
    if (mode !== "browse" || closed) return;
    for (const n of notes) {
      if (
        n.deleted ||
        n.url !== C.safeUrl(location.href) ||
        n.role !== chosenRole() ||
        (n.kind !== "text" && Math.abs(n.viewport.width - innerWidth) > 30)
      )
        continue;
      let r;
      if (n.target?.selector) {
        try {
          const el = document.querySelector(n.target.selector);
          if (
            el &&
            (n.kind === "text" ||
              !n.target.text ||
              (el.innerText || el.textContent || "").includes(n.target.text))
          )
            r = n.kind === "text" ? textPinRect(el, n.target) : rectOf(el);
        } catch {}
      } else if (n.kind !== "text" && n.rect)
        r = {
          x: n.rect.x + n.scroll.x - scrollX,
          y: n.rect.y + n.scroll.y - scrollY,
        };
      if (
        !r ||
        (n.kind !== "text" &&
          (r.y < 0 ||
            r.y > innerHeight - 30 ||
            r.x < 0 ||
            r.x > innerWidth - 30))
      )
        continue;
      const b = document.createElement("button");
      b.className = "pin";
      const textPin = n.kind === "text";
      // Place beside the glyphs with a 6px gap, not on top of the text.
      const x = textPin ? (r.x >= 37 ? r.x - 33 : r.right + 6) : r.x - 10;
      const y = textPin ? r.y + (r.height - 27) / 2 : r.y - 10;
      b.style.left = Math.max(4, Math.min(innerWidth - 31, x)) + "px";
      b.style.top = Math.max(4, Math.min(innerHeight - 31, y)) + "px";
      b.textContent = Number(n.code.slice(2));
      b.title = n.code + " " + C.label(n);
      b.setAttribute("aria-label", n.code + " のメモを開く");
      b.onclick = () => openNote(n.id);
      layer.append(b);
    }
  }
  function move(e) {
    if (isUI(e)) return;
    if (mode === "text") {
      if (textGesture) {
        if (textGesture.pointerId !== e.pointerId) return;
        e.stopImmediatePropagation();
        updateTextSelection(e);
      } else {
        const target = textTarget(e.target);
        if (assistedHover !== e.target) {
          restoreSelectionStyles();
          if (target.selectable) assistSelection(e.target);
          assistedHover = e.target;
        }
        showSelectionHint(target.message, !target.selectable);
      }
    }
    if (mode === "element") {
      hover =
        e.target.closest('button,a,img,label,[role="button"]') || e.target;
      outline(rectOf(hover));
    }
    if (mode === "area" && down)
      outline({
        x: Math.min(down.x, e.clientX),
        y: Math.min(down.y, e.clientY),
        width: Math.abs(down.x - e.clientX),
        height: Math.abs(down.y - e.clientY),
      });
  }
  function pointerdown(e) {
    if (isUI(e)) return;
    if (e.button !== 0 || e.isPrimary === false) return;
    if (mode === "element" || captureBusy) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (mode === "area") {
      e.preventDefault();
      e.stopImmediatePropagation();
      down = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    } else if (mode === "text") {
      e.stopImmediatePropagation();
      window.getSelection()?.removeAllRanges();
      const target = textTarget(e.target);
      showSelectionHint(target.message, !target.selectable);
      if (!target.selectable) {
        e.preventDefault();
        textGesture = { blocked: true, pointerId: e.pointerId };
        return;
      }
      assistSelection(e.target);
      sh.activeElement?.blur();
      const assisted =
        typeof document.caretPositionFromPoint === "function" ||
        typeof document.caretRangeFromPoint === "function";
      const anchor = assisted ? textPoint(e.clientX, e.clientY) : null;
      textGesture = {
        anchor,
        pointerId: e.pointerId,
        assisted,
        blocked: assisted && !anchor,
      };
      if (assisted) {
        // Chromium's native anchor drag competes with text selection. Resolve
        // the caret under the pointer and extend a normal visible Selection.
        e.preventDefault();
        if (anchor) window.getSelection()?.collapse(anchor.node, anchor.offset);
        else
          showSelectionHint(
            "ここでは文字を選択できません。「場所」か「囲む」を使えます。",
            true,
          );
      }
    }
  }
  function pointerup(e) {
    if (isUI(e)) {
      if (textGesture || down) cancelGesture();
      return;
    }
    if (e.button !== 0 || e.isPrimary === false) return;
    if (mode === "element" || captureBusy) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (mode === "area" && down) {
      if (down.pointerId !== e.pointerId) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      suppressUntil = Date.now() + 400;
      const r = {
        x: Math.min(down.x, e.clientX),
        y: Math.min(down.y, e.clientY),
        width: Math.max(5, Math.abs(down.x - e.clientX)),
        height: Math.max(5, Math.abs(down.y - e.clientY)),
      };
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved < 5) {
        $("outline").style.display = "none";
        showSelectionHint(
          "範囲の始点から終点までドラッグしてください。クリックだけでは記録しません。",
        );
        return;
      }
      begin("area", r, {});
    } else if (mode === "text") {
      if (!textGesture || textGesture.pointerId !== e.pointerId) return;
      e.stopImmediatePropagation();
      if (textGesture.assisted) e.preventDefault();
      suppressUntil = Date.now() + 400;
      const blocked = textGesture.blocked || !textTarget(e.target).selectable;
      if (!blocked) updateTextSelection(e);
      textGesture = null;
      const sel = window.getSelection();
      if (blocked) {
        sel?.removeAllRanges();
        showSelectionHint(
          "ここでは文字を選択できません。「場所」か「囲む」で記録できます。",
          true,
        );
        return;
      }
      if (sel?.toString().trim() && sel.rangeCount) {
        const range = sel.getRangeAt(0),
          r = range.getBoundingClientRect(),
          el =
            range.commonAncestorContainer.nodeType === 1
              ? range.commonAncestorContainer
              : range.commonAncestorContainer.parentElement;
        const txt = sel.toString();
        // A drag crossing an editable area must not import its contents into
        // the original-text field. Screenshots still reflect visible pixels.
        const crossesInput = range
          .cloneContents()
          .querySelector?.(
            'input,textarea,select,[contenteditable]:not([contenteditable="false"])',
          );
        if (
          el &&
          !host.contains(el) &&
          el.getRootNode() === document &&
          !protectedInput(el) &&
          !crossesInput &&
          r.width > 0 &&
          r.height > 0
        ) {
          const t = { ...target(el, txt), anchor: textAnchor(el, range, txt) };
          sel.removeAllRanges();
          begin(
            "text",
            { x: r.x, y: r.y, width: r.width, height: r.height },
            t,
          );
          return;
        }
      }
      sel?.removeAllRanges();
      showSelectionHint(
        "文字を選択できませんでした。文字の上からドラッグするか、「場所」「囲む」で記録してください。",
        true,
      );
    }
  }
  function pageMouseEvent(e) {
    if (isUI(e)) return;
    if (captureBusy || ["text", "element", "area"].includes(mode)) {
      e.stopImmediatePropagation();
      // Allow native selection only in the fallback without caret APIs.
      if (
        e.type !== "selectstart" &&
        (mode !== "text" ||
          textGesture?.assisted ||
          textGesture?.blocked ||
          captureBusy)
      )
        e.preventDefault();
    }
  }
  function pageDrag(e) {
    if (
      !isUI(e) &&
      (captureBusy || ["text", "element", "area"].includes(mode))
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  function click(e) {
    if (isUI(e)) return;
    if (Date.now() < suppressUntil) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (["element", "text", "area", "busy"].includes(mode)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (mode === "element") {
        const el =
          e.target.closest('button,a,img,label,[role="button"]') || e.target;
        begin(
          el.tagName === "IMG" ? "image" : "element",
          rectOf(el),
          target(el),
        );
      }
    }
  }
  function key(e) {
    if (e.key === "Escape") {
      if (mode !== "browse" || captureBusy) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      if (captureBusy) return;
      clearMode();
      $("panel").classList.remove("hidden");
    } else if (
      ["element", "area", "text"].includes(mode) &&
      (e.key === "Enter" || e.key === " ") &&
      !isUI(e)
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  function scroll() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (mode === "element") $("outline").style.display = "none";
      renderPins();
    });
  }
  function leaving(e) {
    if (editing?.failed || editing?.pending || attachmentBusy || captureBusy) {
      e.preventDefault();
      e.returnValue = "";
    }
  }
  window.addEventListener("beforeunload", leaving);
  const events = [
    ["pointermove", move],
    ["pointerdown", pointerdown],
    ["pointerup", pointerup],
    ["pointercancel", cancelGesture],
    ["mousedown", pageMouseEvent],
    ["mouseup", pageMouseEvent],
    ["selectstart", pageMouseEvent],
    ["dragstart", pageDrag],
    ["auxclick", pageDrag],
    ["click", click],
    ["keydown", key],
    ["scroll", scroll],
  ];
  for (const [name, fn] of events) document.addEventListener(name, fn, true);
  window.addEventListener("resize", scroll);
  window.addEventListener("blur", cancelGesture);
  sh.querySelectorAll("[data-mode]").forEach(
    (b) => (b.onclick = () => setMode(b.dataset.mode)),
  );
  sh.querySelectorAll("[data-fallback]").forEach(
    (button) => (button.onclick = () => setMode(button.dataset.fallback)),
  );
  $("show").onclick = () => {
    if (captureBusy || attachmentBusy) return;
    $("panel").classList.toggle("hidden");
    clearMode();
  };
  $("collapse").onclick = () => {
    if (captureBusy || attachmentBusy) return;
    $("panel").classList.add("hidden");
    clearMode();
  };
  $("openDesk").onclick = async () => {
    await editing?.tail;
    rpc("OPEN_DESK", { id: editing?.note?.id }).catch((e) =>
      status(e.message, true),
    );
  };
  $("close").onclick = async () => {
    if (attachmentBusy || captureBusy) return;
    await editing?.tail;
    if (editing?.failed) return;
    closed = true;
    clearMode();
    for (const [n, f] of events) document.removeEventListener(n, f, true);
    window.removeEventListener("resize", scroll);
    window.removeEventListener("blur", cancelGesture);
    window.removeEventListener("beforeunload", leaving);
    host.remove();
  };
  host.addEventListener("reviewdesk-open", () => {
    if (captureBusy || attachmentBusy) return;
    $("panel").classList.remove("hidden");
    clearMode();
    if (!ready) initialize();
    else if (!editing) initialize();
  });
  return initialize();
})();
