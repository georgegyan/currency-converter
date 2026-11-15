
// =========================================
// 1. GET HTML ELEMENTS
// =========================================

const converterForm = document.getElementById("converter-form");
const amountInput = document.getElementById("amount");
const fromCurrency = document.getElementById("from-currency");
const toCurrency = document.getElementById("to-currency");
const swapButton = document.getElementById("swap-button");
const convertButton = document.getElementById("convert-button");
const resultSection = document.getElementById("result-section");
const resultDisplay = document.getElementById("result");
const exchangeRateDisplay = document.getElementById("exchange-rate");
const lastUpdatedDisplay = document.getElementById("last-updated");
const errorMessage = document.getElementById("error-message");


// =========================================
// 2. API CONFIGURATION
// =========================================

const API_URL = "https://api.frankfurter.dev/v2";

let conversionTimer;
let activeRequest = null;


// =========================================
// 3. ERROR HANDLING
// =========================================

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    resultSection.hidden = true;
}

function clearError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
}


// =========================================
// 4. CURRENCY FORMATTING
// =========================================

function formatCurrency(amount, currency) {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
            maximumFractionDigits: 2
        }).format(amount);
    } catch {
        return `${amount.toFixed(2)} ${currency}`;
    }
}


// =========================================
// 5. LOAD SUPPORTED CURRENCIES
// =========================================

async function loadCurrencies() {

    try {
        const response = await fetch(`${API_URL}/currencies`);

        if (!response.ok) {
            throw new Error("Could not load currencies.");
        }

        const currencies = await response.json();

        // Preserve the currently selected currencies
        const selectedFrom = fromCurrency.value;
        const selectedTo = toCurrency.value;

        // Keep the original five as fallback options
        const fallbackCurrencies = [
            { code: "GHS", name: "Ghanaian Cedi" },
            { code: "USD", name: "US Dollar" },
            { code: "EUR", name: "Euro" },
            { code: "GBP", name: "British Pound" },
            { code: "NGN", name: "Nigerian Naira" }
        ];

        const currencyMap = new Map();

        fallbackCurrencies.forEach(currency => {
            currencyMap.set(currency.code, currency.name);
        });

        currencies.forEach(currency => {
            if (
                currency.code &&
                /^[A-Z]{3}$/.test(currency.code)
            ) {
                currencyMap.set(currency.code, currency.name);
            }
        });

        const sortedCurrencies = [...currencyMap.entries()]
            .map(([code, name]) => ({ code, name }))
            .sort((a, b) => a.code.localeCompare(b.code));

        // Update both dropdowns
        [fromCurrency, toCurrency].forEach(select => {

            select.innerHTML = "";

            sortedCurrencies.forEach(currency => {

                const option = document.createElement("option");

                option.value = currency.code;

                option.textContent =
                    `${currency.code} - ${currency.name}`;

                select.appendChild(option);
            });

        });

        // Restore selections
        fromCurrency.value = selectedFrom;
        toCurrency.value = selectedTo;

    } catch (error) {
        console.error("Currency loading error:", error);
        // Original HTML options remain available if loading fails.
    }
}


// =========================================
// 6. CONVERT CURRENCY
// =========================================

async function convertCurrency(event) {

    if (event) {
        event.preventDefault();
    }

    clearError();

    const amount = Number(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (!Number.isFinite(amount) || amount <= 0) {
        showError("Please enter an amount greater than zero.");
        return;
    }

    // Cancel any previous unfinished request
    if (activeRequest) {
        activeRequest.abort();
    }

    activeRequest = new AbortController();

    const currentRequest = activeRequest;

    convertButton.disabled = true;
    convertButton.textContent = "Converting...";
    convertButton.setAttribute("aria-busy", "true");

    try {

        let exchangeRate = 1;
        let rateDate = null;

        if (from !== to) {

            const response = await fetch(
                `${API_URL}/rate/${from}/${to}`,
                { signal: currentRequest.signal }
            );

            if (!response.ok) {
                throw new Error("Exchange rate is unavailable for this currency pair.");
            }

            const data = await response.json();

            exchangeRate = Number(data.rate);
            rateDate = data.date;

            if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
                throw new Error("Invalid exchange rate received.");
            }
        }

        // Calculate converted amount
        const convertedAmount = amount * exchangeRate;

        // Display result
        resultDisplay.textContent = formatCurrency(
            convertedAmount,
            to
        );

        exchangeRateDisplay.textContent =
            `1 ${from} = ${exchangeRate.toFixed(6)} ${to}`;

        lastUpdatedDisplay.textContent = rateDate
            ? `Rate date: ${rateDate}`
            : "Same currency — no conversion needed.";

        resultSection.hidden = false;

    } catch (error) {

        if (error.name === "AbortError") {
            return;
        }

        console.error("Conversion error:", error);

        showError(
            error.message || "Something went wrong. Please try again."
        );

    } finally {

        // Only the latest request can update the button
        if (activeRequest === currentRequest) {
            activeRequest = null;
            convertButton.disabled = false;
            convertButton.textContent = "Convert Currency";
            convertButton.removeAttribute("aria-busy");
        }
    }
}


// =========================================
// 7. AUTOMATIC CONVERSION
// =========================================

function scheduleConversion() {

    clearTimeout(conversionTimer);

    conversionTimer = setTimeout(() => {
        convertCurrency();
    }, 500);
}


// =========================================
// 8. SWAP CURRENCIES
// =========================================

function swapCurrencies() {

    const previousFrom = fromCurrency.value;

    fromCurrency.value = toCurrency.value;
    toCurrency.value = previousFrom;

    scheduleConversion();
}


// =========================================
// 9. EVENT LISTENERS
// =========================================

// Manual conversion
converterForm.addEventListener("submit", convertCurrency);

// Swap currencies
swapButton.addEventListener("click", swapCurrencies);

// Automatic conversion when amount changes
amountInput.addEventListener("input", scheduleConversion);

// Automatic conversion when currencies change
fromCurrency.addEventListener("change", scheduleConversion);
toCurrency.addEventListener("change", scheduleConversion);


// =========================================
// 10. INITIALIZE APPLICATION
// =========================================

async function initializeConverter() {

    await loadCurrencies();

    // Perform the first conversion
    convertCurrency();
}

initializeConverter();
