// ================================
// GLOBALS
// ================================

let holdings = [];

let topChart = null;
let sectorChart = null;
let countryChart = null;

// ================================
// INITIALIZATION
// ================================

document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
});

// ================================
// EVENTS
// ================================

function setupEvents() {

    document
        .getElementById("searchBtn")
        .addEventListener("click", searchHolding);

    const countryBtn = document.getElementById("countrySearchBtn");
    if (countryBtn) {
        countryBtn.addEventListener("click", searchByCountry);
    }

    document
        .getElementById("investment")
        .addEventListener("change", () => {
            renderTopHoldingsTable();
        });

    document
        .getElementById("fileInput")
        .addEventListener("change", handleFileUpload);
}

// ================================
// FILE UPLOAD
// ================================

function handleFileUpload(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        const data = e.target.result;

        const workbook = XLSX.read(
            data,
            { type: "binary" }
        );

        const firstSheet =
            workbook.SheetNames[0];

        const worksheet =
            workbook.Sheets[firstSheet];

        const rawData =
            XLSX.utils.sheet_to_json(
                worksheet,
                { header: 1 }
            );

        holdings =
            parseVanguardSheet(rawData);

        renderDashboard();
    };

    reader.readAsBinaryString(file);
}

// ================================
// PARSE VANGUARD XLSX
// ================================

function parseVanguardSheet(rows) {

    let headerRow = -1;

    for (let i = 0; i < rows.length; i++) {

        const row = rows[i];

        if (
            row.includes("Holding Name") &&
            row.includes("Ticker") &&
            row.includes("% of net assets")
        ) {
            headerRow = i;
            break;
        }
    }

    if (headerRow === -1) {
        alert("Could not locate holdings table.");
        return [];
    }

    const result = [];

    for (let i = headerRow + 1; i < rows.length; i++) {

        const row = rows[i];

        if (
            !row ||
            !row[0] ||
            typeof row[0] !== "string"
        ) {
            continue;
        }

        const name = row[0];
        const ticker = row[1];
        const sector = row[2];
        const country = row[3];
        const weightString = row[4];

        if (!weightString) continue;

        const weight =
            parseFloat(
                String(weightString)
                    .replace("%", "")
            );

        if (isNaN(weight)) continue;

        result.push({
            company: name,
            ticker: ticker,
            sector: sector,
            country: country,
            weight: weight
        });
    }

    console.log(
        `Loaded ${result.length} holdings`
    );

    return result;
}

// ================================
// DASHBOARD
// ================================

function renderDashboard() {
    if (!holdings.length) return;

    renderSummaryCards();

    renderTop10Chart();

    renderSectorChart();

    renderCountryChart();

    renderTopHoldingsTable();
    populateCountryAutocomplete();
}

function populateCountryAutocomplete() {
    const list = document.getElementById('countryList');
    if (!list) return;

    // clear existing options
    list.innerHTML = '';

    const countries = Array.from(new Set(holdings.map(h => (h.country || '').trim()).filter(Boolean)));
    countries.sort((a,b)=> a.localeCompare(b));

    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        list.appendChild(opt);
    });
}

function renderCountryChart() {
    const countries = {};

    holdings.forEach(h => {
        const key = h.country || "Unknown";
        if (!countries[key]) countries[key] = 0;
        countries[key] += h.weight;
    });

    const labels = Object.keys(countries);
    const data = Object.values(countries);

    const ctx = document.getElementById("countryChart");

    if (countryChart) {
        countryChart.destroy();
    }

    countryChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels,
            datasets: [{ data }]
        },
        options: { responsive: true }
    });
}

// ================================
// INVESTMENT VALUE
// ================================

function getInvestmentAmount() {

    const value =
        parseFloat(
            document
                .getElementById("investment")
                .value
        );

    return isNaN(value)
        ? 10000
        : value;
}

// ================================
// TOP 10 HOLDINGS
// ================================

function getTop10() {

    return [...holdings]
        .sort(
            (a, b) =>
                b.weight - a.weight
        )
        .slice(0, 10);
}

function renderTop10Chart() {

    const top10 = getTop10();

    const labels =
        top10.map(x => x.company);

    const data =
        top10.map(x => x.weight);

    const ctx =
        document
            .getElementById("topChart");

    if (topChart) {
        topChart.destroy();
    }

    topChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label:
                        "% of VGS",
                    data,
                    backgroundColor:
                        "#4F46E5"
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ================================
// SECTOR AGGREGATION
// ================================

function getSectorTotals() {

    const sectors = {};

    holdings.forEach(h => {

        if (!sectors[h.sector]) {
            sectors[h.sector] = 0;
        }

        sectors[h.sector] += h.weight;
    });

    return sectors;
}

function renderSectorChart() {

    const sectorTotals =
        getSectorTotals();

    const labels =
        Object.keys(sectorTotals);

    const data =
        Object.values(sectorTotals);

    const ctx =
        document
            .getElementById(
                "sectorChart"
            );

    if (sectorChart) {
        sectorChart.destroy();
    }

    sectorChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [
                {
                    data
                }
            ]
        },
        options: {
            responsive: true
        }
    });
}

