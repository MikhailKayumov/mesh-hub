import { type AxesHelper, type Box3Helper, type GridHelper, type Mesh } from 'three';

export class WorldHelpers {
  // private static GROUND_HELPER_LAYER = 9;
  // private static AXIS_GRID_HELPER_LAYER = 10;
  // private static SCENEBB_HELPER_LAYER = 11;

  public grid: GridHelper | null = null;
  public axis: AxesHelper | null = null;
  public ground: Mesh | null = null;
  public sceneBoundingBox: Box3Helper | null = null;

  public constructor() {}

  // private createAxisHelper(size = 1): AxesHelper {
  //   if (this.axis) {
  //     return this.axis;
  //   }
  //
  //   this.axis = new AxesHelper(size);
  //   this.axis.name = 'Axes helper';
  //   this.axis.layers.set(WorldHelpers.AXIS_GRID_HELPER_LAYER);
  //
  //   return this.axis;
  // }
  //
  // private createGridHelper(s: number, d: number, c1: ColorRepresentation, c2?: ColorRepresentation): GridHelper {
  //   if (this.grid) {
  //     return this.grid;
  //   }
  //
  //   this.grid = new GridHelper(s, d, c1, c2 ?? c1);
  //   this.grid.name = 'Grid helper';
  //   this.grid.layers.set(WorldHelpers.AXIS_GRID_HELPER_LAYER);
  //
  //   return this.grid;
  // }
}
