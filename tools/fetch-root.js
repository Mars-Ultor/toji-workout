const http = require("http");
const opts = { host: "localhost", port: 5000, path: "/" };
http
  .get(opts, (res) => {
    console.log("STATUS", res.statusCode);
    let data = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => {
      data += chunk;
      if (data.length > 800) res.destroy();
    });
    res.on("close", () => {
      console.log("RESPONSE LENGTH (partial):", data.length);
      console.log(data.slice(0, 800));
    });
  })
  .on("error", (e) => console.error("HTTP ERR", e.message));
