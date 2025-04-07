# Feeds Validator for OPML File

## Goal
The program aims to validate and clean up an OPML file by eliminating feeds that are no longer accessible or updated. It will also sort and retain only active feeds based on their update frequency.

## Steps

### 1. Scan the OPML File
- Parse the OPML file to extract all feed URLs.
- Organize feeds by their categories.

### 2. Check Feed Accessibility
- For each feed, verify if the feed URL is accessible.
  - If the feed is not accessible, mark it as **"dead"**.

### 3. Check Feed Update Frequency
- For accessible feeds, check the most recent update time.
  - If the newest update time is more than 2 years ago, mark the feed as **"inactive"**.
  - Otherwise, mark the feed as **"active"**.

### 4. Sort Active Feeds
- For feeds marked as "active":
  - Count the total number of updates in the last 3 months.
  - Sort the feeds within each category by their update frequency (highest to lowest).

### 5. Generate a New OPML File
- Create a new OPML file `active_{input_file_name}.opml` that:
  - Retains only active feeds.
  - Organizes feeds within their categories.
  - Sorts feeds in each category by update frequency.
- Create a new OPML file `dead_{input_file_name}.opml` that:
  - Retains only dead feeds.
  - Organizes feeds within their categories.
- Create a new OPML file `inactive_{input_file_name}.opml` that:
  - Retains only inactive feeds.
  - Organizes feeds within their categories.

### 6. Generate a Statistics File for the Processing Results
- Create a new markdown file named `processing_statistics_{input_file_name}.md` that includes:
    - **Total Feeds Processed**: The total number of feeds scanned from the OPML file.
    - **Dead Feeds**: The number of feeds marked as "dead" and their percentage of the total.
    - **Inactive Feeds**: The number of feeds marked as "inactive" and their percentage of the total.
    - **Active Feeds**: The number of feeds marked as "active" and their percentage of the total.
    - **Top Categories**: A summary of the top 3 categories with the highest number of active feeds.
    - **Most Frequently Updated Feeds**: A list of the top 5 feeds with the highest update frequency in the last 3 months.

- Include visualizations such as:
    - A pie chart showing the distribution of feed statuses (active, inactive, dead).
    - A bar chart displaying the number of active feeds per category.

- Ensure the statistics file is generated in the same directory as the new OPML file for easy reference.
- Use a library like `deno_chart` to generate charts if needed.
- Example structure of `processing_statistics_{input_file_name}.md`:
    ```markdown
    # Processing Statistics

    ## Summary
    - **Total Feeds Processed**: 120
    - **Dead Feeds**: 30 (25%)
    - **Inactive Feeds**: 40 (33.3%)
    - **Active Feeds**: 50 (41.7%)

    ## Top Categories
    1. **Technology**: 20 active feeds
    2. **Science**: 15 active feeds
    3. **News**: 10 active feeds

    ## Most Frequently Updated Feeds
    1. Feed A - 50 updates in the last 3 months
    2. Feed B - 45 updates in the last 3 months
    3. Feed C - 40 updates in the last 3 months
    4. Feed D - 35 updates in the last 3 months
    5. Feed E - 30 updates in the last 3 months

    ## Visualizations
    ![Feed Status Distribution](path/to/pie_chart.png)
    ![Active Feeds by Category](path/to/bar_chart.png)
    ```
- Provide meaningful file paths for the generated charts and ensure they are saved alongside the markdown file.

## Implementation Details

### Tools and Frameworks
- Use **Deno** and **TypeScript** for implementation.
- Utilize libraries for:
  - Parsing OPML files.
  - Fetching and validating feed URLs.
  - Parsing RSS/Atom feeds to check update times.

### Key Functions
1. **parseOPML(filePath: string): Promise<OPMLData>**
   - Parse the OPML file and return structured data.
   - Use import { parse } from "https://deno.land/x/xml/mod.ts";

2. **checkFeedAccessibility(feedUrl: string): Promise<boolean>**
   - Check if the feed URL is accessible.

3. **getFeedUpdateFrequency(feedUrl: string): Promise<FeedStatus>**
   - Fetch the feed and determine its update frequency.
   - Return the feed's status (active/inactive) and update count in the last 3 months.

4. **generateNewOPML(opmlData: OPMLData, outputPath: string): Promise<void>**
   - Generate a new OPML file with only active feeds, sorted by update frequency.

5. **deno.json**
   - Defines the Deno project configuration, including imports map for external modules, task definitions for running and testing the project, and compiler options for stricter type checking and compatibility with Deno and DOM APIs.

### Data Structures
- **FeedStatus**:
  ```typescript
  interface FeedStatus {
    url: string;
    status: 'active' | 'inactive' | 'dead';
    lastUpdate: Date | null;
    updatesInLast3Months: number;
  }
  ```

- **OPMLData**:
  ```typescript
  interface OPMLData {
    categories: {
      [categoryName: string]: FeedStatus[];
    };
  }
  ```

### Error Handling
- Handle network errors gracefully when checking feed accessibility.
- Log feeds that cannot be processed for debugging purposes.

### Logging
- Output a user-friendly processing log for each feed that is handled. 

### Output
- A new OPML file with the following characteristics:
  - Only active feeds are included.
  - Feeds are sorted by update frequency within their categories.
  - The structure of the original OPML file is preserved.