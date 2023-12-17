// https://stackoverflow.com/questions/66649604/how-to-convert-a-rgba-array-to-a-jpeg-image-in-a-web-worker
let canvas = null;

function main() {
  canvas = new OffscreenCanvas(100, 100);
}

self.onmessage = function ({ data: { rgba, width, height, dpr, targetDPR, mimeType = "image/jpeg", quality = 1 } }) {
  const buffer = new Uint8Array(rgba);
  // console.log('got message', buffer, width, height);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;  // the array of RGBA values

  for (let i = 0; i < height; i++) {
    const row_start = i * width * dpr * dpr * 4;
    const target_row_start = i * width * 4
    for (let j = 0; j < width; j++) {
      const cell_start = row_start + j * dpr * 4;
      const target_cell_start = target_row_start + j * 4;

      data[target_cell_start] = buffer[cell_start];     // red
      data[target_cell_start + 1] = buffer[cell_start + 1]; // green
      data[target_cell_start + 2] = buffer[cell_start + 2]; // blue
      data[target_cell_start + 3] = buffer[cell_start + 3]; // alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);
  canvas.convertToBlob({ quality, type: mimeType }).then((blob) => blob.arrayBuffer()).then((array: ArrayBuffer) => {
    self.postMessage({ jpg: array, width, height }, [ array ]);
  })
}

main();
