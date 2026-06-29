const express = require('express');
const path = require('path');
const app = express();
const distPath = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.static(distPath, {
  etag: true,
  lastModified: true,
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = 5173;
app.listen(PORT, () => {
  console.log(`Frontend serving on http://localhost:${PORT}`);
});
