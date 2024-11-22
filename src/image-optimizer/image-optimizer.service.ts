import { Injectable } from '@nestjs/common';
import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';

@Injectable()
export class ImageOptimizerService {
  async optimizeImages(): Promise<void> {
    const files = await imagemin(['images/*.{jpg,png}'], {
      destination: 'build/images',
      plugins: [
        imageminJpegtran(),
        imageminPngquant({
          quality: [0.6, 0.8],
        }),
      ],
    });

    console.log('Images optimized:', files);
  }
}
