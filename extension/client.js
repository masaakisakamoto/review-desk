/* Shared request boundary for the popup and the injected panel. */
(function (root) {
  "use strict";
  function request(type, args = {}, options = {}) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, data) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        error ? reject(error) : resolve(data);
      };
      const fail = (message, code) => {
        const error = new Error(message);
        error.code = code;
        finish(error);
      };
      const timer = setTimeout(
        () =>
          fail(
            "保存処理からの応答を待ち切れませんでした。準備をやり直してください。",
            "TIMEOUT_" + type,
          ),
        options.timeout || 12000,
      );
      try {
        if (!root.chrome?.runtime?.sendMessage) {
          fail(
            "拡張機能との接続が切れています。Webページを再読み込みし、Review Desk を開き直してください。",
            "NO_RUNTIME",
          );
          return;
        }
        // A callback also works in Chrome versions without Promise responses.
        root.chrome.runtime.sendMessage({ ...args, type }, (response) => {
          const lastError = root.chrome.runtime.lastError;
          if (lastError) {
            fail(
              "拡張機能と通信できません。Webページを再読み込みして開き直してください。\n" +
                lastError.message,
              "RUNTIME_" + type,
            );
            return;
          }
          if (response?.ok !== true) {
            fail(
              response?.error ||
                "保存処理から正常な返答を受け取れませんでした。",
              response?.code || "RESPONSE_" + type,
            );
            return;
          }
          if (response.data === undefined) {
            fail(
              "保存処理の返答に必要なデータがありません。準備をやり直してください。",
              "EMPTY_" + type,
            );
            return;
          }
          finish(null, response.data);
        });
      } catch (error) {
        const message = /context invalidated/i.test(error?.message || "")
          ? "拡張機能が更新されました。Webページを再読み込みし、Review Desk を開き直してください。"
          : error?.message || "拡張機能と通信できませんでした。";
        fail(message, "SEND_" + type);
      }
    });
  }
  root.ReviewClient = { request };
})(typeof self !== "undefined" ? self : globalThis);
