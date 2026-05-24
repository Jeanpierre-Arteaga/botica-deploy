const pool = require('../config/db');

const LocationModel = {

  findAll: async () => {
    const result = await pool.query(
      `SELECT * FROM location ORDER BY location_id`
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT * FROM location WHERE location_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  create: async ({ location_name, location_address, district, location_phone }) => {
    const result = await pool.query(
      `INSERT INTO location (location_name, location_address, district, location_phone, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [location_name, location_address, district, location_phone]
    );
    return result.rows[0];
  },

  update: async (id, { location_name, location_address, district, location_phone, is_active }) => {
    const result = await pool.query(
      `UPDATE location
       SET location_name=$1, location_address=$2, district=$3,
           location_phone=$4, is_active=$5
       WHERE location_id=$6
       RETURNING *`,
      [location_name, location_address, district, location_phone, is_active, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      `UPDATE location SET is_active = false WHERE location_id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
};

module.exports = LocationModel;