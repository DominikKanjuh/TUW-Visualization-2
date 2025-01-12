import { DensityFunction2D } from './DensityFunction2D';
import {ImageLoader} from "./ImageLoader";
import {DensityFunction2DEggholder} from "./DensityFunction2DEggholder";

export class ImageDragDrop {
    private dropZone: HTMLElement;
    private fileInput: HTMLInputElement;

    public densityFunction: DensityFunction2D | null = null;

    constructor(dropZoneId: string) {
        this.dropZone = document.getElementById(dropZoneId) as HTMLElement;
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*';

        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    private handleDragOver(e: DragEvent): void {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('dragover');
    }

    private handleDrop(e: DragEvent): void {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('dragover');

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            this.processFile(files[0]);
        }
    }

    private handleFileSelect(e: Event): void {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            this.processFile(files[0]);
        }
    }

    private processFile(file: File): void {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const img = new Image();
            img.onload = () => {
                this.densityFunction = ImageLoader.convertToDensityFunction(img);
                console.log("density Function loaded: ", this.densityFunction);
                return ImageLoader.convertToDensityFunction(img);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    getDensityFunction() {
        return this.densityFunction;
    }
}