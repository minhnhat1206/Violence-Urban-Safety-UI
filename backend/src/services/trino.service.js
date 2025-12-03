const axios = require('axios');
const config = require('../config');

const executeTrinoQuery = async (query) => {
  try {
    // 1. Gửi query ban đầu
    const response = await axios.post(
      `http://${config.trino.host}:${config.trino.port}/v1/statement`,
      query,
      {
        headers: {
          'X-Trino-User': config.trino.user,
          'X-Trino-Catalog': config.trino.catalog,
          'X-Trino-Schema': config.trino.schema,
        },
      }
    );

    let data = [];
    let nextUri = response.data.nextUri;
    
    // Lấy data ngay từ response đầu tiên (nếu có)
    if (response.data.data) {
      data = data.concat(response.data.data);
    }

    // 2. Loop để lấy hết các trang kết quả (Pagination)
    while (nextUri) {
      const nextRes = await axios.get(nextUri, {
        headers: {
          'X-Trino-User': config.trino.user,
          'X-Trino-Catalog': config.trino.catalog,
          'X-Trino-Schema': config.trino.schema,
        },
      });
      
      if (nextRes.data.data) {
        data = data.concat(nextRes.data.data);
      }
      
      if (nextRes.data.error) {
         console.error("Trino SQL Error:", nextRes.data.error);
         throw new Error(`Trino Error: ${nextRes.data.error.message}`);
      }

      nextUri = nextRes.data.nextUri;
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

module.exports = { executeTrinoQuery };