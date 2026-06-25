const pool = require('../config/db');

// ============================================================
// BOTICA CENTRAL — Modelo de imágenes de producto
// ============================================================
// Solo trabajamos con la imagen principal (type='main'). El schema
// garantiza una única fila 'main' por producto vía índice parcial:
//   CREATE UNIQUE INDEX idx_image_main_unique
//     ON image(product_id) WHERE type = 'main';
// ============================================================

const ImageModel = {

  /** Devuelve la fila type='main' del producto (o undefined). */
  getMainByProduct: async (product_id) => {
    const result = await pool.query(
      `SELECT * FROM image WHERE product_id = $1 AND type = 'main' LIMIT 1`,
      [product_id]
    );
    return result.rows[0];
  },

  /**
   * Inserta o actualiza la imagen principal del producto respetando
   * el índice único parcial. Devuelve la fila resultante.
   */
  upsertMain: async (product_id, url) => {
    const result = await pool.query(
      `INSERT INTO image (url, type, product_id)
       VALUES ($1, 'main', $2)
       ON CONFLICT (product_id) WHERE type = 'main'
       DO UPDATE SET url = EXCLUDED.url
       RETURNING *`,
      [url, product_id]
    );
    return result.rows[0];
  },

  /**
   * Borra la(s) imagen(es) principal(es) del producto.
   * Devuelve las urls borradas para que el controller pueda limpiar S3.
   */
  deleteByProduct: async (product_id) => {
    const result = await pool.query(
      `DELETE FROM image
       WHERE product_id = $1 AND type = 'main'
       RETURNING url`,
      [product_id]
    );
    return result.rows.map((r) => r.url);
  },
};

module.exports = ImageModel;
