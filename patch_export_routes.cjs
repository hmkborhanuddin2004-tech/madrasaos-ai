const fs = require('fs');
let content = fs.readFileSync('server/src/routes/exportRoutes.ts', 'utf8');

// Replace res.download with manual stream for .csv
content = content.replace(
  /res\.download\(filePath,\s*'students\.csv',\s*\(err\)\s*=>\s*\{[\s\S]*?\}\);/g,
  `res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.setHeader('Content-Type', 'text/csv');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => fs.unlink(filePath, () => {}));
    stream.on('error', (err) => next(err));`
);

// Replace res.download with manual stream for .xlsx
content = content.replace(
  /res\.download\(filePath,\s*'students\.xlsx',\s*\(err\)\s*=>\s*\{[\s\S]*?\}\);/g,
  `res.setHeader('Content-Disposition', 'attachment; filename="students.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => fs.unlink(filePath, () => {}));
    stream.on('error', (err) => next(err));`
);

fs.writeFileSync('server/src/routes/exportRoutes.ts', content);
