const fs = require('fs');

let staffPortal = fs.readFileSync('src/pages/StaffPortal.jsx', 'utf8');

// Update login
staffPortal = staffPortal.replace(
`      localStorage.setItem("portal_user_name", data.user.full_name);
      localStorage.setItem("portal_is_auth", "true");`,
`      localStorage.setItem("portal_user_name", data.user.full_name);
      localStorage.setItem("portal_is_auth", "true");
      if (data.token) {
        localStorage.setItem("portal_jwt_token", data.token);
      }`
);

// Update back/logout
staffPortal = staffPortal.replace(
`    localStorage.removeItem("portal_user_name");
    localStorage.removeItem("portal_is_auth");`,
`    localStorage.removeItem("portal_user_name");
    localStorage.removeItem("portal_is_auth");
    localStorage.removeItem("portal_jwt_token");`
);

fs.writeFileSync('src/pages/StaffPortal.jsx', staffPortal);
console.log('StaffPortal patched!');
