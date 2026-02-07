const http = require("http");
const fs = require("fs");
const path = require("path");
const port = process.env.PORT || 5000;
const base = path.join(__dirname, "..", "public");

const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/") reqPath = "/index.html";
  const file = path.join(base, reqPath);

  fs.stat(file, (err, stat) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(file) || ".html";
    res.writeHead(200, {
      "Content-Type": mime[ext] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(port, () =>
  console.log(`Dev server listening on http://localhost:${port}`)
);

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
