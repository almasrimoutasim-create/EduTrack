const fs = require('fs');

let authContext = fs.readFileSync('src/lib/AuthContext.jsx', 'utf8');
authContext = authContext.replace(
`      localStorage.setItem('portal_user_name', loggedUser.full_name);
      localStorage.setItem('portal_is_auth', 'true');`,
`      localStorage.setItem('portal_user_name', loggedUser.full_name);
      localStorage.setItem('portal_is_auth', 'true');
      if (data.token) {
        localStorage.setItem('portal_jwt_token', data.token);
      }`
);
authContext = authContext.replace(
`    localStorage.removeItem('portal_user_name');
    localStorage.removeItem('portal_is_auth');`,
`    localStorage.removeItem('portal_user_name');
    localStorage.removeItem('portal_is_auth');
    localStorage.removeItem('portal_jwt_token');`
);
fs.writeFileSync('src/lib/AuthContext.jsx', authContext);

let dbClient = fs.readFileSync('src/api/dbClient.js', 'utf8');
dbClient = dbClient.replace(
`  async list(order = '-created_at', filtersOrLimit = null, limitOrOffset = null, offset = null) {`,
`  getHeaders() {
    const token = localStorage.getItem('portal_jwt_token');
    return token ? { 'Authorization': \`Bearer \${token}\` } : {};
  }

  async list(order = '-created_at', filtersOrLimit = null, limitOrOffset = null, offset = null) {`
);

dbClient = dbClient.replace(
`    const response = await fetch(\`\${this.baseUrl}?\${params.toString()}\`);`,
`    const response = await fetch(\`\${this.baseUrl}?\${params.toString()}\`, { headers: this.getHeaders() });`
);

dbClient = dbClient.replace(
`    const response = await fetch(\`\${this.baseUrl}/\${id}\`);`,
`    const response = await fetch(\`\${this.baseUrl}/\${id}\`, { headers: this.getHeaders() });`
);

dbClient = dbClient.replace(
`    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });`,
`    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getHeaders() },
      body: JSON.stringify(data),
    });`
);

dbClient = dbClient.replace(
`    const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });`,
`    const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...this.getHeaders() },
      body: JSON.stringify(data),
    });`
);

dbClient = dbClient.replace(
`    const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
      method: 'DELETE',
    });`,
`    const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });`
);

fs.writeFileSync('src/api/dbClient.js', dbClient);

console.log('Patch complete!');
