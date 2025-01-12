import {DensityFunction2D} from './DensityFunction2D';

export class ImageLoader {
    /**
     * Loads an image and converts it to a DensityFunction2D.
     * @param imageUrl The URL of the image to load.
     * @param colorMapping A function that maps a color to a grayscale value (0-255).
     * @returns A Promise that resolves to a DensityFunction2D.
     */
    static async loadImageAsDensityFunction(
        imageUrl: string,
        colorMapping: (r: number, g: number, b: number, a: number) => number = ImageLoader.colorToGrayscale
    ): Promise<DensityFunction2D> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";  // To handle CORS issues
            img.onload = () => {
                const densityFunction = ImageLoader.convertToDensityFunction(img, colorMapping);
                if (densityFunction) {
                    resolve(densityFunction);
                } else {
                    reject(new Error('Failed to convert image to density function'));
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = imageUrl;
        });
    }


    static convertToDensityFunction(
        img: HTMLImageElement,
        color_mapping: (r: number, g: number, b: number, a: number) => number = ImageLoader.colorToGrayscale
    ): DensityFunction2D | null {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('Failed to get 2D context');
            return null;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const densityData: number[][] = [];

        for (let y = 0; y < img.height; y++) {
            densityData[y] = [];
            for (let x = 0; x < img.width; x++) {
                const i = (y * img.width + x) * 4;
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                const a = imageData.data[i + 3];

                densityData[y][x] = color_mapping(r, g, b, a);
            }
        }

        return new DensityFunction2D(densityData);
    }

    static colorToGrayscale = (r: number, g: number, b: number, a: number): number => {
        // Simple grayscale conversion
        return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    };
}
