import { Destroyer } from '../Destroyer';
import { ViewerModel3D } from '../types';
import { isImageBitmapSource, isTexture } from '../utils';

export class LoaderCache {
  private readonly maxSize: number;

  private readonly store: Map<string, ViewerModel3D>;

  public constructor(maxSize = 2) {
    this.maxSize = maxSize;
    this.store = new Map<string, ViewerModel3D>();
  }

  public get(name: string): ViewerModel3D | null {
    return this.store.get(name) ?? null;
  }

  public set(name: string, data: ViewerModel3D): void {
    if (this.store.size >= this.maxSize) {
      this.clear(1);
    }

    this.store.set(name, data);
  }

  public delete(name: string): boolean {
    const item = this.store.get(name);
    if (!item) return false;

    const associations = item.associations?.keys();
    if (associations) {
      for (const association of associations) {
        if (isTexture(association) && isImageBitmapSource(association.source)) {
          Destroyer.destroyImageBitmap(association.source.data);
        }
      }
    }

    return this.store.delete(name);
  }

  public clear(removeItemCount?: number): void {
    if (!removeItemCount || removeItemCount >= this.store.size) {
      this.store.forEach((_, key) => this.delete(key));
    } else {
      const keys = Array.from(this.store.keys());
      for (let i = 0; i < removeItemCount; i++) {
        this.delete(keys[i]);
      }
    }
  }
}
