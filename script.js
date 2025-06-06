document.addEventListener('DOMContentLoaded', () => {
    // --- Main Inputs ---
    const loanAmountInput = document.getElementById('loanAmount');
    const interestRateInput = document.getElementById('interestRate');
    const loanTenureInput = document.getElementById('loanTenure');
    const loanStartMonthInput = document.getElementById('loanStartMonth'); // New: Loan Start Month
    const calculateBtn = document.getElementById('calculateBtn');
    const errorDiv = document.getElementById('error');

    // --- Prepayment Goal Type Radios ---
    const prepayGoalNoneRadio = document.getElementById('prepayGoalNone');
    const prepayGoalMoneyRadio = document.getElementById('prepayGoalMoney');
    const moneyPrepaymentOptionsDiv = document.getElementById('moneyPrepaymentOptions');

    // --- Money Prepayment Mode Radios ---
    const prepayLumpsumRadio = document.getElementById('prepayLumpsum');
    const prepayRecurringRadio = document.getElementById('prepayRecurring');
    const lumpsumSectionDiv = document.getElementById('lumpsumSection');
    const recurringSectionDiv = document.getElementById('recurringSection');

    // --- Dynamic Prepayment/Rate Change Containers and Buttons ---
    const lumpsumPrepaymentContainer = document.getElementById('lumpsumPrepaymentContainer');
    const addLumpsumBtn = document.getElementById('addLumpsumBtn');
    const recurringPrepaymentContainer = document.getElementById('recurringPrepaymentContainer');
    const addRecurringBtn = document.getElementById('addRecurringBtn');
    const rateChangeContainer = document.getElementById('rateChangeContainer');
    const addRateChangeBtn = document.getElementById('addRateChangeBtn');

    // --- Output Outcome Radios ---
    const outcomeReduceTenureRadio = document.getElementById('outcomeReduceTenure');
    const outcomeReduceEMIRadio = document.getElementById('outcomeReduceEMI');

    // --- Output Elements ---
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
    const configuredAdjustmentsSummaryDiv = document.getElementById('configuredAdjustmentsSummary');
    const lumpsumSummaryList = document.getElementById('lumpsumSummaryList');
    const recurringSummaryList = document.getElementById('recurringSummaryList');
    const rateChangeSummaryList = document.getElementById('rateChangeSummaryList');

    // --- Global Counters for Dynamic IDs ---
    let lumpsumIdCounter = 1;
    let recurringIdCounter = 1;
    let rateChangeIdCounter = 1;

    // --- Helper Functions for Date Conversion ---
    function getMonthDiff(d1, d2) {
        // d1, d2 are Date objects
        let months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        return months;
    }

    function dateToLoanMonth(inputDateStr, loanStartMonthStr) {
        if (!inputDateStr || !loanStartMonthStr) return null;
        const inputDate = new Date(inputDateStr + '-01'); // Append -01 to make it a valid date for parsing
        const loanStartDate = new Date(loanStartMonthStr + '-01');

        if (isNaN(inputDate.getTime()) || isNaN(loanStartDate.getTime())) return null;

        const diffMonths = getMonthDiff(loanStartDate, inputDate);
        return diffMonths + 1; // Month 1 is the loan start month itself
    }

    function loanMonthToDate(loanStartMonthStr, loanMonthNum) {
        if (!loanStartMonthStr || loanMonthNum === null) return null;
        const loanStartDate = new Date(loanStartMonthStr + '-01');
        if (isNaN(loanStartDate.getTime())) return null;

        const targetDate = new Date(loanStartDate);
        targetDate.setMonth(loanStartDate.getMonth() + loanMonthNum - 1); // Subtract 1 because loanMonthNum is 1-indexed

        return targetDate.toISOString().slice(0, 7); // Returns YYYY-MM
    }

    // --- Dynamic Input Row Management ---

    function createInputRow(type, id) {
        const div = document.createElement('div');
        div.classList.add(`${type}-input-row`);
        div.dataset.id = id;
        div.innerHTML = `
            ${type === 'lumpsum' ? `
                <div class="input-group">
                    <label for="lumpsumAmount_${id}">Amount (₹):</label>
                    <input type="number" id="lumpsumAmount_${id}" class="lumpsum-amount" placeholder="e.g., 50000">
                </div>
                <div class="input-group">
                    <label for="lumpsumMonth_${id}">Month:</label>
                    <input type="month" id="lumpsumMonth_${id}" class="lumpsum-month">
                </div>
            ` : type === 'recurring' ? `
                <div class="input-group">
                    <label for="recurringAmount_${id}">Amount (₹):</label>
                    <input type="number" id="recurringAmount_${id}" class="recurring-amount" placeholder="e.g., 2000">
                </div>
                <div class="input-group">
                    <label for="recurringFrequency_${id}">Frequency:</label>
                    <select id="recurringFrequency_${id}" class="recurring-frequency">
                        <option value="12">Annually (every 12 months)</option>
                        <option value="6">Semi-Annually (every 6 months)</option>
                        <option value="3">Quarterly (every 3 months)</option>
                        <option value="1">Monthly (every month)</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="recurringStartMonth_${id}">Start Month:</label>
                    <input type="month" id="recurringStartMonth_${id}" class="recurring-start-month">
                </div>
                 <div class="input-group">
                    <label for="recurringEndMonth_${id}">End Month:</label>
                    <input type="month" id="recurringEndMonth_${id}" class="recurring-end-month">
                    <small>Leave empty to continue until loan ends.</small>
                </div>
            ` : ` <div class="input-group">
                    <label for="newInterestRate_${id}">New Annual Interest Rate (%):</label>
                    <input type="number" id="newInterestRate_${id}" class="new-interest-rate" placeholder="e.g., 9.0">
                </div>
                <div class="input-group">
                    <label for="rateChangeStartMonth_${id}">Start Month:</label>
                    <input type="month" id="rateChangeStartMonth_${id}" class="rate-change-start-month">
                </div>
                <div class="input-group">
                    <label for="rateChangeEndMonth_${id}">End Month:</label>
                    <input type="month" id="rateChangeEndMonth_${id}" class="rate-change-end-month">
                    <small>Leave empty to continue until loan ends. Rate reverts to original after this month.</small>
                </div>
            `}
            <button type="button" class="remove-btn">Remove</button>
        `;
        return div;
    }

    function addRow(container, type, counter) {
        const newRow = createInputRow(type, counter);
        container.appendChild(newRow);
        newRow.querySelector('.remove-btn').addEventListener('click', () => {
            newRow.remove();
            // Show remove button for remaining rows if more than one
            updateRemoveButtonVisibility(container);
        });
        // Show remove button for all existing rows
        updateRemoveButtonVisibility(container);
    }

    function updateRemoveButtonVisibility(container) {
        const rows = container.children;
        if (rows.length === 1) {
            rows[0].querySelector('.remove-btn').style.display = 'none';
        } else {
            Array.from(rows).forEach(row => {
                row.querySelector('.remove-btn').style.display = 'block';
            });
        }
    }


    // --- Event Listeners for UI toggles and dynamic row additions ---

    // Prepayment Goal Type (Money/None)
    [prepayGoalNoneRadio, prepayGoalMoneyRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            moneyPrepaymentOptionsDiv.style.display = prepayGoalMoneyRadio.checked ? 'block' : 'none';
            if (!prepayGoalMoneyRadio.checked) {
                lumpsumSectionDiv.style.display = 'none';
                recurringSectionDiv.style.display = 'none';
            } else { // If money is selected, ensure default lumpsum or recurring is shown
                if (prepayLumpsumRadio.checked) {
                    lumpsumSectionDiv.style.display = 'block';
                    recurringSectionDiv.style.display = 'none';
                } else if (prepayRecurringRadio.checked) {
                    lumpsumSectionDiv.style.display = 'none';
                    recurringSectionDiv.style.display = 'block';
                }
            }
        });
    });

    // Money Prepayment Mode (Lumpsum/Recurring)
    [prepayLumpsumRadio, prepayRecurringRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            lumpsumSectionDiv.style.display = prepayLumpsumRadio.checked ? 'block' : 'none';
            recurringSectionDiv.style.display = prepayRecurringRadio.checked ? 'block' : 'none';
        });
    });

    // Add row buttons
    addLumpsumBtn.addEventListener('click', () => addRow(lumpsumPrepaymentContainer, 'lumpsum', ++lumpsumIdCounter));
    addRecurringBtn.addEventListener('click', () => addRow(recurringPrepaymentContainer, 'recurring', ++recurringIdCounter));
    addRateChangeBtn.addEventListener('click', () => addRow(rateChangeContainer, 'rate-change', ++rateChangeIdCounter));


    // --- Main Calculation Logic ---

    calculateBtn.addEventListener('click', () => {
        console.log("Calculate button clicked!"); // Debugging log
        clearOutput();

        if (!validateInputs()) {
            console.log("Validation failed. Aborting calculation."); // Debugging log
            return;
        }
        console.log("Validation passed. Proceeding with calculation."); // Debugging log

        const principal = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const tenureYears = parseFloat(loanTenureInput.value);
        const loanStartMonthStr = loanStartMonthInput.value;

        const originalMonthlyInterestRate = annualInterestRate / 12 / 100;
        const originalTenureMonths = tenureYears * 12;

        let originalEMI;
        if (originalMonthlyInterestRate === 0) {
            originalEMI = originalTenureMonths > 0 ? principal / originalTenureMonths : 0;
        } else {
            const emiNumerator = principal * originalMonthlyInterestRate * Math.pow(1 + originalMonthlyInterestRate, originalTenureMonths);
            const emiDenominator = Math.pow(1 + originalMonthlyInterestRate, originalTenureMonths) - 1;
            if (emiDenominator === 0) {
                showError('Cannot calculate EMI (denominator is zero). Please check inputs or loan tenure.');
                return;
            }
            originalEMI = emiNumerator / emiDenominator;
        }

        if (!isFinite(originalEMI) || originalEMI <= 0) {
            showError('Calculated original EMI is invalid. Please check Loan Amount, Interest Rate, and Loan Tenure.');
            return;
        }

        const originalTotalPayment = originalEMI * originalTenureMonths;
        const originalTotalInterest = originalTotalPayment - principal;

        monthlyEMIEl.textContent = formatCurrency(originalEMI);
        originalTotalInterestEl.textContent = formatCurrency(originalTotalInterest);
        originalTotalPaymentEl.textContent = formatCurrency(originalTotalPayment);
        summaryResultsDiv.style.display = 'block';
        prepaymentSummaryDiv.style.display = 'none'; // Hide initially

        // --- Collect All Prepayment & Rate Change Events ---
        const prepayGoalType = document.querySelector('input[name="prepayGoalType"]:checked').value;
        const moneyPrepaymentMode = document.querySelector('input[name="moneyPrepaymentMode"]:checked')?.value || 'none';

        const lumpsumEvents = [];
        if (prepayGoalType === 'money' && moneyPrepaymentMode === 'lumpsum') {
            document.querySelectorAll('.lumpsum-input-row').forEach(row => {
                const amount = parseFloat(row.querySelector('.lumpsum-amount').value);
                const monthStr = row.querySelector('.lumpsum-month').value;
                const month = dateToLoanMonth(monthStr, loanStartMonthStr);
                // Only add if valid and amount > 0
                if (!isNaN(amount) && amount > 0 && month !== null && month > 0) {
                    lumpsumEvents.push({ amount, month });
                }
            });
        }
        lumpsumEvents.sort((a, b) => a.month - b.month); // Sort by month for processing

        const recurringEvents = [];
        if (prepayGoalType === 'money' && moneyPrepaymentMode === 'recurring') {
            document.querySelectorAll('.recurring-input-row').forEach(row => {
                const amount = parseFloat(row.querySelector('.recurring-amount').value);
                const frequency = parseInt(row.querySelector('.recurring-frequency').value);
                const startMonthStr = row.querySelector('.recurring-start-month').value;
                const endMonthStr = row.querySelector('.recurring-end-month').value;
                const startMonth = dateToLoanMonth(startMonthStr, loanStartMonthStr);
                const endMonth = endMonthStr ? dateToLoanMonth(endMonthStr, loanStartMonthStr) : originalTenureMonths * 2; // Default to max iteration

                if (!isNaN(amount) && amount > 0 && frequency > 0 && startMonth !== null && startMonth >= 0) {
                    recurringEvents.push({ amount, frequency, startMonth, endMonth });
                }
            });
        }

        const rateChangeEvents = [];
        document.querySelectorAll('.rate-change-input-row').forEach(row => {
            const newRate = parseFloat(row.querySelector('.new-interest-rate').value);
            const startMonthStr = row.querySelector('.rate-change-start-month').value;
            const endMonthStr = row.querySelector('.rate-change-end-month').value;
            const startMonth = dateToLoanMonth(startMonthStr, loanStartMonthStr);
            const endMonth = endMonthStr ? dateToLoanMonth(endMonthStr, loanStartMonthStr) : originalTenureMonths * 2; // Default to max iteration

            if (!isNaN(newRate) && newRate >= 0 && startMonth !== null && startMonth > 0) {
                rateChangeEvents.push({ newRate: newRate / 12 / 100, startMonth, endMonth });
            }
        });
        rateChangeEvents.sort((a, b) => a.startMonth - b.startMonth);


        // --- Amortization Calculation ---
        let balance = principal;
        let currentMonth = 0;
        let actualMonthsPaid = 0;
        let totalInterestPaidWithAdjustments = 0;
        let totalPrincipalPaidViaEMI = 0;
        let totalPrepaymentsSum = 0;
        let currentEMI = originalEMI;

        amortizationTableBody.innerHTML = '';
        amortizationNoteEl.textContent = '';

        const maxMonthsToIterate = Math.max(originalTenureMonths * 2, 720); // Max 60 years or double original

        // Amortization Loop
        while (balance > 0.01 && actualMonthsPaid < maxMonthsToIterate) {
            actualMonthsPaid++;
            currentMonth++;

            let currentMonthlyInterestRate = originalMonthlyInterestRate;
            let currentPrepaymentThisMonth = 0;

            // Apply Interest Rate Changes for the current month
            for (const rcEvent of rateChangeEvents) {
                if (currentMonth >= rcEvent.startMonth && currentMonth <= rcEvent.endMonth) {
                    currentMonthlyInterestRate = rcEvent.newRate;
                    // If reducing EMI, recalculate EMI immediately after rate change for 'Reduce EMI' mode
                    if (!outcomeReduceTenure && originalTenureMonths - (currentMonth - 1) > 0) {
                        currentEMI = calculateEMI(balance, currentMonthlyInterestRate, originalTenureMonths - (currentMonth - 1));
                    }
                    break; // Apply the first applicable rate change (assuming no overlaps or specific hierarchy)
                }
            }


            let interestForMonth = (currentMonthlyInterestRate === 0) ? 0 : balance * currentMonthlyInterestRate;
            let principalPaidThisMonthFromEMI = Math.max(0, currentEMI - interestForMonth);

            // Apply Lumpsum Prepayments for the current month
            for (const lsEvent of lumpsumEvents) {
                if (currentMonth === lsEvent.month && lsEvent.amount > 0) {
                    currentPrepaymentThisMonth += lsEvent.amount;
                    lsEvent.amount = 0; // Mark as applied
                }
            }

            // Apply Recurring Prepayments for the current month
            for (const recEvent of recurringEvents) {
                if (recEvent.amount > 0 && currentMonth >= recEvent.startMonth && currentMonth <= recEvent.endMonth) {
                    if ((currentMonth - recEvent.startMonth) % recEvent.frequency === 0) {
                        currentPrepaymentThisMonth += recEvent.amount;
                    }
                }
            }

            // Ensure prepayment doesn't exceed outstanding balance
            currentPrepaymentThisMonth = Math.min(currentPrepaymentThisMonth, balance - principalPaidThisMonthFromEMI);
            if (currentPrepaymentThisMonth < 0) currentPrepaymentThisMonth = 0;


            // Recalculate EMI for "Reduce EMI" option AFTER prepayments/rate changes apply to balance
            const outcomeReduceTenure = outcomeReduceTenureRadio.checked;
            if (!outcomeReduceTenure) { // If 'Reduce EMI' is selected
                let reCalcEMI = false;
                // Trigger recalculation if any event is active or just started/ended
                if (currentPrepaymentThisMonth > 0 || // Any prepayment this month
                    rateChangeEvents.some(rc => currentMonth === rc.startMonth || (currentMonth === rc.endMonth + 1 && rc.endMonth < originalTenureMonths * 2)) // Rate change starts/ends
                ) {
                    reCalcEMI = true;
                }

                // If loan is effectively paid off with current payment
                if (balance - principalPaidThisMonthFromEMI - currentPrepaymentThisMonth <= 0.01 && balance > 0.01) {
                    reCalcEMI = true; // Final adjustment needed
                }

                if (reCalcEMI) {
                    const remainingBalanceAfterPrepayment = balance - principalPaidThisMonthFromEMI - currentPrepaymentThisMonth;
                    const monthsRemainingForEMI = originalTenureMonths - currentMonth;

                    if (monthsRemainingForEMI > 0) {
                        currentEMI = calculateEMI(
                            remainingBalanceAfterPrepayment,
                            currentMonthlyInterestRate,
                            monthsRemainingForEMI
                        );
                        if (!isFinite(currentEMI) || currentEMI < 0) currentEMI = 0;
                    } else {
                        currentEMI = 0; // Loan tenure reached or passed
                    }
                }
            }
            // Ensure principal paid from EMI doesn't exceed remaining balance - prepayment
            principalPaidThisMonthFromEMI = Math.min(principalPaidThisMonthFromEMI, balance - currentPrepaymentThisMonth);
            if(principalPaidThisMonthFromEMI < 0) principalPaidThisMonthFromEMI = 0; // Can happen if prepayment cleared it

            // Update balance
            balance -= principalPaidThisMonthFromEMI;
            balance -= currentPrepaymentThisMonth;

            totalInterestPaidWithAdjustments += interestForMonth;
            totalPrincipalPaidViaEMI += principalPaidThisMonthFromEMI;
            totalPrepaymentsSum += currentPrepaymentThisMonth;

            // Ensure balance doesn't go negative on final payment
            if (balance < 0.01 && balance > -1) balance = 0; // small float errors

            const row = amortizationTableBody.insertRow();
            row.insertCell().textContent = currentMonth;
            row.insertCell().textContent = formatCurrency(principalPaidThisMonthFromEMI);
            row.insertCell().textContent = formatCurrency(interestForMonth);
            row.insertCell().textContent = formatCurrency(currentPrepaymentThisMonth);
            row.insertCell().textContent = formatCurrency(principalPaidThisMonthFromEMI + interestForMonth + currentPrepaymentThisMonth);
            row.insertCell().textContent = formatCurrency(currentEMI);
            row.insertCell().textContent = formatCurrency(balance);

            if (balance <= 0.01) break; // Loan paid off
        }

        if (actualMonthsPaid >= maxMonthsToIterate && balance > 0.01) {
            amortizationNoteEl.textContent = "Loan calculation exceeded maximum iterations. Please check inputs or adjustments. Loan might not be fully paid off.";
        }

        amortizationSectionDiv.style.display = 'block';
        prepaymentSummaryDiv.style.display = 'block';

        // --- Display Adjusted Summary ---
        let totalAdjustedPayment = totalPrincipalPaidViaEMI + totalInterestPaidWithAdjustments + totalPrepaymentsSum;
        const interestSaved = originalTotalInterest - totalInterestPaidWithAdjustments;
        const netMoneySaved = interestSaved - totalPrepaymentsSum; // Net savings after accounting for money paid extra

        if (outcomeReduceTenure) {
            newTenureLabel.textContent = 'New Loan Tenure:';
            newTenureEl.textContent = `${actualMonthsPaid} months (${(actualMonthsPaid / 12).toFixed(1)} years)`;
            newEMILabel.textContent = 'Monthly EMI (remains original):';
            newEMIEl.textContent = formatCurrency(originalEMI);
        } else { // Reduce EMI
            newTenureLabel.textContent = 'Original Loan Tenure:';
            newTenureEl.textContent = `${originalTenureMonths} months (${tenureYears} years)`;
            newEMILabel.textContent = 'Final Monthly EMI:'; // This will be the EMI in the last month
            newEMIEl.textContent = formatCurrency(currentEMI);
            // If loan ended prematurely due to prepayments in "reduce EMI" mode
            if(actualMonthsPaid < originalTenureMonths) {
                 newTenureLabel.textContent = 'Actual Loan Tenure:';
                 newTenureEl.textContent = `${actualMonthsPaid} months (${(actualMonthsPaid / 12).toFixed(1)} years)`;
                 amortizationNoteEl.textContent += " Loan paid off early due to prepayments, even in 'Reduce EMI' mode.";
            }
        }

        newTotalInterestEl.textContent = formatCurrency(totalInterestPaidWithAdjustments);
        newTotalPaymentEl.textContent = formatCurrency(totalAdjustedPayment);
        interestSavedEl.textContent = formatCurrency(interestSaved);
        moneySavedEl.textContent = formatCurrency(netMoneySaved);
        totalPrepaymentsMadeEl.textContent = formatCurrency(totalPrepaymentsSum);


        // --- Display Configured Adjustments Summary ---
        configuredAdjustmentsSummaryDiv.style.display = 'block';
        lumpsumSummaryList.innerHTML = '<h4>Lumpsum Prepayments:</h4>';
        if (lumpsumEvents.length > 0) {
            lumpsumEvents.forEach(e => {
                const date = loanMonthToDate(loanStartMonthStr, e.month);
                lumpsumSummaryList.innerHTML += `<p>₹ ${formatNumber(e.amount)} at Month ${e.month} (${date})</p>`;
            });
        } else {
            lumpsumSummaryList.innerHTML += `<p>No lumpsum prepayments configured.</p>`;
        }

        recurringSummaryList.innerHTML = '<h4>Recurring Prepayments:</h4>';
        if (recurringEvents.length > 0) {
            recurringEvents.forEach(e => {
                const startDate = loanMonthToDate(loanStartMonthStr, e.startMonth);
                const endDate = e.endMonth && e.endMonth < originalTenureMonths * 2 ? loanMonthToDate(loanStartMonthStr, e.endMonth) : 'Loan End';
                recurringSummaryList.innerHTML += `<p>₹ ${formatNumber(e.amount)} every ${e.frequency} months, from Month ${e.startMonth} (${startDate}) to Month ${e.endMonth || 'Loan End'} (${endDate})</p>`;
            });
        } else {
            recurringSummaryList.innerHTML += `<p>No recurring prepayments configured.</p>`;
        }

        rateChangeSummaryList.innerHTML = '<h4>Interest Rate Changes:</h4>';
        if (rateChangeEvents.length > 0) {
            rateChangeEvents.forEach(e => {
                const startDate = loanMonthToDate(loanStartMonthStr, e.startMonth);
                const endDate = e.endMonth && e.endMonth < originalTenureMonths * 2 ? loanMonthToDate(loanStartMonthStr, e.endMonth) : 'Loan End';
                rateChangeSummaryList.innerHTML += `<p>Rate changes to ${(e.newRate * 12 * 100).toFixed(2)}% from Month ${e.startMonth} (${startDate}) to Month ${e.endMonth || 'Loan End'} (${endDate})</p>`;
            });
        } else {
            rateChangeSummaryList.innerHTML += `<p>No interest rate changes configured.</p>`;
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
        let isValid = true; // Assume valid until proven otherwise

        const principal = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const tenureYears = parseFloat(loanTenureInput.value);
        const loanStartMonthStr = loanStartMonthInput.value;
        const loanStartMonthDate = new Date(loanStartMonthStr + '-01');

        if (isNaN(principal) || principal <= 0) {
            showError('Please enter a valid Loan Amount (greater than 0).'); isValid = false;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            showError('Please enter a valid Annual Interest Rate (0 or greater).'); isValid = false;
        }
        if (isNaN(tenureYears) || tenureYears <= 0) {
            showError('Please enter a valid Loan Tenure in Years (greater than 0).'); isValid = false;
        }
        if (!loanStartMonthStr || isNaN(loanStartMonthDate.getTime())) {
            showError('Please select a valid Loan Start Month.'); isValid = false;
        }

        const maxMonths = 720; // 60 years max
        const originalTenureMonths = tenureYears * 12;

        if (originalTenureMonths > maxMonths) {
             showError(`Loan tenure cannot exceed ${maxMonths/12} years.`); isValid = false;
        }


        const prepayGoalType = document.querySelector('input[name="prepayGoalType"]:checked').value;
        const moneyPrepaymentMode = document.querySelector('input[name="moneyPrepaymentMode"]:checked')?.value || 'none';

        if (prepayGoalType === 'money') {
            if (moneyPrepaymentMode === 'lumpsum') {
                let hasValidLumpsumEntry = false;
                document.querySelectorAll('.lumpsum-input-row').forEach(row => {
                    const amountInput = row.querySelector('.lumpsum-amount');
                    const monthInput = row.querySelector('.lumpsum-month');

                    // Validate only if at least one field in the row has a value
                    if (amountInput.value !== '' || monthInput.value !== '') {
                        const amount = parseFloat(amountInput.value);
                        const monthStr = monthInput.value;
                        const month = dateToLoanMonth(monthStr, loanStartMonthStr);

                        if (isNaN(amount) || amount <= 0) {
                            showError(`Lumpsum (Row ${row.dataset.id}): Please enter a valid Amount (greater than 0).`); isValid = false;
                        }
                        if (month === null || month <= 0 || month > originalTenureMonths) {
                            showError(`Lumpsum (Row ${row.dataset.id}): Month must be between 1 and ${originalTenureMonths} (relative to Loan Start Month).`); isValid = false;
                        }
                        if (isValid) hasValidLumpsumEntry = true; // If this row is valid, mark that we have at least one
                    }
                });
                 // If money option is chosen, and lumpsum mode, but no valid entries found, show an error.
                if (!hasValidLumpsumEntry && lumpsumPrepaymentContainer.children.length > 0 && prepayGoalMoneyRadio.checked && prepayLumpsumRadio.checked) {
                    // Check if all rows are completely empty. If so, it might be fine, but if any partially filled or zero amounts, it's an issue.
                    let allLumpsumRowsEmpty = true;
                    document.querySelectorAll('.lumpsum-input-row').forEach(row => {
                        if (row.querySelector('.lumpsum-amount').value !== '' || row.querySelector('.lumpsum-month').value !== '') {
                            allLumpsumRowsEmpty = false;
                        }
                    });
                    if (!allLumpsumRowsEmpty) {
                         showError('Lumpsum: No valid lumpsum entries found. Ensure all fields are correctly filled.');
                         isValid = false;
                    }
                }


            } else if (moneyPrepaymentMode === 'recurring') {
                let hasValidRecurringEntry = false;
                document.querySelectorAll('.recurring-input-row').forEach(row => {
                    const amountInput = row.querySelector('.recurring-amount');
                    const frequencyInput = row.querySelector('.recurring-frequency');
                    const startMonthInput = row.querySelector('.recurring-start-month');
                    const endMonthInput = row.querySelector('.recurring-end-month');

                    if (amountInput.value !== '' || startMonthInput.value !== '' || endMonthInput.value !== '') {
                        const amount = parseFloat(amountInput.value);
                        const frequency = parseInt(frequencyInput.value);
                        const startMonthStr = startMonthInput.value;
                        const endMonthStr = endMonthInput.value;
                        const startMonth = dateToLoanMonth(startMonthStr, loanStartMonthStr);
                        const endMonth = endMonthStr ? dateToLoanMonth(endMonthStr, loanStartMonthStr) : null;

                        if (isNaN(amount) || amount <= 0) {
                            showError(`Recurring (Row ${row.dataset.id}): Please enter a valid Amount (greater than 0).`); isValid = false;
                        }
                        if (isNaN(frequency) || frequency <= 0) {
                            showError(`Recurring (Row ${row.dataset.id}): Please select a valid Frequency.`); isValid = false;
                        }
                        if (startMonth === null || startMonth < 0 || startMonth > originalTenureMonths) {
                            showError(`Recurring (Row ${row.dataset.id}): Start Month must be between 0 and ${originalTenureMonths} (relative to Loan Start Month).`); isValid = false;
                        }
                        if (endMonth !== null && (endMonth <= startMonth || endMonth > maxMonths)) {
                            showError(`Recurring (Row ${row.dataset.id}): End Month must be after Start Month and not exceed ${maxMonths} months.`); isValid = false;
                        }
                        if(isValid) hasValidRecurringEntry = true;
                    }
                });
                if (!hasValidRecurringEntry && recurringPrepaymentContainer.children.length > 0 && prepayGoalMoneyRadio.checked && prepayRecurringRadio.checked) {
                    let allRecurringRowsEmpty = true;
                    document.querySelectorAll('.recurring-input-row').forEach(row => {
                        if (row.querySelector('.recurring-amount').value !== '' || row.querySelector('.recurring-start-month').value !== '' || row.querySelector('.recurring-end-month').value !== '') {
                            allRecurringRowsEmpty = false;
                        }
                    });
                    if (!allRecurringRowsEmpty) {
                         showError('Recurring: No valid recurring entries found. Ensure all fields are correctly filled.');
                         isValid = false;
                    }
                }
            }
        }

        // Rate change validation (always check, regardless of prepayment type)
        let hasValidRateChangeEntry = false;
        document.querySelectorAll('.rate-change-input-row').forEach(row => {
            const newRateInput = row.querySelector('.new-interest-rate');
            const startMonthInput = row.querySelector('.rate-change-start-month');
            const endMonthInput = row.querySelector('.rate-change-end-month');

            if (newRateInput.value !== '' || startMonthInput.value !== '' || endMonthInput.value !== '') {
                const newRate = parseFloat(newRateInput.value);
                const startMonthStr = startMonthInput.value;
                const endMonthStr = endMonthInput.value;
                const startMonth = dateToLoanMonth(startMonthStr, loanStartMonthStr);
                const endMonth = endMonthStr ? dateToLoanMonth(endMonthStr, loanStartMonthStr) : null;

                if (isNaN(newRate) || newRate < 0) {
                    showError(`Rate Change (Row ${row.dataset.id}): Please enter a valid New Annual Interest Rate (0 or greater).`); isValid = false;
                }
                if (startMonth === null || startMonth <= 0 || startMonth > originalTenureMonths) {
                    showError(`Rate Change (Row ${row.dataset.id}): Start Month must be between 1 and ${originalTenureMonths} (relative to Loan Start Month).`); isValid = false;
                }
                 if (endMonth !== null && (endMonth <= startMonth || endMonth > maxMonths)) {
                    showError(`Rate Change (Row ${row.dataset.id}): End Month must be after Start Month and not exceed ${maxMonths} months.`); isValid = false;
                }
                if(isValid) hasValidRateChangeEntry = true;
            }
        });

        // This ensures if rate changes are enabled, at least one valid entry exists
        if (!hasValidRateChangeEntry && rateChangeContainer.children.length > 0) {
            let allRateChangeRowsEmpty = true;
            document.querySelectorAll('.rate-change-input-row').forEach(row => {
                if (row.querySelector('.new-interest-rate').value !== '' || row.querySelector('.rate-change-start-month').value !== '' || row.querySelector('.rate-change-end-month').value !== '') {
                    allRateChangeRowsEmpty = false;
                }
            });
            if (!allRateChangeRowsEmpty) {
                 showError('Interest Rate Changes: No valid rate change entries found. Ensure all fields are correctly filled.');
                 isValid = false;
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
        configuredAdjustmentsSummaryDiv.style.display = 'none';
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

    function formatNumber(amount) { // For display in summary without currency symbol
        const numAmount = Number(amount);
        if (isNaN(numAmount)) {
            return `0`;
        }
        return `${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }


    // --- Initial UI setup ---
    prepayGoalNoneRadio.dispatchEvent(new Event('change')); // Initialize UI display for prepayment type
    prepayLumpsumRadio.dispatchEvent(new Event('change')); // Initialize UI display for money prepayment mode

    // Set default loan start month to current month if not set
    if (!loanStartMonthInput.value) {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        loanStartMonthInput.value = `${year}-${month}`;
    }

    // Ensure initial remove buttons are hidden if only one row
    updateRemoveButtonVisibility(lumpsumPrepaymentContainer);
    updateRemoveButtonVisibility(recurringPrepaymentContainer);
    updateRemoveButtonVisibility(rateChangeContainer);

});
