import { type PageProps } from "$fresh/server.ts";
import { getUserId } from "../../utils/user.ts";

export default function App({ Component }: PageProps) {
  // Ensure userId is initialized on every app load
  getUserId();
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>fresh-project</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
