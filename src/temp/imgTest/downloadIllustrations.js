const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_JSON_PATH = process.env.DATA_PATH || path.join(__dirname, '..', '..', 'data.json');
const SEARCH_TERM_KEY = process.env.SEARCH_TERM_KEY || 'kanji'; 

const OUTPUT_DIR = __dirname;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function downloadImage(url, outputPath) {
    try {
        execSync(`curl -A "${USER_AGENT}" --create-dirs -o "${outputPath}" "${url}"`);
        return true;
    } catch (error) {
        console.error(`Failed to download ${url}: ${error.message}`);
        return false;
    }
}

function getBlogPostUrl(searchTerm) {
    const encodedTerm = encodeURIComponent(searchTerm);
    const searchUrl = `https://www.irasutoya.com/search?q=${encodedTerm}`;
    console.log(`Searching いらすとや (Irasutoya) for: "${searchTerm}"`);

    try {
        const responseHtml = execSync(`curl -A "${USER_AGENT}" "${searchUrl}" --silent`).toString();
        const singleLineHtml = responseHtml.replace(/\n/g, ' ');

        const blogPostMatch = singleLineHtml.match(/class=['"]boxmeta clearfix['"].*?<a[^>]*href=['"](https:\/\/www\.irasutoya\.com\/\d{4}\/\d{2}\/blog-post_[^'"]+\.html)['"]/i);

        if (!blogPostMatch || !blogPostMatch[1]) {
            console.error(`No search results found for "${searchTerm}"`);
            return null;
        }
        return blogPostMatch[1];

    } catch (error) {
        console.error(`Error finding blog post for "${searchTerm}": ${error.message}`);
        return null;
    }
}

async function main() {
    let data;
    try {
        console.log(`Reading dictionary data from: ${DATA_JSON_PATH}`);
        data = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
    } catch (error) {
        console.error(`Error reading ${DATA_JSON_PATH}: ${error.message}`);
        return;
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log(`Starting bulk image download for ${data.length} items...`);
    console.log(`Using JSON key "${SEARCH_TERM_KEY}" for search queries.`);

    for (const card of data) {
        let searchTerm = card[SEARCH_TERM_KEY];
        
        if (!searchTerm) {
            console.log(`Skipping ID ${card.id} due to missing "${SEARCH_TERM_KEY}" value.`);
            continue;
        }

        console.log(`\n--- Processing ID ${card.id}: ${searchTerm} ---`);
        const blogPostUrl = getBlogPostUrl(searchTerm);

        if (blogPostUrl) {
            try {
                const blogResponseHtml = execSync(`curl -A "${USER_AGENT}" "${blogPostUrl}" --silent`).toString();
                const singleLineHtml = blogResponseHtml.replace(/\n/g, ' ');
                
                const imageMatch = singleLineHtml.match(/id=['"]post['"][^>]*>.*?class=['"]entry['"][^>]*>.*?class=['"]separator['"][^>]*>.*?<a[^>]+href=['"]([^'"]+)['"]/i);

                if (imageMatch && imageMatch[1]) {
                    const selectedImageUrl = imageMatch[1];
                    
                    // Direct mapping: use the "image" value from the JSON object
                    const filename = card.image;
                    const outputPath = path.join(OUTPUT_DIR, filename);

                    await downloadImage(selectedImageUrl, outputPath);
                    console.log(`Saved To: ${outputPath}`);
                } else {
                    console.warn(`No illustration structure found for "${searchTerm}".`);
                }
            } catch (error) {
                console.error(`Error extracting image for "${searchTerm}": ${error.message}`);
            }
        }
        
        execSync('sleep 1');
    }
    
    console.log("\nBatch download script finished.");
}

main();