const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const query = `[out:json][timeout:90];
relation["admin_level"="4"]["name:en"="Chon Buri Province"];
out body;
>;
out skel qt;`;

const req = https.request({
  hostname: 'overpass-api.de',
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'UrbanHeat-App/1.0'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('chonburi_boundary_osm.json', data);
    console.log("Downloaded boundary OSM JSON, running osmtogeojson...");
    try {
      execSync('npx osmtogeojson chonburi_boundary_osm.json > chonburi_boundary.geojson');
      console.log("Converted boundary to GeoJSON successfully!");
    } catch(e) {
      console.error("Conversion failed", e.message);
    }
  });
});

req.on('error', e => console.error("Error:", e));
req.write(query);
req.end();
