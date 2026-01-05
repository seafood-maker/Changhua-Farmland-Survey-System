
export type MarkerType = 'WELL' | 'INLET' | 'SERIES_INLET' | 'SAMPLE';

export interface Point {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export interface Marker extends Point {
  id: string;
  type: MarkerType;
}

export interface PlotRange {
  id: string;
  points: Point[];
}

export interface InspectionData {
  irrigationMethods: string[];
  landStatus: string[];
  otherStatus?: string;
  photos: {
    irrigation: string[];
    land: string[];
    surrounding: string[];
  };
}

export interface FarmlandTask {
  id: string;
  code: string;
  year: string;
  owner: string;
  baseImage: string;
  status: 'PENDING' | 'COMPLETED' | 'EDITING';
  markers: Marker[];
  ranges: PlotRange[];
  formData: InspectionData;
}

export interface AppState {
  projectName: string;
  tasks: FarmlandTask[];
  view: 'list' | 'editor' | 'setup';
  currentTaskId?: string;
  isEditingMap: boolean;
}
