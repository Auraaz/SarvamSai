(function () {
  function buildBoxCanvas(options) {
    const sceneId = options.sceneId ? ` id="${options.sceneId}"` : "";
    const boxId = options.boxId ? ` id="${options.boxId}"` : "";
    const sceneRole = options.sceneRole ? ` role="${options.sceneRole}"` : "";
    const boxRole = options.boxRole ? ` role="${options.boxRole}"` : "";
    const sceneTabIndex = options.sceneTabIndex ? ` tabindex="${options.sceneTabIndex}"` : "";
    const boxTabIndex = options.boxTabIndex ? ` tabindex="${options.boxTabIndex}"` : "";
    const sceneAria = options.sceneAria ? ` aria-label="${options.sceneAria}"` : "";
    const boxAria = options.boxAria ? ` aria-label="${options.boxAria}"` : "";
    const sceneOnClick = options.sceneOnClick ? ` onclick="${options.sceneOnClick}"` : "";
    const boxOnClick = options.boxOnClick ? ` onclick="${options.boxOnClick}"` : "";
    const sceneClass = options.sceneClass ? ` ${options.sceneClass}` : "";
    const boxClass = options.boxClass ? ` ${options.boxClass}` : "";

    return `
      <div class="scene${sceneClass}"${sceneId}${sceneRole}${sceneTabIndex}${sceneAria}${sceneOnClick}>
        <div class="box${boxClass}"${boxId}${boxRole}${boxTabIndex}${boxAria}${boxOnClick}>
          <div class="face face-front"></div>
          <div class="face face-back"></div>
          <div class="face face-right"></div>
          <div class="face face-left"></div>
          <div class="face face-top"></div>
          <div class="face face-bottom"></div>
        </div>
      </div>
    `;
  }

  function optionsFromDataset(node) {
    return {
      sceneId: node.dataset.sceneId || "",
      boxId: node.dataset.boxId || "",
      sceneRole: node.dataset.sceneRole || "",
      boxRole: node.dataset.boxRole || "",
      sceneTabIndex: node.dataset.sceneTabIndex || "",
      boxTabIndex: node.dataset.boxTabIndex || "",
      sceneAria: node.dataset.sceneAria || "",
      boxAria: node.dataset.boxAria || "",
      sceneOnClick: node.dataset.sceneOnClick || "",
      boxOnClick: node.dataset.boxOnClick || "",
      sceneClass: node.dataset.sceneClass || "",
      boxClass: node.dataset.boxClass || ""
    };
  }

  function renderNode(node) {
    node.innerHTML = buildBoxCanvas(optionsFromDataset(node));
  }

  function mount(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-ss-box-canvas]").forEach(renderNode);
  }

  window.SarvamSaiBoxCanvas = {
    build: buildBoxCanvas,
    mount: mount,
    renderInto: function (el, options) {
      if (!el) return;
      el.innerHTML = buildBoxCanvas(options || {});
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      mount(document);
    });
  } else {
    mount(document);
  }
})();
