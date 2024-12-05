import { startServer } from "./lib/server.js";
import { getExistingBuilds } from "./lib/file.js";
import { Builder } from "./lib/build.js";

const main = async () => {
  const builds = await getExistingBuilds();
  const builder = new Builder(builds);
  startServer(builder);
};

try {
  await main();
} catch (err) {
  console.error(err);
}







