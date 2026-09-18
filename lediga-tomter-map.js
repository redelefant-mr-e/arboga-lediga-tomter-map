/**
 * Arboga Lediga Tomter Map
 * Desktop-first Leaflet embed. Areas from areas.json.
 */
(function () {
  "use strict";

  var CORNER_SVG =
    '<svg width="32" height="37" viewBox="0 0 32 37" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M10 12H22V25H21V13H10V12Z" fill="currentColor"/>' +
    "</svg>";

  var ARBOGA_CENTRUM = [59.3939, 15.8388];
  var SCRIPT_BASE = (function () {
    var script = document.currentScript;
    if (script && script.src) {
      return new URL(".", script.src).href;
    }
    return "";
  })();

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resolveAreasUrl(root) {
    var custom = root.getAttribute("data-areas-url");
    if (custom) return custom;
    if (SCRIPT_BASE) return new URL("areas.json", SCRIPT_BASE).href;
    return "areas.json";
  }

  function markerHtml(area) {
    var offset = area.labelOffset || "top-right";
    return (
      '<div class="arboga-map-marker arboga-map-marker--' +
      escapeHtml(offset) +
      '">' +
      '<div class="arboga-map-marker__dot" aria-hidden="true"></div>' +
      '<a class="arboga-map-marker__card" href="' +
      escapeHtml(area.href) +
      '" target="_blank" rel="noopener noreferrer" aria-label="Mer information om ' +
      escapeHtml(area.name) +
      '">' +
      '<span class="arboga-map-marker__corner" aria-hidden="true">' +
      CORNER_SVG +
      "</span>" +
      '<span class="arboga-map-marker__name">' +
      escapeHtml(area.name) +
      "</span>" +
      (area.blurb
        ? '<span class="arboga-map-marker__blurb">' + escapeHtml(area.blurb) + "</span>"
        : "") +
      "</a>" +
      "</div>"
    );
  }

  function createMarker(area) {
    var icon = L.divIcon({
      className: "arboga-map-marker-icon",
      html: markerHtml(area),
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    return L.marker([area.lat, area.lng], {
      icon: icon,
      interactive: true,
      keyboard: false,
      riseOnHover: true,
      title: area.name,
    });
  }

  function initMap(root, areas) {
    var canvas = root.querySelector("[data-arboga-map-canvas]");
    if (!canvas) {
      throw new Error("Missing [data-arboga-map-canvas] element");
    }

    var map = L.map(canvas, {
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    var bounds = L.latLngBounds([ARBOGA_CENTRUM]);
    var group = L.featureGroup();

    areas.forEach(function (area) {
      var marker = createMarker(area);
      marker.addTo(group);
      bounds.extend([area.lat, area.lng]);
    });

    group.addTo(map);
    map.fitBounds(bounds, {
      paddingTopLeft: [48, 96],
      paddingBottomRight: [48, 48],
      maxZoom: 11,
    });

    // Recalculate size after fonts/layout settle (Webflow embeds often need this)
    setTimeout(function () {
      map.invalidateSize();
    }, 100);

    root._arbogaMap = map;
    return map;
  }

  function showStatus(root, message) {
    var status = root.querySelector("[data-arboga-map-status]");
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
  }

  function hideStatus(root) {
    var status = root.querySelector("[data-arboga-map-status]");
    if (status) status.hidden = true;
  }

  function boot(root) {
    if (!window.L) {
      showStatus(root, "Kartbiblioteket kunde inte laddas.");
      return;
    }

    var url = resolveAreasUrl(root);
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("Kunde inte hämta områdesdata (" + res.status + ")");
        return res.json();
      })
      .then(function (areas) {
        if (!Array.isArray(areas) || !areas.length) {
          throw new Error("Inga områden att visa");
        }
        hideStatus(root);
        initMap(root, areas);
      })
      .catch(function (err) {
        console.error("[arboga-tomter-map]", err);
        showStatus(root, "Kartan kunde inte laddas. Försök igen senare.");
      });
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var roots = document.querySelectorAll("[data-arboga-tomter-map]");
    roots.forEach(boot);
  });
})();
