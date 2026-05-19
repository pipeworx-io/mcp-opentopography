interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * OpenTopography MCP.
 */


const BASE = 'https://portal.opentopography.org/API';
const UA = 'pipeworx-mcp-opentopography/1.0 (+https://pipeworx.io)';

const VALID_DATASETS = new Set(['SRTMGL1', 'SRTMGL3', 'AW3D30', 'NASADEM', 'COP30', 'COP90']);

const tools: McpToolExport['tools'] = [
  {
    name: 'point_elevation',
    description: 'Elevation at a point (returns a 1-pixel raster URL — use opentopodata for direct point values).',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lon: { type: 'number' },
        dataset: { type: 'string' },
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'dem',
    description: 'DEM raster for a bounding box (returns URL to GeoTIFF).',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: { type: 'string' },
        south: { type: 'number' },
        north: { type: 'number' },
        west: { type: 'number' },
        east: { type: 'number' },
        format: { type: 'string', description: 'GTiff (default) | AAIGrid | HFA' },
      },
      required: ['dataset', 'south', 'north', 'west', 'east'],
    },
  },
  {
    name: 'datasets',
    description: 'List available DEM datasets.',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey && name !== 'datasets') throw new Error('OpenTopography requires an API key. Set PLATFORM_OPENTOPOGRAPHY_KEY or pass ?_apiKey=… (free at https://portal.opentopography.org/myopentopo).');
  switch (name) {
    case 'point_elevation': {
      const lat = args.lat as number;
      const lon = args.lon as number;
      const dataset = String(args.dataset ?? 'SRTMGL1');
      if (!VALID_DATASETS.has(dataset)) throw new Error(`dataset must be one of: ${[...VALID_DATASETS].join(', ')}`);
      const d = 0.001;
      const p = new URLSearchParams({
        demtype: dataset,
        south: String(lat - d),
        north: String(lat + d),
        west: String(lon - d),
        east: String(lon + d),
        outputFormat: 'GTiff',
        API_Key: apiKey!,
      });
      return otGet(`/globaldem?${p}`);
    }
    case 'dem': {
      const dataset = reqStr(args, 'dataset', '"SRTMGL1"');
      if (!VALID_DATASETS.has(dataset)) throw new Error(`dataset must be one of: ${[...VALID_DATASETS].join(', ')}`);
      const p = new URLSearchParams({
        demtype: dataset,
        south: String(args.south),
        north: String(args.north),
        west: String(args.west),
        east: String(args.east),
        outputFormat: String(args.format ?? 'GTiff'),
        API_Key: apiKey!,
      });
      return otGet(`/globaldem?${p}`);
    }
    case 'datasets':
      return { datasets: [...VALID_DATASETS] };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function otGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'User-Agent': UA } });
  if (res.status === 401 || res.status === 403) throw new Error('OpenTopography: invalid API key.');
  if (!res.ok) throw new Error(`OpenTopography: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  // OpenTopography returns the raster directly (binary). Return the URL for the agent to fetch separately.
  return { request_url: `https://portal.opentopography.org${path}`, content_type: res.headers.get('content-type'), size_bytes: Number(res.headers.get('content-length') ?? 0) };
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
