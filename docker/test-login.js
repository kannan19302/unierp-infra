/* eslint-disable no-console */
const http = require("http");

async function test(email, password, slug, label) {
  return new Promise((resolve) => {
    const body = { email, password };
    if (slug) body.tenantSlug = slug;
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: "localhost",
        port: 3001,
        path: "/api/v1/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          console.log(
            `${label}: ${res.statusCode} ${body.length > 200 ? body.substring(0, 100) + "..." : body}`,
          );
          resolve();
        });
      },
    );
    req.write(data);
    req.end();
  });
}

(async () => {
  await test("admin@unerp.dev", "admin123", "system", "slug=system");
  await test("admin@unerp.dev", "admin123", "unerp", "slug=unerp");
  await test("admin@unerp.dev", "admin123", undefined, "no slug");
})();
