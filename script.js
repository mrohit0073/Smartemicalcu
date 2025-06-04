document.addEventListener('DOMContentLoaded', () => {
    // Main Inputs
    const loanAmountInput = document.getElementById('loanAmount');
    const interestRateInput = document.getElementById('interestRate');
    const loanTenureInput = document.getElementById('loanTenure');
    const calculateBtn = document.getElementById('calculateBtn');

    // Prepayment Type Radios
    const prepayNoneRadio = document.getElementById('prepayNone');
    const prepayOneTimeRadio = document.getElementById('prepayOneTime');
    const prepayRecurringRadio = document.getElementById('prepayRecurring');

    // Prepayment Detail Sections
    const oneTimeFields = document.getElementById('oneTimePrepaymentFields');
    const recurringFields = document.getElementById('recurringPrepaymentFields');

    // One-Time Prepayment Inputs
    const oneTimeAmountInput = document.getElementById('oneTimeAmount');
    const oneTimeMonthInput = document.getElementById('oneTimeMonth');

    // Recurring Prepayment Inputs
    const recurringAmountInput = document.getElementById('recurringAmount');
    const recurringFrequencySelect = document.getElementById('recurringFrequency');
    const recurringStartMonthInput = document.getElementById('recurringStartMonth');

    // Output Elements
    const errorDiv = document.getElementById('error');
    const summaryResultsDiv = document.getElementById('summaryResults');
    const monthlyEMIEl = document.getElementById('monthlyEMI');
    const originalTotalInterestEl = document.getElementById('originalTotalInterest');
    const originalTotalPaymentEl = document.getElementById('originalTotalPayment');

    const prepaymentSummaryDiv = document.getElementById('prepaymentSummary');
    const newTenureEl = document.getElementById('newTenure');
    const newTotalInterestEl = document.getElementById('newTotalInterest');
    const newTotalPaymentEl = document.getElementById('newTotalPayment');
    const interestSavedEl = document.getElementById('interestSaved');
    const moneySavedEl = document.getElementById('moneySaved'); // Actual money saved
    const totalPrepaymentsMadeEl = document.getElementById('totalPrepaymentsMade');


    const amortizationSectionDiv = document.getElementById('amortizationSection');
    const amortizationTableBody = document.getElementById('amortizationTableBody');
    const amortizationNoteEl = document.getElementById('amortizationNote');


    // Event Listeners for Prepayment Type Change
    [prepayNoneRadio, prepayOneTimeRadio, prepayRecurringRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            oneTimeFields.style.display = prepayOneTimeRadio.checked ? 'block' : 'none';
            recurringFields.style.display = prepayRecurringRadio.checked ? 'block' : 'none';
        });
    });

    calculateBtn.addEventListener('click', () => {
        clearOutput();
        if (!validateInputs()) return;

        const principal = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const tenureYears = parseFloat(loanTenureInput.value);
        const monthlyInterestRate = annualInterestRate / 12 / 100;
        const originalTenureMonths = tenureYears * 12;

        // Calculate original EMI (this remains constant for tenure reduction strategy)
        let originalEMI;
        if (monthlyInterestRate === 0) {
            originalEMI = originalTenureMonths > 0 ? principal / originalTenureMonths : 0;
        } else {
            const emiNumerator = principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, originalTenureMonths);
            const emiDenominator = Math.pow(1 + monthlyInterestRate, originalTenureMonths) - 1;
            if (emiDenominator === 0) {
                showError('Cannot calculate EMI (denominator is zero).');
                return;
            }
            originalEMI = emiNumerator / emiDenominator;
        }

        if (!isFinite(originalEMI) || originalEMI <=0) {
            showError('Calculated EMI is invalid. Please check inputs.');
            return;
        }

        const originalTotalPayment = originalEMI * originalTenureMonths;
        const originalTotalInterest = originalTotalPayment - principal;

        monthlyEMIEl.textContent = formatCurrency(originalEMI);
        originalTotalInterestEl.textContent = formatCurrency(originalTotalInterest);
        originalTotalPaymentEl.textContent = formatCurrency(originalTotalPayment);
        summaryResultsDiv.style.display = 'block';
        prepaymentSummaryDiv.style.display = 'none'; // Hide initially

        // Prepayment Details
        const prepayType = document.querySelector('input[name="prepaymentType"]:checked').value;
        let oneTimeAmount = 0, oneTimeMonth = 0;
        let recurringAmount = 0, recurringFrequency = 0, recurringStartAfterMonth = 0;
        let totalPrepaymentsSum = 0;

        if (prepayType === 'oneTime') {
            oneTimeAmount = parseFloat(oneTimeAmountInput.value) || 0;
            oneTimeMonth = parseInt(oneTimeMonthInput.value) || 0;
            if (oneTimeAmount <= 0 || oneTimeMonth <= 0) {
                showError('Invalid one-time prepayment amount or month.');
                return;
            }
        } else if (prepayType === 'recurring') {
            recurringAmount = parseFloat(recurringAmountInput.value) || 0;
            recurringFrequency = parseInt(recurringFrequencySelect.value) || 0;
            recurringStartAfterMonth = parseInt(recurringStartMonthInput.value) || 0;
            if (recurringAmount <= 0 || recurringFrequency <= 0 || recurringStartAfterMonth < 0) {
                showError('Invalid recurring prepayment amount, frequency, or start month.');
                return;
            }
        }

        // Generate Amortization (with or without prepayment)
        let balance = principal;
        let currentMonth = 0;
        let actualMonthsPaid = 0;
        let totalInterestPaidWithPrepayment = 0;
        let totalPrincipalPaidViaEMI = 0;
        amortizationTableBody.innerHTML = '';
        amortizationNoteEl.textContent = '';


        // Max iterations to prevent infinite loops with bad data or very small EMIs
        const maxMonthsToIterate = originalTenureMonths * 2 > 720 ? originalTenureMonths * 2 : 720; // Max 60 years or double original

        while (balance > 0.01 && actualMonthsPaid < maxMonthsToIterate) {
            actualMonthsPaid++;
            currentMonth++;

            let interestForMonth = (monthlyInterestRate === 0) ? 0 : balance * monthlyInterestRate;
            let principalPaidThisMonth = originalEMI - interestForMonth;
            let prepaymentThisMonth = 0;
            
            if (principalPaidThisMonth < 0) principalPaidThisMonth = 0; // EMI might be less than interest if balance is very low

            // If EMI itself is more than balance + interest for that balance (loan ending)
            if (balance + interestForMonth < originalEMI) {
                principalPaidThisMonth = balance;
                interestForMonth = (monthlyInterestRate === 0) ? 0 : balance * monthlyInterestRate; // re-calc interest on exact balance
                 // originalEMI for display will be the standard EMI, but actual paid is lower
            }
             if (balance < principalPaidThisMonth) { // Ensure we don't overpay principal from EMI
                principalPaidThisMonth = balance;
            }


            // Apply Prepayment
            if (prepayType === 'oneTime' && currentMonth === oneTimeMonth) {
                prepaymentThisMonth = Math.min(oneTimeAmount, balance - principalPaidThisMonth); // Cannot prepay more than balance
                totalPrepaymentsSum += prepaymentThisMonth;
            } else if (prepayType === 'recurring' && currentMonth > recurringStartAfterMonth && recurringAmount > 0) {
                if ((currentMonth - recurringStartAfterMonth) % recurringFrequency === 0) {
                    prepaymentThisMonth = Math.min(recurringAmount, balance - principalPaidThisMonth);
                    totalPrepaymentsSum += prepaymentThisMonth;
                }
            }
            
            // Adjust balance
            balance -= principalPaidThisMonth;
            balance -= prepaymentThisMonth; // Reduce balance by prepayment

            totalInterestPaidWithPrepayment += interestForMonth;
            totalPrincipalPaidViaEMI += principalPaidThisMonth;

             // Ensure balance doesn't go negative
            if (balance < 0) balance = 0;

            const row = amortizationTableBody.insertRow();
            row.insertCell().textContent = currentMonth;
            row.insertCell().textContent = formatCurrency(principalPaidThisMonth);
            row.insertCell().textContent = formatCurrency(interestForMonth);
            row.insertCell().textContent = formatCurrency(prepaymentThisMonth);
            row.insertCell().textContent = formatCurrency(principalPaidThisMonth + interestForMonth + prepaymentThisMonth);
            row.insertCell().textContent = formatCurrency(originalEMI); // Show the base EMI
            row.insertCell().textContent = formatCurrency(balance);

            if (balance <= 0.01) break; // Loan paid off
        }
         if (actualMonthsPaid >= maxMonthsToIterate && balance > 0.01) {
             amortizationNoteEl.textContent = "Loan calculation exceeded maximum iterations. Please check inputs or prepayments.";
         }


        amortizationSectionDiv.style.display = 'block';

        if (prepayType !== 'none' && totalPrepaymentsSum > 0) {
            const newTotalPaymentWithPrepayment = totalPrincipalPaidViaEMI + totalInterestPaidWithPrepayment + totalPrepaymentsSum;
            const interestSaved = originalTotalInterest - totalInterestPaidWithPrepayment;
            const actualMoneySaved = interestSaved; // In tenure reduction, this is direct interest saving

            newTenureEl.textContent = `${actualMonthsPaid} months (${(actualMonthsPaid / 12).toFixed(1)} years)`;
            newTotalInterestEl.textContent = formatCurrency(totalInterestPaidWithPrepayment);
            newTotalPaymentEl.textContent = formatCurrency(newTotalPaymentWithPrepayment); // Sum of all EMIs + all prepayments
            interestSavedEl.textContent = formatCurrency(interestSaved);
            moneySavedEl.textContent = formatCurrency(actualMoneySaved);
            totalPrepaymentsMadeEl.textContent = formatCurrency(totalPrepaymentsSum);

            prepaymentSummaryDiv.style.display = 'block';
        } else if (prepayType !== 'none' && totalPrepaymentsSum === 0 && (oneTimeAmountInput.value || recurringAmountInput.value)) {
             amortizationNoteEl.textContent = "Prepayment was specified but not applied (e.g., prepayment month not reached, or amount was zero).";
        }
    });

    function validateInputs() {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
        let isValid = true;
        const principal = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const tenureYears = parseFloat(loanTenureInput.value);

        if (isNaN(principal) || principal <= 0) {
            showError('Please enter a valid loan amount.'); isValid = false;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) { // Allow 0% interest
            showError('Please enter a valid annual interest rate.'); isValid = false;
        }
        if (isNaN(tenureYears) || tenureYears <= 0) {
            showError('Please enter a valid loan tenure in years.'); isValid = false;
        }
        return isValid;
    }

    function clearOutput() {
        errorDiv.style.display = 'none';
        summaryResultsDiv.style.display = 'none';
        prepaymentSummaryDiv.style.display = 'none';
        amortizationSectionDiv.style.display = 'none';
        amortizationTableBody.innerHTML = '';
        amortizationNoteEl.textContent = '';
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    function formatCurrency(amount) {
        // Ensure amount is a number, default to 0 if not.
        const numAmount = Number(amount);
        if (isNaN(numAmount)) {
            return `₹ 0.00`;
        }
        return `₹ ${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
});
