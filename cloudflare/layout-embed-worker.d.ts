export interface SharedPlacement {
  cropId: string;
  position: [number, number];
}

export interface SharedLayout {
  inputs: SharedPlacement[];
  targets: SharedPlacement[];
}

export interface GreenhouseDefinition {
  name: string;
  size: number;
  ground: string;
}

export interface GreenhouseDataset {
  crops: Record<string, GreenhouseDefinition>;
  mutations: Record<string, GreenhouseDefinition>;
}

export function layoutShareRoute(pathname: string): {
  code: string;
  preview: boolean;
} | null;

export function decodeSharedLayout(code: string): Promise<SharedLayout>;
export function buildLayoutShareDocument(
  code: string,
  origin: string,
  dataset?: GreenhouseDataset,
  requestedName?: string,
): Promise<string>;
export function buildLayoutPreviewDocument(
  code: string,
  origin: string,
  dataset?: GreenhouseDataset,
  requestedName?: string,
): Promise<string>;
export function handleLayoutEmbedRequest(
  request: Request,
  env: unknown,
): Promise<Response>;

declare const worker: { fetch: typeof handleLayoutEmbedRequest };
export default worker;
