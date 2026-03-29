const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'pixelswip.json');
const outputPath = path.join(__dirname, 'pixelswip.fixed.json');

try {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data.tilesets)) {
    throw new Error('tilesets 배열을 찾을 수 없습니다.');
  }

  data.tilesets = data.tilesets.map((tileset) => {
    if (typeof tileset.image === 'string') {
      tileset.image = tileset.image
        .replaceAll('././files/archive/pixels/', 'archive/pixels/')
        .replaceAll('../../files/archive/pixels/', 'archive/pixels/')
        .replaceAll('..\\/..\\/files\\/archive\\/pixels\\/', 'archive/pixels/')
        .replaceAll('.\\/./files/archive/pixels/', 'archive/pixels/')
        .replaceAll('.\\/\\.\\/files\\/archive\\/pixels\\/', 'archive/pixels/')
        .replaceAll('\\', '/');
    }
    return tileset;
  });

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('완료됨');
  console.log(`새 파일: ${outputPath}`);
} catch (error) {
  console.error('수정 중 오류 발생:');
  console.error(error.message);
}