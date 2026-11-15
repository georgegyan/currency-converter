
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


// =========================================
// 3. DISPLAY ERROR MESSAGE
// =========================================

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    resultSection.hidden = true;
}


// =========================================
// 4. CLEAR ERROR MESSAGE
// =========================================

function clearError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
}


// =========================================
// 5. FORMAT CURRENCY
// =========================================

function formatCurrency(amount, currency) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 2
    }).format(amount);
}


// =========================================
// 6. CONVERT CURRENCY
// =========================================

async function convertCurrency(event) {

    event.preventDefault();

    clearError();

    const amount = Number(amountInput.value);

    const from = fromCurrency.value;

    const to = toCurrency.value;

    // Validate amount
    if (!Number.isFinite(amount) || amount <= 0) {
        showError("Please enter a valid amount greater than zero.");
        return;
    }

    // Loading state
    convertButton.disabled = true;
    convertButton.textContent = "Converting...";

    try {

        let exchangeRate = 1;
        let rateDate = null;

        // No API request is needed for identical currencies
        if (from !== to) {

            const response = await fetch(
                `${API_URL}/rate/${from}/${to}`
            );

            if (!response.ok) {
                throw new Error("Unable to retrieve exchange rates.");
            }

            const data = await response.json();

            exchangeRate = data.rate;
            rateDate = data.date;

            if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
                throw new Error("Invalid exchange rate received.");
            }
        }

        // Calculate conversion
        const convertedAmount = amount * exchangeRate;

        // Display conversion result
        resultDisplay.textContent = formatCurrency(
            convertedAmount,
            to
        );

        // Display exchange rate
        exchangeRateDisplay.textContent =
            `1 ${from} = ${exchangeRate.toFixed(6)} ${to}`;

        // Display last updated date
        lastUpdatedDisplay.textContent = rateDate
            ? `Rate date: ${rateDate}`
            : "Same currency — no conversion needed.";

        resultSection.hidden = false;

    } catch (error) {

        console.error("Currency conversion error:", error);

        showError(
            "Unable to convert currencies. Please check your internet connection and try again."
        );

    } finally {

        // Restore button
        convertButton.disabled = false;
        convertButton.textContent = "Convert Currency";

    }
}


// =========================================
// 7. SWAP CURRENCIES
// =========================================

function swapCurrencies() {

    const previousFrom = fromCurrency.value;

    fromCurrency.value = toCurrency.value;

    toCurrency.value = previousFrom;

    // Clear previous results after swapping
    resultSection.hidden = true;

    clearError();
}


// =========================================
// 8. EVENT LISTENERS
// =========================================

// Listen for form submission
converterForm.addEventListener("submit", convertCurrency);

// Listen for currency swap
swapButton.addEventListener("click", swapCurrencies);
