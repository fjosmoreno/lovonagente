/**
 * Lovon Agente - Floating Chat Widget Embed Script
 *
 * Usage: Add this script tag to any website to show a floating chat button
 * that opens the agent's chat in a modal window.
 *
 * <script src="https://your-lovon-domain/embed.js?handle=AGENT_HANDLE&type=float"></script>
 */
(function () {
  "use strict";

  // Parse query params from script src
  var scripts = document.getElementsByTagName("script");
  var currentScript = scripts[scripts.length - 1];
  var src = currentScript.src;
  var params = new URLSearchParams(src.split("?")[1] || "");
  var handle = params.get("handle");
  var type = params.get("type") || "float";

  if (!handle) {
    console.error("Lovon Embed: 'handle' parameter is required");
    return;
  }

  // Determine base URL from script src
  var baseUrl = src.split("/embed.js")[0];

  // Prevent double initialization
  if (window.__lovonEmbedInitialized) return;
  window.__lovonEmbedInitialized = true;

  if (type === "float") {
    initFloatingWidget();
  }

  function initFloatingWidget() {
    // Wait for DOM ready
    function ready(fn) {
      if (document.readyState !== "loading") {
        fn();
      } else {
        document.addEventListener("DOMContentLoaded", fn);
      }
    }

    ready(function () {
      // Create floating button
      var btn = document.createElement("div");
      btn.id = "lovon-float-btn";
      btn.style.cssText = [
        "position: fixed",
        "bottom: 20px",
        "right: 20px",
        "width: 60px",
        "height: 60px",
        "border-radius: 50%",
        "background: #FF6600",
        "box-shadow: 0 4px 20px rgba(255, 102, 0, 0.4)",
        "cursor: pointer",
        "z-index: 999998",
        "display: flex",
        "align-items: center",
        "justify-content: center",
        "transition: transform 0.2s ease",
        "animation: lovon-pulse 2s infinite",
      ].join(";");

      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';

      btn.addEventListener("mouseenter", function () {
        btn.style.transform = "scale(1.1)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "scale(1)";
      });
      btn.addEventListener("click", toggleChat);

      document.body.appendChild(btn);

      // Create chat modal container
      var overlay = document.createElement("div");
      overlay.id = "lovon-chat-overlay";
      overlay.style.cssText = [
        "position: fixed",
        "top: 0",
        "left: 0",
        "width: 100%",
        "height: 100%",
        "background: rgba(0, 0, 0, 0.5)",
        "backdrop-filter: blur(4px)",
        "z-index: 999999",
        "display: none",
        "align-items: center",
        "justify-content: center",
        "opacity: 0",
        "transition: opacity 0.3s ease",
      ].join(";");

      var modal = document.createElement("div");
      modal.style.cssText = [
        "position: relative",
        "width: 90%",
        "max-width: 400px",
        "height: 85%",
        "max-height: 640px",
        "background: #0a0a0a",
        "border-radius: 16px",
        "overflow: hidden",
        "box-shadow: 0 8px 48px rgba(0, 0, 0, 0.4)",
        "transform: translateY(20px)",
        "transition: transform 0.3s ease",
      ].join(";");

      var closeBtn = document.createElement("div");
      closeBtn.style.cssText = [
        "position: absolute",
        "top: 8px",
        "right: 8px",
        "width: 32px",
        "height: 32px",
        "border-radius: 50%",
        "background: rgba(0, 0, 0, 0.5)",
        "backdrop-filter: blur(8px)",
        "cursor: pointer",
        "z-index: 10",
        "display: flex",
        "align-items: center",
        "justify-content: center",
      ].join(";");
      closeBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      closeBtn.addEventListener("click", toggleChat);

      var iframe = document.createElement("iframe");
      iframe.src = baseUrl + "/?chat=" + handle;
      iframe.style.cssText = [
        "width: 100%",
        "height: 100%",
        "border: none",
        "display: block",
      ].join(";");
      iframe.setAttribute("allow", "clipboard-write");
      iframe.setAttribute("title", "Chat com agente");

      modal.appendChild(closeBtn);
      modal.appendChild(iframe);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Close on overlay click
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) toggleChat();
      });

      // Close on Escape
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.style.display === "flex") {
          toggleChat();
        }
      });

      var isOpen = false;
      function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
          overlay.style.display = "flex";
          requestAnimationFrame(function () {
            overlay.style.opacity = "1";
            modal.style.transform = "translateY(0)";
          });
        } else {
          overlay.style.opacity = "0";
          modal.style.transform = "translateY(20px)";
          setTimeout(function () {
            overlay.style.display = "none";
          }, 300);
        }
      }
    });
  }

  // Inject pulse animation
  var style = document.createElement("style");
  style.textContent =
    "@keyframes lovon-pulse { 0%, 100% { box-shadow: 0 4px 20px rgba(255,102,0,0.4); } 50% { box-shadow: 0 4px 30px rgba(255,102,0,0.7); } }";
  document.head.appendChild(style);
})();
