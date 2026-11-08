/*
 * Reddit QX ad filter v1.1.0 (2026-11-08)
 * Original rule reference: @ddgksf2013, RedditAds.conf / reddit.js.
 * Independent readable implementation; handles JSON and GraphQL multipart.
 * Only removes ad edges. Leaves account flags and content preferences intact.
 */
(function () {
  "use strict";
  var removed = 0;
  var adTypes = { AdPost: true, PromotedPost: true, AdMetadataCell: true };

  function isAd(node) {
    if (!node || typeof node !== "object") return false;
    if (adTypes[node.__typename] === true || node.adPayload ||
        node.isAdPost === true || node.isSponsored === true ||
        node.isPromoted === true) return true;
    if (Array.isArray(node.cells) && node.cells.some(isAd)) return true;
    return node.post ? isAd(node.post) : false;
  }

  function clean(value) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(clean);
      return;
    }
    Object.keys(value).forEach(function (key) {
      if (key === "edges" && Array.isArray(value[key])) {
        value[key] = value[key].filter(function (edge) {
          var drop = !!edge && isAd(edge.node);
          if (drop) removed++;
          return !drop;
        });
      }
      clean(value[key]);
    });
  }

  function header(headers, name) {
    var keys = Object.keys(headers || {});
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === name) return headers[keys[i]];
    }
    return "";
  }

  function rewriteJson(text) {
    var parsed = JSON.parse(text);
    var previous = removed;
    clean(parsed);
    return removed === previous ? text : JSON.stringify(parsed);
  }

  try {
    var body = $response.body;
    if (typeof body !== "string" || !body.trim()) return $done({});
    var contentType = header($response.headers, "content-type");
    var output;
    if (/multipart\/mixed/i.test(contentType)) {
      var match = /boundary\s*=\s*(?:"([^"\r\n]+)"|([^;\s]+))/i.exec(contentType);
      if (!match) throw new Error("Missing multipart boundary");
      var boundary = match[1] || match[2];
      var escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Capture delimiter lines, preserving boundaries, part headers and CRLF.
      var delimiter = new RegExp("(^|\\r?\\n)(--" + escaped + "(?:--)?[ \\t]*(?:\\r?\\n|$))", "g");
      var pieces = body.split(delimiter);
      var parts = 0;
      for (var j = 3; j < pieces.length; j += 3) {
        var part = pieces[j];
        var separator = /\r?\n\r?\n/.exec(part);
        if (!separator) continue;
        var start = separator.index + separator[0].length;
        var partHeaders = part.slice(0, start);
        if (!/content-type\s*:\s*application\/json\b/i.test(partHeaders)) {
          throw new Error("Unexpected multipart part type");
        }
        pieces[j] = partHeaders + rewriteJson(part.slice(start));
        parts++;
      }
      if (!parts || body.indexOf("--" + boundary + "--") < 0) {
        throw new Error("Incomplete multipart response");
      }
      output = pieces.join("");
    } else {
      output = rewriteJson(body);
    }
    if (removed) {
      console.log("[Reddit adblock] removed " + removed + " ad edge(s)");
      return $done({ body: output });
    }
    $done({});
  } catch (error) {
    console.log("[Reddit adblock] unchanged: " + error.message);
    $done({});
  }
}());
