document.addEventListener('DOMContentLoaded', () => {
    // Main Inputs
    const loanAmountInput = document.getElementById('loanAmount');
    const interestRateInput = document.getElementById('interestRate');
    const loanTenureInput = document.getElementById('loanTenure');
    const calculateBtn = document.getElementById('calculateBtn');
    const errorDiv = document.getElementById('error');

    // Prepayment Goal Type Radios (Money / Interest / None)
    const prepayGoalNoneRadio = document.getElementById('prepayGoalNone');
    const prepayGoalMoneyRadio = document.getElementById('prepayGoalMoney');
    const prepayGoalInterestRadio = document.getElementById('prepayGoalInterest');

    // Prepayment Goal Type Sections
    const moneyPrepaymentOptionsDiv = document.getElementById('moneyPrepaymentOptions');
    const interestPrepaymentOptionsDiv = document.getElementById('interestPrepaymentOptions');

    // Money Prepayment Mode Radios (Lumpsum / Recurring)
    const prepayLumpsumRadio = document.getElementById('prepayLumpsum');
    const prepayRecurringRadio = document.getElementById('prepayRecurring');

    // Money Prepayment Mode Sections
    const lumpsumPrepaymentFields = document.getElementById('lumpsumPrepaymentFields');
    const recurringPrepaymentFields = document.getElementById('recurringPrepaymentFields');

    // Lumpsum Prepayment Inputs
    const lumpsumAmountInput = document.getElementById('lumpsumAmount');
    const lumpsumMonthInput = document.getElementById('lumpsumMonth');

    // Recurring Prepayment Inputs (Money)
    const recurringAmountInput = document.getElementById('recurringAmount');
    const recurringFrequencySelect = document.getElementById('recurringFrequency');
    const recurringStartMonthInput = document.getElementById('recurringStartMonth');
    const recurringEndMonthInput = document.getElementById('recurringEndMonth');

    // Interest Prepayment Inputs
    const interestPrepayAmountInput = document.getElementById('interestPrepayAmount');
    const interestPrepayStartMonthInput = document.getElementById('interestPrepayStartMonth');
    const interestPrepayEndMonthInput = document.getElementById('interestPrepayEndMonth');

    // Rate Change Elements
    const enableRateChangeCheckbox = document.getElementById('enableRateChange');
    const rateChangeFieldsDiv = document.getElementById('rateChangeFields');
    const newInterestRateInput = document.getElementById('newInterestRate');
    const rateChangeMonthInput = document.getElementById('rateChangeMonth');

    // Output Outcome Radios
    const outcomeReduceTenureRadio = document.getElementById('outcomeReduceTenure');
    const outcomeReduceEMIRadio = document.getElementById('outcomeReduceEMI');

    // Output Elements
    const summaryResultsDiv = document.getElementById('summaryResults');
    const monthlyEMIEl = document.getElementById('monthlyEMI');
    const originalTotalInterestEl = document.getElementById('originalTotalInterest');
    const originalTotalPaymentEl = document.getElementById('originalTotalPayment');

    const prepaymentSummaryDiv = document.getElementById('prepaymentSummary');
    const newTenureLabel = document.getElementById('newTenureLabel');
    const newTenureEl = document.getElementById('newTenure');
    const newEMILabel = document.getElementById('newEMILabel');
    const newEMIEl = document.getElementById('newEMI');
    const newTotalInterestEl = document.getElementById('newTotalInterest');
    const newTotalPaymentEl = document.getElementById('newTotalPayment');
    const interestSavedEl = document.getElementById('interestSaved');
    const moneySavedEl = document.getElementById('moneySaved');
    const totalPrepaymentsMadeEl = document.getElementById('totalPrepaymentsMade');

    const amortizationSectionDiv = document.getElementById('amortizationSection');
    const amortizationTableBody = document.getElementById('amortizationTableBody');
    const amortizationNoteEl = document.getElementById('amortizationNote');

    // --- Event Listeners for UI toggles ---

    // Prepayment Goal Type (Money/Interest/None)
    [prepayGoalNoneRadio, prepayGoalMoneyRadio, prepayGoalInterestRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            moneyPrepaymentOptionsDiv.style.display = prepayGoalMoneyRadio.checked ? 'block' : 'none';
            interestPrepaymentOptionsDiv.style.display = prepayGoalInterestRadio.checked ? 'block' : 'none';
            // Also hide money mode fields if money type is not selected
            if (!prepayGoalMoneyRadio.checked) {
                lumpsumPrepaymentFields.style.display = 'none';
                recurringPrepaymentFields.style.display = 'none';
            } else { // If money is selected, ensure default lumpsum or recurring is shown
                if (prepayLumpsumRadio.checked) {
                    lumpsumPrepaymentFields.style.display = 'block';
                    recurringPrepaymentFields.style.display = 'none';
                } else if (prepayRecurringRadio.checked) {
                    lumpsumPrepaymentFields.style.display = 'none';
                    recurringPrepaymentFields.style.display = 'block';
                }
            }
        });
    });

    // Money Prepayment Mode (Lumpsum/Recurring)
    [prepayLumpsumRadio, prepayRecurringRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            lumpsumPrepaymentFields.style.display = prepayLumpsumRadio.checked ? 'block' : 'none';
            recurringPrepaymentFields.style.display = prepayRecurringRadio.checked ? 'block' : 'none';
        });
    });

    // Enable Interest Rate Change Checkbox
    enableRateChangeCheckbox.addEventListener('change', () => {
        rateChangeFieldsDiv.style.display = enableRateChangeCheckbox.checked ? 'block' : 'none';
    });

    // --- Main Calculation Logic ---

    calculateBtn.addEventListener('click', () => {
        clearOutput();
        if (!validateInputs()) return;

        const principal = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const tenureYears = parseFloat(loanTenureInput.value);
        const originalMonthlyInterestRate = annualInterestRate / 12 / 100;
        const originalTenureMonths = tenureYears * 12;

        let originalEMI;
        if (originalMonthlyInterestRate === 0) {
            originalEMI = originalTenureMonths > 0 ? principal / originalTenureMonths : 0;
        } else {
            const emiNumerator = principal * originalMonthlyInterestRate * Math.pow(1 + originalMonthlyInterestRate, originalTenureMonths);
            const emiDenominator = Math.pow(1 + originalMonthlyInterestRate, originalTenureMonths) - 1;
            if (emiDenominator === 0) {
                showError('Cannot calculate EMI (denominator is zero). Please check inputs.');
                return;
            }
            originalEMI = emiNumerator / emiDenominator;
        }

        if (!isFinite(originalEMI) || originalEMI <= 0) {
            showError('Calculated original EMI is invalid. Please check inputs.');
            return;
        }

        const originalTotalPayment = originalEMI * originalTenureMonths;
        const originalTotalInterest = originalTotalPayment - principal;

        monthlyEMIEl.textContent = formatCurrency(originalEMI);
        originalTotalInterestEl.textContent = formatCurrency(originalTotalInterest);
        originalTotalPaymentEl.textContent = formatCurrency(originalTotalPayment);
        summaryResultsDiv.style.display = 'block';
        prepaymentSummaryDiv.style.display = 'none'; // Hide initially

        // --- Prepayment and Rate Change Details ---
        const prepayGoalType = document.querySelector('input[name="prepayGoalType"]:checked').value;
        const moneyPrepaymentMode = document.querySelector('input[name="moneyPrepaymentMode"]:checked')?.value || 'none'; // Will be 'none' if prepayGoalMoney is not checked

        // Lumpsum details
        const lumpsumAmount = (prepayGoalType === 'money' && moneyPrepaymentMode === 'lumpsum') ? parseFloat(lumpsumAmountInput.value) || 0 : 0;
        const lumpsumMonth = (prepayGoalType === 'money' && moneyPrepaymentMode === 'lumpsum') ? parseInt(lumpsumMonthInput.value) || 0 : 0;

        // Recurring (Money) details
        const recurringAmount = (prepayGoalType === 'money' && moneyPrepaymentMode === 'recurring') ? parseFloat(recurringAmountInput.value) || 0 : 0;
        const recurringFrequency = (prepayGoalType === 'money' && moneyPrepaymentMode === 'recurring') ? parseInt(recurringFrequencySelect.value) || 0 : 0;
        const recurringStartMonth = (prepayGoalType === 'money' && moneyPrepaymentMode === 'recurring') ? parseInt(recurringStartMonthInput.value) || 0 : 0;
        let recurringEndMonth = (prepayGoalType === 'money' && moneyPrepaymentMode === 'recurring') ? parseInt(recurringEndMonthInput.value) || originalTenureMonths * 2 : originalTenureMonths * 2; // Default to max loan tenure if empty

        // Interest Prepayment details
        const interestPrepayAmount = (prepayGoalType === 'interest') ? parseFloat(interestPrepayAmountInput.value) || 0 : 0;
        const interestPrepayStartMonth = (prepayGoalType === 'interest') ? parseInt(interestPrepayStartMonthInput.value) || 0 : 0;
        let interestPrepayEndMonth = (prepayGoalType === 'interest') ? parseInt(interestPrepayEndMonthInput.value) || originalTenureMonths * 2 : originalTenureMonths * 2; // Default to max loan tenure

        // Rate Change details
        const enableRateChange = enableRateChangeCheckbox.checked;
        const newAnnualInterestRate = enableRateChange ? parseFloat(newInterestRateInput.value) : 0;
        const rateChangeEffectiveMonth = enableRateChange ? parseInt(rateChangeMonthInput.value) || 0 : 0;
        const newMonthlyInterestRate = newAnnualInterestRate / 12 / 100;

        // Output Outcome Type
        const outcomeReduceTenure = outcomeReduceTenureRadio.checked;

        // --- Amortization Calculation ---
        let balance = principal;
        let currentMonth = 0;
        let actualMonthsPaid = 0;
        let totalInterestPaidWithAdjustments = 0;
        let totalPrincipalPaidViaEMI = 0;
        let totalPrepaymentsSum = 0;
        let currentEMI = originalEMI; // This will change if 'reduceEMI' is chosen

        amortizationTableBody.innerHTML = '';
        amortizationNoteEl.textContent = '';

        // Max iterations to prevent infinite loops (60 years or double original tenure, whichever is higher)
        const maxMonthsToIterate = Math.max(originalTenureMonths * 2, 720);

        let lastInterestRateChangeMonth = 0; // To track when the last rate or EMI change occurred
        let lastPrepaymentEventMonth = 0; // To track when last lump/recurring occurred

        while (balance > 0.01 && actualMonthsPaid < maxMonthsToIterate) {
            actualMonthsPaid++;
            currentMonth++;

            let currentMonthlyInterestRate = originalMonthlyInterestRate;

            // Apply Interest Rate Change
            if (enableRateChange && currentMonth >= rateChangeEffectiveMonth && currentMonth > lastInterestRateChangeMonth) {
                currentMonthlyInterestRate = newMonthlyInterestRate;
                // If reducing EMI, recalculate EMI after rate change
                if (!outcomeReduceTenure && originalTenureMonths - (currentMonth - 1) > 0) { // Recalc if original tenure still has months left
                    currentEMI = calculateEMI(balance, currentMonthlyInterestRate, originalTenureMonths - (currentMonth - 1));
                    lastInterestRateChangeMonth = currentMonth;
                }
            } else if (currentMonth < rateChangeEffectiveMonth || !enableRateChange) {
                currentMonthlyInterestRate = originalMonthlyInterestRate;
            } else { // Rate change already happened
                currentMonthlyInterestRate = newMonthlyInterestRate;
            }


            let interestForMonth = (currentMonthlyInterestRate === 0) ? 0 : balance * currentMonthlyInterestRate;
            let principalPaidThisMonth = Math.max(0, currentEMI - interestForMonth); // Ensure principal paid isn't negative

            let prepaymentThisMonth = 0;

            // Apply Lumpsum Prepayment (Money)
            if (prepayGoalType === 'money' && moneyPrepaymentMode === 'lumpsum' && currentMonth === lumpsumMonth && lumpsumAmount > 0) {
                prepaymentThisMonth += Math.min(lumpsumAmount, balance - principalPaidThisMonth);
            }

            // Apply Recurring Prepayment (Money)
            if (prepayGoalType === 'money' && moneyPrepaymentMode === 'recurring' && recurringAmount > 0) {
                if (currentMonth > recurringStartMonth && currentMonth <= recurringEndMonth) {
                    if ((currentMonth - recurringStartMonth) % recurringFrequency === 0) {
                        prepaymentThisMonth += Math.min(recurringAmount, balance - principalPaidThisMonth - prepaymentThisMonth); // Subtract any lumpsum
                    }
                }
            }

            // Apply Interest Prepayment (Recurring)
            if (prepayGoalType === 'interest' && interestPrepayAmount > 0) {
                if (currentMonth > interestPrepayStartMonth && currentMonth <= interestPrepayEndMonth) {
                    prepaymentThisMonth += Math.min(interestPrepayAmount, balance - principalPaidThisMonth - prepaymentThisMonth);
                }
            }
            
            // Adjust principal paid if loan is ending
            if (balance + interestForMonth < currentEMI + prepaymentThisMonth) {
                principalPaidThisMonth = balance - prepaymentThisMonth; // Adjust principal to clear balance after prepay
                if (principalPaidThisMonth < 0) principalPaidThisMonth = 0;
            }
            if (balance < principalPaidThisMonth + prepaymentThisMonth) {
                principalPaidThisMonth = balance - prepaymentThisMonth;
                if (principalPaidThisMonth < 0) principalPaidThisMonth = 0;
            }

            totalPrepaymentsSum += prepaymentThisMonth;


            // Recalculate EMI for "Reduce EMI" option AFTER prepayments/rate changes apply to balance
            if (!outcomeReduceTenure) { // If 'Reduce EMI' is selected
                let reCalcEMI = false;
                // Recalculate if a prepayment was made AND it's not the loan's very last month
                if (prepaymentThisMonth > 0 && currentMonth > lastPrepaymentEventMonth) {
                     reCalcEMI = true;
                     lastPrepaymentEventMonth = currentMonth;
                }
                // Recalculate EMI if interest rate changed in this month and we haven't already
                if (enableRateChange && currentMonth === rateChangeEffectiveMonth && currentMonth > lastInterestRateChangeMonth) {
                    reCalcEMI = true;
                    lastInterestRateChangeMonth = currentMonth;
                }
                 // If the loan is effectively paid off with remaining balance + principal + prepay
                if (balance - principalPaidThisMonth - prepaymentThisMonth <= 0.01 && balance > 0.01) {
                     reCalcEMI = true; // Final adjustment needed
                }

                if (reCalcEMI) {
                     const monthsRemainingForEMI = originalTenureMonths - currentMonth;
                     if (monthsRemainingForEMI > 0) {
                         currentEMI = calculateEMI(balance - principalPaidThisMonth - prepaymentThisMonth, currentMonthlyInterestRate, monthsRemainingForEMI);
                     } else {
                         currentEMI = 0; // Loan fully paid or tenure reached
                     }
                     if (!isFinite(currentEMI) || currentEMI < 0) currentEMI = 0; // Handle edge cases
                }
            }

            // Update balance
            balance -= principalPaidThisMonth;
            balance -= prepaymentThisMonth;

            totalInterestPaidWithAdjustments += interestForMonth;
            totalPrincipalPaidViaEMI += principalPaidThisMonth;


            if (balance < 0.01) { // Final adjustments for the last month to ensure balance is 0
                const finalPrincipalAdjust = principalPaidThisMonth + balance;
                if (finalPrincipalAdjust > 0) principalPaidThisMonth = finalPrincipalAdjust;
                balance = 0;
            }

            const row = amortizationTableBody.insertRow();
            row.insertCell().textContent = currentMonth;
            row.insertCell().textContent = formatCurrency(principalPaidThisMonth);
            row.insertCell().textContent = formatCurrency(interestForMonth);
            row.insertCell().textContent = formatCurrency(prepaymentThisMonth);
            row.insertCell().textContent = formatCurrency(principalPaidThisMonth + interestForMonth + prepaymentThisMonth);
            row.insertCell().textContent = formatCurrency(currentEMI); // Show the current EMI
            row.insertCell().textContent = formatCurrency(balance);

            if (balance <= 0.01) break; // Loan paid off
        }

        if (actualMonthsPaid >= maxMonthsToIterate && balance > 0.01) {
            amortizationNoteEl.textContent = "Loan calculation exceeded maximum iterations. Please check inputs or prepayments. Loan might not be fully paid off.";
        }

        amortizationSectionDiv.style.display = 'block';

        // --- Display Adjusted Summary ---
        let totalAdjustedPayment = totalPrincipalPaidViaEMI + totalInterestPaidWithAdjustments + totalPrepaymentsSum;
        const interestSaved = originalTotalInterest - totalInterestPaidWithAdjustments;
        const actualMoneySaved = interestSaved - totalPrepaymentsSum; // Net savings after accounting for money paid extra

        prepaymentSummaryDiv.style.display = 'block';

        // Update labels and values based on outcome selection
        if (outcomeReduceTenure) {
            newTenureLabel.textContent = 'New Loan Tenure:';
            newTenureEl.textContent = `${actualMonthsPaid} months (${(actualMonthsPaid / 12).toFixed(1)} years)`;
            newEMILabel.textContent = 'Monthly EMI (remains original):';
            newEMIEl.textContent = formatCurrency(originalEMI);
        } else { // Reduce EMI
            newTenureLabel.textContent = 'Original Loan Tenure:';
            newTenureEl.textContent = `${originalTenureMonths} months (${tenureYears} years)`;
            newEMILabel.textContent = 'Final Monthly EMI (if applicable):';
            newEMIEl.textContent = formatCurrency(currentEMI); // Show the last calculated EMI
        }

        newTotalInterestEl.textContent = formatCurrency(totalInterestPaidWithAdjustments);
        newTotalPaymentEl.textContent = formatCurrency(totalAdjustedPayment);
        interestSavedEl.textContent = formatCurrency(interestSaved);
        moneySavedEl.textContent = formatCurrency(actualMoneySaved);
        totalPrepaymentsMadeEl.textContent = formatCurrency(totalPrepaymentsSum);

        if (prepayGoalType !== 'none' && totalPrepaymentsSum === 0 && (lumpsumAmountInput.value || recurringAmountInput.value || interestPrepayAmountInput.value)) {
            amortizationNoteEl.textContent += " Prepayment was specified but might not have been applied (e.g., month not reached, amount zero, or frequency mismatch).";
        }
    });

    // --- Helper Functions ---

    function calculateEMI(principal, monthlyInterestRate, tenureMonths) {
        if (monthlyInterestRate === 0) {
            return tenureMonths > 0 ? principal / tenureMonths : 0;
        }
        const numerator = principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenureMonths);
        const denominator = Math.pow(1 + monthlyInterestRate, tenureMonths) - 1;
        return denominator === 0 ? 0 : numerator / denominator;
    }


    function validateInputs() {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
        let isValid = true;
        const principal = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const tenureYears = parseFloat(loanTenureInput.value);

        if (isNaN(principal) || principal <= 0) {
            showError('Please enter a valid Loan Amount (greater than 0).'); isValid = false;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            showError('Please enter a valid Annual Interest Rate (0 or greater).'); isValid = false;
        }
        if (isNaN(tenureYears) || tenureYears <= 0) {
            showError('Please enter a valid Loan Tenure in Years (greater than 0).'); isValid = false;
        }

        const maxMonths = 720; // 60 years max
        if (tenureYears * 12 > maxMonths) {
             showError(`Loan tenure cannot exceed ${maxMonths/12} years.`); isValid = false;
        }


        const prepayGoalType = document.querySelector('input[name="prepayGoalType"]:checked').value;
        const moneyPrepaymentMode = document.querySelector('input[name="moneyPrepaymentMode"]:checked')?.value || 'none';

        if (prepayGoalType === 'money') {
            if (moneyPrepaymentMode === 'lumpsum') {
                const lumpsumAmount = parseFloat(lumpsumAmountInput.value);
                const lumpsumMonth = parseInt(lumpsumMonthInput.value);
                if (isNaN(lumpsumAmount) || lumpsumAmount <= 0) {
                    showError('Please enter a valid Lumpsum Prepayment Amount (greater than 0).'); isValid = false;
                }
                if (isNaN(lumpsumMonth) || lumpsumMonth <= 0 || lumpsumMonth > tenureYears * 12) {
                    showError(`Lumpsum Prepayment Month must be between 1 and ${tenureYears * 12}.`); isValid = false;
                }
            } else if (moneyPrepaymentMode === 'recurring') {
                const recurringAmount = parseFloat(recurringAmountInput.value);
                const recurringFrequency = parseInt(recurringFrequencySelect.value);
                const recurringStartMonth = parseInt(recurringStartMonthInput.value);
                const recurringEndMonth = parseInt(recurringEndMonthInput.value);

                if (isNaN(recurringAmount) || recurringAmount <= 0) {
                    showError('Please enter a valid Recurring Prepayment Amount (greater than 0).'); isValid = false;
                }
                if (isNaN(recurringFrequency) || recurringFrequency <= 0) {
                    showError('Please select a valid Recurring Frequency.'); isValid = false;
                }
                if (isNaN(recurringStartMonth) || recurringStartMonth < 0 || recurringStartMonth > tenureYears * 12) {
                    showError(`Recurring Prepayment Start Month must be between 0 and ${tenureYears * 12}.`); isValid = false;
                }
                if (!isNaN(recurringEndMonth) && (recurringEndMonth <= recurringStartMonth || recurringEndMonth > maxMonths)) {
                    showError(`Recurring Prepayment End Month must be after Start Month and not exceed ${maxMonths} months.`); isValid = false;
                }
            }
        } else if (prepayGoalType === 'interest') {
             const interestPrepayAmount = parseFloat(interestPrepayAmountInput.value);
             const interestPrepayStartMonth = parseInt(interestPrepayStartMonthInput.value);
             const interestPrepayEndMonth = parseInt(interestPrepayEndMonthInput.value);

            if (isNaN(interestPrepayAmount) || interestPrepayAmount <= 0) {
                showError('Please enter a valid Additional Amount for Interest Reduction (greater than 0).'); isValid = false;
            }
            if (isNaN(interestPrepayStartMonth) || interestPrepayStartMonth < 0 || interestPrepayStartMonth > tenureYears * 12) {
                showError(`Interest Prepayment Start Month must be between 0 and ${tenureYears * 12}.`); isValid = false;
            }
            if (!isNaN(interestPrepayEndMonth) && (interestPrepayEndMonth <= interestPrepayStartMonth || interestPrepayEndMonth > maxMonths)) {
                showError(`Interest Prepayment End Month must be after Start Month and not exceed ${maxMonths} months.`); isValid = false;
            }
        }

        const enableRateChange = enableRateChangeCheckbox.checked;
        if (enableRateChange) {
            const newInterestRate = parseFloat(newInterestRateInput.value);
            const rateChangeMonth = parseInt(rateChangeMonthInput.value);
            if (isNaN(newInterestRate) || newInterestRate < 0) {
                showError('Please enter a valid New Annual Interest Rate (0 or greater).'); isValid = false;
            }
            if (isNaN(rateChangeMonth) || rateChangeMonth <= 0 || rateChangeMonth > tenureYears * 12) {
                showError(`Interest Rate Change Month must be between 1 and ${tenureYears * 12}.`); isValid = false;
            }
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
        const numAmount = Number(amount);
        if (isNaN(numAmount)) {
            return `₹ 0.00`;
        }
        return `₹ ${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Initial display states
    prepayGoalNoneRadio.dispatchEvent(new Event('change')); // Initialize UI
    prepayLumpsumRadio.dispatchEvent(new Event('change')); // Initialize money mode UI
});
