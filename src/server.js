import prisma from "./db.js";
import app from "./app.js";

const PORT = 3000;

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

export { prisma, app };
export default app;
