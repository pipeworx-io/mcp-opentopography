# @pipeworx/opentopography

[OpenTopography](https://opentopography.org) MCP — global DEM (digital elevation) rasters and point queries. Free API key required.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Auth

- Platform: `PLATFORM_OPENTOPOGRAPHY_KEY`. BYO: `?_apiKey=…`.

## Tools

- `point_elevation(lat, lon, dataset?)` — elevation at a point (NOTE: OpenTopography's main service returns rasters; this is a one-point convenience that calls their point service)
- `dem(dataset, south, north, west, east, format?)` — request a DEM raster for a bounding box (returns a download URL)
- `datasets()` — list available DEM datasets

`dataset`: `SRTMGL1` (default, 30m) | `SRTMGL3` (90m) | `AW3D30` | `NASADEM` | `COP30` (Copernicus 30m) | `COP90`.

## Data source

`https://portal.opentopography.org/API/`

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "opentopography": {
      "url": "https://gateway.pipeworx.io/opentopography/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Opentopography data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
