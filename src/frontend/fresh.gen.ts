// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_export from "./routes/api/export.ts";
import * as $api_feeds from "./routes/api/feeds.ts";
import * as $api_status from "./routes/api/status.ts";
import * as $api_upload from "./routes/api/upload.ts";
import * as $api_validate from "./routes/api/validate.ts";
import * as $api_validation_status from "./routes/api/validation-status.ts";
import * as $greet_name_ from "./routes/greet/[name].tsx";
import * as $index from "./routes/index.tsx";
import * as $ws from "./routes/ws.ts";
import * as $ExportButton from "./islands/ExportButton.tsx";
import * as $FeedListControls from "./islands/FeedListControls.tsx";
import * as $FeedManagementIsland from "./islands/FeedManagementIsland.tsx";
import * as $OPMLUploaderIsland from "./islands/OPMLUploaderIsland.tsx";
import * as $ValidationStatus from "./islands/ValidationStatus.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/api/export.ts": $api_export,
    "./routes/api/feeds.ts": $api_feeds,
    "./routes/api/status.ts": $api_status,
    "./routes/api/upload.ts": $api_upload,
    "./routes/api/validate.ts": $api_validate,
    "./routes/api/validation-status.ts": $api_validation_status,
    "./routes/greet/[name].tsx": $greet_name_,
    "./routes/index.tsx": $index,
    "./routes/ws.ts": $ws,
  },
  islands: {
    "./islands/ExportButton.tsx": $ExportButton,
    "./islands/FeedListControls.tsx": $FeedListControls,
    "./islands/FeedManagementIsland.tsx": $FeedManagementIsland,
    "./islands/OPMLUploaderIsland.tsx": $OPMLUploaderIsland,
    "./islands/ValidationStatus.tsx": $ValidationStatus,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
