// Type shim for @tanstack/react-start/api — the Vite/Cloudflare plugin handles
// this import at build time; this shim silences the TypeScript TS2307 error.
declare module "@tanstack/react-start/api" {
  export function createAPIFileRoute(
    path: string,
  ): (handler: {
    GET?: (ctx: { request: Request }) => Response | Promise<Response>;
    POST?: (ctx: { request: Request }) => Response | Promise<Response>;
    PUT?: (ctx: { request: Request }) => Response | Promise<Response>;
    PATCH?: (ctx: { request: Request }) => Response | Promise<Response>;
    DELETE?: (ctx: { request: Request }) => Response | Promise<Response>;
  }) => unknown;
}
