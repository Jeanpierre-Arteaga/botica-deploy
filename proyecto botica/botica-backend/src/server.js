const app = require('./app');
require('./config/db'); // Inicia la conexión
require('dotenv').config();

console.log('GEMINI KEY presente:', !!process.env.GEMINI_API_KEY);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});