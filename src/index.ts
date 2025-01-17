import dotenv from "dotenv";
import app from "./app";
import { mongoConnect } from "./db/mongoConnect";
import { Server } from "http";
import path from "path";

// global uncaught exception handler
process.on("uncaughtException", function (err) {
  console.error("Uncaught exception detected, shutting down the server 🖥...");
  console.error(err);

  process.exit(1);
});

// Load env variables
dotenv.config({ path: path.join(__dirname, "../.env") });

let server: Server | undefined;

(async function () {
  // Connect to the DB
  await mongoConnect();

  // Server configuration
  const PORT = process.env.PORT || 3000;

  server = app.listen(PORT, async () => {
    console.log(`Server listening on ${PORT}...`);
  });
})();

// global uncaught promise rejection handler
process.on("unhandledRejection", function (err) {
  console.error(
    "Unhandled promise rejection detected, shutting down the server 🖥..."
  );

  console.error(err);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
