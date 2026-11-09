/*
 * Hupu QX splash ad mock v1.0.0 (2026-11-09)
 * Adapted from the user's supplied goblin/interfaceAd/getOther mock rule.
 * Invoked only by the matching script-echo-response rewrite.
 */
$done({
  status: "HTTP/1.1 200 OK",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify({ ad_code: -41, show_type: 0, ads: [] })
});
