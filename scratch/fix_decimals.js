
const fs = require("fs");
const path = require("path");

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith(".tsx")) results.push(file);
        }
    });
    return results;
}

const files = walk("c:/khaliderp/src/components");
// Also check src/app
const appFiles = walk("c:/khaliderp/src/app");
const allFiles = files.concat(appFiles);

let totalReplaced = 0;

for (const file of allFiles) {
    let content = fs.readFileSync(file, "utf8");
    let newContent = content.replace(/\(e\.target\.value === ' \? ' \: Number\(e\.target\.value\)\)/g, "(e.target.value === ' ? ' : e.target.value)");
    newContent = newContent.replace(/Number\(e\.target\.value\)/g, "(e.target.value as any)");
    
    // Some specific fix for SalesModule creditAmt where we actually wanted Number
    if (file.includes("SalesModule.tsx")) {
        newContent = newContent.replace(/const creditAmt = e\.target\.value === ' \? 0 \: \(e\.target\.value as any\);/g, "const creditAmt = e.target.value === ' ? 0 : Number(e.target.value);");
        newContent = newContent.replace(/handleLimitChange\(\(e\.target\.value as any\)\)/g, "handleLimitChange(Number(e.target.value))");
    }
    if (file.includes("DataTable.tsx")) {
        newContent = newContent.replace(/handleLimitChange\(\(e\.target\.value as any\)\)/g, "handleLimitChange(Number(e.target.value))");
    }

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, "utf8");
        totalReplaced++;
        console.log("Updated", file);
    }
}
console.log("Total files updated:", totalReplaced);

