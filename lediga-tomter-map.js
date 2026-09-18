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

  var BRAND_PRIMARY = "#031e2f";
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

  function resolveUrl(root, attr, fallbackFile) {
    var custom = root.getAttribute(attr);
    if (custom) return custom;
    if (SCRIPT_BASE) return new URL(fallbackFile, SCRIPT_BASE).href;
    return fallbackFile;
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

  function fetchJson(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
      return res.json();
    });
  }

  function addWaterLayer(map, waterGeojson) {
    if (!waterGeojson) return null;
    return L.geoJSON(waterGeojson, {
      interactive: false,
      style: {
        color: BRAND_PRIMARY,
        weight: 0,
        opacity: 0,
        fillColor: BRAND_PRIMARY,
        fillOpacity: 0.55,
      },
    }).addTo(map);
  }

  function addKommunLayer(map, kommunGeojson) {
    if (!kommunGeojson) return null;
    return L.geoJSON(kommunGeojson, {
      interactive: false,
      style: {
        color: BRAND_PRIMARY,
        weight: 2.5,
        opacity: 0.7,
        fillColor: BRAND_PRIMARY,
        fillOpacity: 0.1,
        lineJoin: "round",
        lineCap: "round",
      },
    }).addTo(map);
  }

  function initMap(root, areas, kommunGeojson, waterGeojson) {
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

    addWaterLayer(map, waterGeojson);
    var kommunLayer = addKommunLayer(map, kommunGeojson);

    var bounds = L.latLngBounds([ARBOGA_CENTRUM]);
    var group = L.featureGroup();

    areas.forEach(function (area) {
      var marker = createMarker(area);
      marker.addTo(group);
      bounds.extend([area.lat, area.lng]);
    });

    group.addTo(map);

    if (kommunLayer) {
      try {
        bounds.extend(kommunLayer.getBounds());
      } catch (e) {
        /* ignore empty bounds */
      }
    }

    map.fitBounds(bounds, {
      paddingTopLeft: [48, 48],
      paddingBottomRight: [48, 48],
      maxZoom: 11,
    });

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

    var areasUrl = resolveUrl(root, "data-areas-url", "areas.json");
    var kommunUrl = resolveUrl(root, "data-kommun-url", "arboga-kommun.geojson");
    var waterUrl = resolveUrl(root, "data-water-url", "arboga-water.geojson");

    Promise.all([
      fetchJson(areasUrl),
      fetchJson(kommunUrl).catch(function (err) {
        console.warn("[arboga-tomter-map] kommun boundary", err);
        return null;
      }),
      fetchJson(waterUrl).catch(function (err) {
        console.warn("[arboga-tomter-map] water layer", err);
        return null;
      }),
    ])
      .then(function (results) {
        var areas = results[0];
        var kommun = results[1];
        var water = results[2];
        if (!Array.isArray(areas) || !areas.length) {
          throw new Error("Inga områden att visa");
        }
        hideStatus(root);
        initMap(root, areas, kommun, water);
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
