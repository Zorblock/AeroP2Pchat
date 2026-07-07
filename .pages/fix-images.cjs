const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all <img and <motion.img with lazy loading added
content = content.replace(/<img/g, '<img loading="lazy" decoding="async"');
content = content.replace(/<motion\.img/g, '<motion.img loading="lazy" decoding="async"');

// We want to make sure the main logo is eager, so it loads instantly.
// The logo is <img loading="lazy" decoding="async" src={`${import.meta.env.BASE_URL}logo.png`}
content = content.replace(
  /<img loading="lazy" decoding="async" src={`\$\{import\.meta\.env\.BASE_URL\}logo\.png`}/g,
  '<img fetchpriority="high" src={`${import.meta.env.BASE_URL}logo.png`}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Images optimized in App.tsx');
