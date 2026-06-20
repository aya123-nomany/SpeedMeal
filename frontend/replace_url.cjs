const fs = require('fs');
const path = require('path');

function replaceInDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('http://localhost:5000')) {
                content = content.replace(/http:\/\/localhost:5000/g, 'https://speedmeal.ayaennoamany.workers.dev');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

replaceInDirectory(path.join(__dirname, 'src'));
