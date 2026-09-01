import app from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 HSGQ Local User Management & Auth API Server running on port ${PORT}`);
  console.log(`👉 http://localhost:${PORT}/api/health\n`);
});
