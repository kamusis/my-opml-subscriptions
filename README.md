# OPML Feed Validator and Analyzer

A Deno-based tool for validating and analyzing OPML feed subscriptions. This tool helps you clean up your RSS feed subscriptions by identifying dead feeds, inactive feeds, and sorting active feeds based on their update frequency.

## Features

- **Feed Validation**: Checks each feed's accessibility and update status
- **Feed Classification**:
  - Active: Feeds updated within the last 2 years
  - Inactive: Feeds not updated in the last 2 years
  - Dead: Feeds that are inaccessible
- **Update Frequency Analysis**: Tracks the number of updates in the last 3 months
- **Category-based Organization**: Maintains feed organization by categories
- **Statistical Analysis**: Generates detailed statistics with visualizations
- **Multiple Output Formats**: Generates separate OPML files for active, inactive, and dead feeds

## Prerequisites

- [Deno](https://deno.land/) 1.x or higher
- macOS, Linux, or Windows

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/my-opml-subscriptions.git
cd my-opml-subscriptions
```

## Usage

1. Place your OPML file in the `feeds` directory

2. Run the validator:
```bash
deno run --allow-read --allow-write --allow-net src/main.ts feeds/your-file.opml
```

Or use the predefined task in deno.json:
```bash
deno task start feeds/your-file.opml
```

### Output Files

The tool generates several files in the `feeds` directory:
- `*-active.opml`: Contains only active feeds, sorted by update frequency
- `*-inactive.opml`: Contains inactive feeds
- `*-dead.opml`: Contains inaccessible feeds
- `processing_statistics.md`: Statistical analysis report
- `feed_status_pie_chart.svg`: Visual distribution of feed statuses
- `active_feeds_bar_chart.svg`: Top categories by active feed count

## Project Structure

```
├── design/
│   └── design.md          # Project design documentation
├── feeds/                 # Input and output OPML files
├── src/
│   ├── main.ts           # Main entry point
│   ├── parseOPML.ts      # OPML parsing logic
│   ├── checkFeedAccessibility.ts  # Feed accessibility checker
│   ├── getFeedUpdateFrequency.ts  # Feed update frequency analyzer
│   ├── generateNewOPML.ts # OPML generation logic
│   └── writeStatistics.ts # Statistics generation
├── deno.json             # Deno configuration
└── README.md             # This file
```

## Statistics Generated

The tool generates comprehensive statistics including:
- Total number of feeds processed
- Distribution of feed statuses (active/inactive/dead)
- Top categories with the most active feeds
- Most frequently updated feeds
- Visual charts for easy analysis

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Deno](https://deno.land/)
- Uses XML parsing from Deno standard library