import { buildServer } from "./server.js";
import { env } from "./env.js";

const app = await buildServer();

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
  await app.close();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    app.log.info({ signal }, "shutting down");
    void app.close().then(() => process.exit(0));
  });
}
