import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/chatbot.js"],
  bundle: true,
  format: "iife",
  target: ["es2020"],
  sourcemap: false,
  minify: false,
  outfile: "docs/assets/javascripts/chatbot.js",
});