// ================================
// SEARCH
// ================================

function searchHolding() {

    const q =
        document
            .getElementById("searchBox")
            .value
            .trim()
            .toLowerCase();

    if (!q) return;

    const match =
        holdings.find(h => {

            const ticker =
                (h.ticker || "")
                .toLowerCase();

            const company =
                (h.company || "")
                .toLowerCase();

            return (
                ticker === q ||
                company.includes(q)
            );
        });

    const resultDiv =
        document
            .getElementById(
                "searchResult"
            );

    if (!match) {

        resultDiv.innerHTML = `
            <div class="card">
                No matching holding found.
            </div>
        `;

        return;
    }

    const investment =
        getInvestmentAmount();

    const amount =
        investment *
        match.weight /
        100;

    resultDiv.innerHTML = `

        <div class="card">

            <h3>${match.company}</h3>

            <p>
                <strong>Ticker:</strong>
                ${match.ticker}
            </p>

            <p>
                <strong>Sector:</strong>
                ${match.sector}
            </p>

            <p>
                <strong>Weight:</strong>
                ${match.weight.toFixed(4)}%
            </p>

            <p>
                <strong>Your allocation:</strong>
                ${formatCurrency(amount)}
            </p>

        </div>
    `;
}

function searchByCountry() {

    const q = (document.getElementById("countrySearch").value || "").trim().toLowerCase();

    const resultDiv = document.getElementById("countryResult");

    if (!q) {
        resultDiv.innerHTML = `<div class="card">Enter a country to search.</div>`;
        return;
    }

    const matches = holdings.filter(h => (h.country || "").toLowerCase().includes(q));

    if (!matches.length) {
        resultDiv.innerHTML = `<div class="card">No holdings found for "${q}".</div>`;
        return;
    }

    const totalWeight = matches.reduce((s, h) => s + (h.weight || 0), 0);

    const investment = getInvestmentAmount();

    const allocation = investment * totalWeight / 100;

    let html = `
        <div class="card">
            <h3>Country: ${matches[0].country}</h3>
            <p><strong>Total allocation:</strong> ${totalWeight.toFixed(3)}%</p>
            <p><strong>Your allocation:</strong> ${formatCurrency(allocation)}</p>
            <h4>Holdings</h4>
            <table>
                <thead><tr><th>Company</th><th>Ticker</th><th>Weight</th><th>Allocation</th></tr></thead>
                <tbody>
    `;

    matches.forEach(h => {
        const amt = investment * h.weight / 100;
        html += `<tr><td>${h.company}</td><td>${h.ticker}</td><td>${h.weight.toFixed(3)}%</td><td>${formatCurrency(amt)}</td></tr>`;
    });

    html += `</tbody></table></div>`;

    resultDiv.innerHTML = html;
}

// ================================
// TOP HOLDINGS TABLE
// ================================

function renderTopHoldingsTable() {

    let container =
        document.getElementById(
            "topHoldingsTable"
        );

    if (!container) return;

    const investment =
        getInvestmentAmount();

    const top10 =
        getTop10();

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Company</th>
                    <th>Ticker</th>
                    <th>Weight</th>
                    <th>Allocation</th>
                </tr>
            </thead>
            <tbody>
    `;

    top10.forEach(h => {

        const amount =
            investment *
            h.weight /
            100;

        html += `
            <tr>
                <td>${h.company}</td>
                <td>${h.ticker}</td>
                <td>${h.weight.toFixed(3)}%</td>
                <td>${formatCurrency(amount)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// ================================
// HELPERS
// ================================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-AU",
        {
            style: "currency",
            currency: "AUD"
        }
    ).format(value);
}

function renderSummaryCards() {

    const investment = getInvestmentAmount();

    const largestHolding =
        [...holdings].sort(
            (a,b) => b.weight - a.weight
        )[0];

    const sectors = getSectorTotals();

    const largestSector =
        Object.entries(sectors)
            .sort((a,b)=>b[1]-a[1])[0];

    const top10Weight =
        getTop10()
            .reduce(
                (sum,h)=>sum+h.weight,
                0
            );

    document.getElementById(
        "summaryCards"
    ).innerHTML = `

        <div class="card metric-card">
            <h3>Portfolio</h3>
            <span>${formatCurrency(investment)}</span>
        </div>

        <div class="card metric-card">
            <h3>Holdings</h3>
            <span>${holdings.length}</span>
        </div>

        <div class="card metric-card">
            <h3>Largest Holding</h3>
            <span>${largestHolding.company}</span>
        </div>

        <div class="card metric-card">
            <h3>Top 10 Concentration</h3>
            <span>${top10Weight.toFixed(2)}%</span>
        </div>

        <div class="card metric-card">
            <h3>Largest Sector</h3>
            <span>${largestSector[0]}</span>
        </div>

    `;
}
