/** Entry point: connect to the database, then start listening. */
import { env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { createApp } from "./app.js";

await connectDb();
createApp().listen(env.PORT, () => {
  console.log(`WellPath API running on http://localhost:${env.PORT}`);
});
