import { OPMLData } from "./parseOPML.ts";

// TODO: handle rss feed's name: <outline type="rss" text="小武爸爸" title="小武爸爸"

function generateOPMLContent(opmlData: OPMLData, status: 'active' | 'dead' | 'inactive', title: string): string {
  let opmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${title}</title>
  </head>
  <body>
`;

  for (const [category, feeds] of Object.entries(opmlData.categories)) {
    const filteredFeeds = feeds.filter((feed) => feed.status === status);
    if (filteredFeeds.length > 0) {
      opmlContent += `    <outline text="${category}">
`;
      if (status === 'active') {
        // Sort active feeds by update frequency
        filteredFeeds.sort((a, b) => b.updatesInLast3Months - a.updatesInLast3Months);
      }
      filteredFeeds.forEach((feed) => {
        opmlContent += `      <outline text="${feed.url}" xmlUrl="${feed.url}" />
`;
      });
      opmlContent += `    </outline>
`;
    }
  }

  opmlContent += `  </body>
</opml>`;
  return opmlContent;
}

export async function generateNewOPML(opmlData: OPMLData, outputPath: string): Promise<void> {
  const encoder = new TextEncoder();
  const basePath = outputPath.replace('-Filtered.opml', '').replace('-filtered.opml', '');
  
  // Generate active feeds OPML
  const activeContent = generateOPMLContent(opmlData, 'active', 'Active Feeds');
  await Deno.writeFile(`${basePath}-active.opml`, encoder.encode(activeContent));
  
  // Generate dead feeds OPML
  const deadContent = generateOPMLContent(opmlData, 'dead', 'Dead Feeds');
  await Deno.writeFile(`${basePath}-dead.opml`, encoder.encode(deadContent));
  
  // Generate inactive feeds OPML
  const inactiveContent = generateOPMLContent(opmlData, 'inactive', 'Inactive Feeds');
  await Deno.writeFile(`${basePath}-inactive.opml`, encoder.encode(inactiveContent));
}