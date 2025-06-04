document.addEventListener('DOMContentLoaded', () => {
    const loanAmountInput = document.getElementById('loanAmount');
    const interestRateInput = document.getElementById('interestRate');
    const loanTenureInput = document.getElementById('loanTenure');
    const calculateBtn = document.getElementById('calculateBtn');

    const errorDiv = document.getElementById('error');
    const summaryResultsDiv = document.getElementById('summaryResults');
    const monthlyEMIEl = document.getElementById('monthlyEMI');
    const totalInterestEl = document.getElementById('totalInterest');
    const totalPaymentEl = document.getElementById('totalPayment');

    const amortizationSectionDiv = document.getElementById('amortizationSection');
    const amortizationTableBody = document.getElementById('amortizationTableBody');

    calculateBtn.addEventListener('click', () => {
        // Clear previous results and errors
        clearOutput();

        // Get and validate inputs
        const principal = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const tenureYears = parseFloat(loanTenureInput.value);

        let isValid = true;
        if (isNaN(principal) || principal <= 0) {
            showError('Please enter a valid loan amount.');
            isValid = false;
        }
        if (isNaN(annualInterestRate) || annualInterestRate <= 0) {
            showError('Please enter a valid annual interest rate.');
            isValid = false;
        }
        if (isNaN(tenureYears) || tenureYears <= 0) {
            showError('Please enter a valid loan tenure in years.');
            isValid = false;
        }
        if (!isValid) return;


        // Calculate EMI
        const monthlyInterestRate = annualInterestRate / 12 / 100;
        const tenureMonths = tenureYears * 12;

        if (monthlyInterestRate === 0) { // Edge case for 0% interest
             if (tenureMonths === 0) {
                showError('Tenure cannot be zero if interest is zero.');
                return;
            }
            const emi = principal / tenureMonths;
            displaySummary(emi, 0, principal);
            generateAmortizationSchedule(principal, emi, 0, tenureMonths);
            return;
        }

        // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
        const emiNumerator = principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenureMonths);
        const emiDenominator = Math.pow(1 + monthlyInterestRate, tenureMonths) - 1;

        if (emiDenominator === 0) {
            showError('Cannot calculate EMI with these inputs (denominator is zero). Ensure tenure is positive.');
            return;
        }
        const emi = emiNumerator / emiDenominator;

        if (!isFinite(emi)) {
             showError('Could not calculate EMI. Please check your inputs (e.g., very high loan amount or very low tenure/rate).');
             return;
        }

        const totalPayment = emi * tenureMonths;
        const totalInterest = totalPayment - principal;

        displaySummary(emi, totalInterest, totalPayment);
        generateAmortizationSchedule(principal, emi, monthlyInterestRate, tenureMonths);
    });

    function clearOutput() {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
        summaryResultsDiv.style.display = 'none';
        amortizationSectionDiv.style.display = 'none';
        amortizationTableBody.innerHTML = ''; // Clear previous table rows
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    function formatCurrency(amount) {
        return `₹ ${amount.toFixed(2)}`;
    }

    function displaySummary(emi, totalInterest, totalPayment) {
        monthlyEMIEl.textContent = formatCurrency(emi);
        totalInterestEl.textContent = formatCurrency(totalInterest);
        totalPaymentEl.textContent = formatCurrency(totalPayment);
        summaryResultsDiv.style.display = 'block';
    }

    function generateAmortizationSchedule(principal, emi, monthlyInterestRate, tenureMonths) {
        let balance = principal;
        amortizationTableBody.innerHTML = ''; // Clear previous entries

        if (tenureMonths > 360 * 2) { // Limit rows for performance, e.g., 60 years.
            const warningRow = amortizationTableBody.insertRow();
            const cell = warningRow.insertCell();
            cell.colSpan = 5;
            cell.style.textAlign = 'center';
            cell.textContent = `Amortization table too long to display fully (${tenureMonths} months). Showing first 720 entries if applicable.`;
             // You might want to actually truncate or paginate in a real app
        }


        for (let month = 1; month <= tenureMonths; month++) {
            if (balance <= 0.01) break; // Stop if balance is effectively zero

            const interestPaid = (monthlyInterestRate === 0) ? 0 : balance * monthlyInterestRate;
            let principalPaid = emi - interestPaid;
            
            // Adjust last payment to exactly match remaining balance
            if (balance < emi) {
                principalPaid = balance;
                emi = balance + interestPaid; // Recalculate EMI for the last payment
                if (emi < 0 ) emi = 0; // Ensure EMI is not negative
                if (principalPaid < 0) principalPaid = 0; // Ensure principal paid is not negative
            }
            
            balance -= principalPaid;

            // Ensure balance doesn't go negative due to floating point issues
            if (balance < 0) {
                principalPaid += balance; // Add back the overshoot to principal
                balance = 0;
            }


            const row = amortizationTableBody.insertRow();
            row.insertCell().textContent = month;
            row.insertCell().textContent = formatCurrency(principalPaid);
            row.insertCell().textContent = formatCurrency(interestPaid);
            row.insertCell().textContent = formatCurrency(emi);
            row.insertCell().textContent = formatCurrency(balance);

            // Safety break for extremely long tenures if not handled above
            if (month > 720 && tenureMonths > 720) { // e.g. if table too long warning was not specific enough
                 const lastRow = amortizationTableBody.insertRow();
                 const cell = lastRow.insertCell();
                 cell.colSpan = 5;
                 cell.style.textAlign = 'center';
                 cell.textContent = `... and ${tenureMonths - month} more months. Table truncated for brevity.`;
                 break;
            }
        }
        amortizationSectionDiv.style.display = 'block';
    }
});
