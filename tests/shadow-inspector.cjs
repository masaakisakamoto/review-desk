// Test-only access to a closed root. Does not change its mode or ship in the extension.
module.exports = function inspectShadows(window) {
  const roots = new WeakMap();
  const attach = window.Element.prototype.attachShadow;
  window.Element.prototype.attachShadow = function (options) {
    const root = attach.call(this, options);
    roots.set(this, root);
    return root;
  };
  window.testShadow = (element) => (element ? roots.get(element) : undefined);
};
