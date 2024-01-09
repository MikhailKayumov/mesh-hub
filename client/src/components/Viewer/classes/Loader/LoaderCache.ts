import { ViewerModel3D } from '@/components/Viewer/classes/types';
import { isImageBitmapSource, isTexture } from '@/components/Viewer/classes/utils';

export default class LoaderCache {
  private static readonly MAX_SIZE = 10;
  private static readonly store = new Map<string, ViewerModel3D>();

  public static getItem(name: string): ViewerModel3D | undefined {
    return this.store.get(name);
  }

  public static setItem(name: string, data: ViewerModel3D): LoaderCache {
    if (data) {
      if (this.store.size >= this.MAX_SIZE) {
        this.clear(1);
      }

      this.store.set(name, data);
    } else {
      this.removeItem(name);
    }

    return this;
  }

  public static removeItem(name: string): boolean {
    const item = this.store.get(name);
    if (!item) return false;

    const associations = item.associations?.keys();
    if (associations) {
      for (const association of associations) {
        if (isTexture(association) && isImageBitmapSource(association.source)) {
          association.source.data.close();
        }
      }
    }

    return this.store.delete(name);
  }

  public static clear(removeItemCount?: number): LoaderCache {
    if (!removeItemCount || removeItemCount >= this.store.size) {
      Array.from(this.store.keys()).forEach(this.removeItem, this);
    } else {
      const keys = Array.from(this.store.keys());
      for (let i = 0; i < removeItemCount; i++) {
        this.removeItem(keys[i]);
      }
    }

    return this;
  }
}
