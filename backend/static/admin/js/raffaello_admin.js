/**
 * Raffaello admin — light 3D tilt on dashboard modules + login panel.
 * Respects prefers-reduced-motion.
 */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function attachTilt(el, maxTilt) {
    var rect = null;

    function onMove(event) {
      rect = rect || el.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width;
      var y = (event.clientY - rect.top) / rect.height;
      var rotateY = clamp((x - 0.5) * maxTilt * 2, -maxTilt, maxTilt);
      var rotateX = clamp((0.5 - y) * maxTilt * 2, -maxTilt, maxTilt);
      el.style.transform =
        "perspective(900px) rotateX(" +
        rotateX.toFixed(2) +
        "deg) rotateY(" +
        rotateY.toFixed(2) +
        "deg) translateZ(8px)";
    }

    function onLeave() {
      rect = null;
      el.style.transform = "";
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  }

  function init() {
    document.documentElement.classList.add("ra-admin-ready");

    var modules = document.querySelectorAll(".dashboard .module, body.login #login-form");
    modules.forEach(function (el) {
      attachTilt(el, el.closest && el.closest("body.login") ? 8 : 5);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
