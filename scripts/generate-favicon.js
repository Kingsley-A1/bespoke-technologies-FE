const fs = require("fs");
const path = require("path");
const pngToIco = require("png-to-ico");

(async () => {
  try {
    const src = path.resolve(__dirname, "../src/app/icon.png");
    const dest = path.resolve(__dirname, "../public/favicon.ico");

    if (!fs.existsSync(src)) {
      console.error(`Source icon not found: ${src}`);
      process.exit(1);
    }

    const buffer = await pngToIco(src);
    fs.writeFileSync(dest, buffer);
    console.log("favicon.ico generated at:", dest);
  } catch (err) {
    console.error("Failed to generate favicon.ico:", err);
    process.exit(1);
  }
})();
