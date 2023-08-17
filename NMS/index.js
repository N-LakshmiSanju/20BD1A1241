const express = require('express');
const http = require('http');
const { URL } = require('url');
const app = express();
const port = 8008;

app.get('/numbers', async (req, res) => {
  const urls = req.query.url;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'Invalid URL parameter' });
  }

  const responsePromises = urls.map(async (url) => {
    try {
      const numbers = await fetchDataFromURLWithTimeout(url);
      return numbers;
    } catch (error) {
      console.error(`Error fetching data from ${url}: ${error.message}`);
      return [];
    }
  });

  try {
    const responses = await Promise.all(responsePromises);
    const mergedNumbers = Array.from(new Set(responses.flat())).sort((a, b) => a - b);
    return res.json({ numbers: mergedNumbers });
  } catch (error) {
    console.error(`Error processing responses: ${error.message}`);
    return res.status(500).json({ error: 'Error processing responses' });
  }
});

async function fetchDataFromURLWithTimeout(url) {
  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve([]), 500) // Resolve with empty array after 500 ms
  );

  const requestPromise = new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData.numbers || []);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });

  return Promise.race([requestPromise, timeoutPromise]);
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
