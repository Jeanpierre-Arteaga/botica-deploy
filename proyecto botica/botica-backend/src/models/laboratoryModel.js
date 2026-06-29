const pool = require('../config/db');

const LaboratoryModel = {

  findAll: async () => {
    const result = await pool.query(
      `SELECT * FROM laboratory ORDER BY laboratory_name`
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT * FROM laboratory WHERE laboratory_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  create: async ({ laboratory_name, laboratory_country }) => {
    const result = await pool.query(
      `INSERT INTO laboratory (laboratory_name, laboratory_country)
       VALUES ($1, $2)
       RETURNING *`,
      [laboratory_name, laboratory_country]
    );
    return result.rows[0];
  },

  // Resuelve un NOMBRE de laboratorio (texto libre) a su laboratory_id:
  // reutiliza el existente (case-insensitive) o crea uno nuevo. Devuelve null
  // si el nombre viene vacío. Permite que el admin escriba laboratorios nuevos
  // sin romper la FK product.laboratory_id → laboratory.laboratory_id.
  findOrCreateByName: async (rawName) => {
    const name = (rawName == null ? '' : String(rawName)).trim();
    if (!name) return null;
    const found = await pool.query(
      `SELECT laboratory_id FROM laboratory
       WHERE lower(laboratory_name) = lower($1)
       ORDER BY laboratory_id LIMIT 1`,
      [name]
    );
    if (found.rows[0]) return found.rows[0].laboratory_id;
    const created = await pool.query(
      `INSERT INTO laboratory (laboratory_name) VALUES ($1) RETURNING laboratory_id`,
      [name]
    );
    return created.rows[0].laboratory_id;
  },

  update: async (id, { laboratory_name, laboratory_country }) => {
    const result = await pool.query(
      `UPDATE laboratory
       SET laboratory_name = $1, laboratory_country = $2
       WHERE laboratory_id = $3
       RETURNING *`,
      [laboratory_name, laboratory_country, id]
    );
    return result.rows[0];
  }
};

module.exports = LaboratoryModel;