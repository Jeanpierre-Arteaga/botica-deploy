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