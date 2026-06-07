import fs from 'fs';
import { execSync } from 'child_process';

const envText = fs.readFileSync('.env.local', 'utf8');
const lines = envText.split('\n');

for (let line of lines) {
    if (!line || !line.includes('=')) continue;
    let [key, ...rest] = line.split('=');
    let val = rest.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
    }
    
    console.log(`Adding ${key}...`);
    try {
        execSync(`npx vercel env add ${key} production`, { input: val, stdio: ['pipe', 'inherit', 'inherit'] });
    } catch (e) {
        console.error(`Failed to add ${key}`);
    }
}
console.log('Done!');
