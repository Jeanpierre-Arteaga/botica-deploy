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

  create: async ({
    location_name, location_address, district, location_phone,
    location_email = null, schedule = null, maps_query = null,
    latitude = null, longitude = null,
  }) => {
    const result = await pool.query(
      `INSERT INTO location
         (location_name, location_address, district, location_phone,
          location_email, schedule, maps_query, latitude, longitude, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING *`,
      [location_name, location_address, district, location_phone,
       location_email, schedule, maps_query, latitude, longitude]
    );
    return result.rows[0];
  },

  update: async (id, {
    location_name, location_address, district, location_phone,
    location_email = null, schedule = null, maps_query = null,
    latitude = null, longitude = null, is_active,
  }) => {
    const result = await pool.query(
      `UPDATE location
       SET location_name=$1, location_address=$2, district=$3,
           location_phone=$4, location_email=$5, schedule=$6,
           maps_query=$7, latitude=$8, longitude=$9, is_active=$10
       WHERE location_id=$11
       RETURNING *`,
      [location_name, location_address, district, location_phone,
       location_email, schedule, maps_query, latitude, longitude, is_active, id]
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