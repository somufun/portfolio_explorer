# portfolio_explorer

VGS Portfolio Explorer

A small client-side tool to explore the holdings, sector allocation and country allocation of the Vanguard VGS ETF.

## Features
- Upload a Vanguard holdings file (.xlsx or .csv) exported from Vanguard's holdings page.
- Interactive charts for Top 10 holdings, sector allocation and country allocation (Chart.js).
- Search by ticker or company to see your allocation for a given holding.
- Search by country to see total allocation to that country and a list of holdings from that country.
- Specify an investment amount to calculate estimated AUD allocation for each holding.

## How it works
- The app is purely client-side (no server). It uses Chart.js for charts and SheetJS (xlsx) to parse uploaded spreadsheets (CDN links are included in the HTML).
- Expected file format: the code looks for a header row that contains the strings `Holding Name`, `Ticker` and `% of net assets` and then reads subsequent rows.
  - Column mapping (based on the Vanguard export layout used by the parser):
    - Company / Holding Name -> company
    - Ticker -> ticker
    - Sector -> sector
    - Country -> country
    - % of net assets -> weight (percent number is parsed and used to compute allocations)

## Usage
1. Open `index.html` (or `vgs_explorer/index.html`) in your browser.
2. Click the "Download latest allocation & holdings" link in the page to open Vanguard's holdings page. On Vanguard's site open the Holdings tab and export the holdings (download .xlsx or .csv). The README and app assume the exported sheet contains the header fields mentioned above.
3. Click the "Upload .xlsx / .csv" button and choose the downloaded file.
4. After upload the dashboard will render:
   - Top 10 holdings bar chart
   - Sector doughnut chart
   - Country pie chart
   - Summary cards and Top holdings table
   - Search boxes for ticker/company and country
5. Change the "Investment ($)" input to compute allocation amounts for your holding size.

## Files
- `index.html` - main page (also a copy in `vgs_explorer/index.html`).
- `script.js` and `vgs_explorer/script.js` - client-side JavaScript with file parsing, charts and UI logic.
- `style.css` and `vgs_explorer/style.css` - CSS styling.

## Dependencies
- Chart.js (loaded via CDN)
- SheetJS (xlsx) (loaded via CDN)

## Notes & troubleshooting
- The parser looks for specific header text. If Vanguard changes their export format or headers, the file may not be located by the parser and you'll see an alert: "Could not locate holdings table." In that case open the spreadsheet and confirm the header names or adjust the parser in `script.js`.
- The parser ignores rows where the weight cannot be parsed as a number.

## License
- MIT (add your own license file if desired)

Enjoy exploring the VGS holdings — open the HTML file locally or serve the directory (e.g., via a static server) and upload the Vanguard export to visualize allocations.
