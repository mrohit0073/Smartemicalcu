function addPrepayment() {
  const container = document.getElementById('prepaymentsContainer');
  const count = container.querySelectorAll('fieldset').length + 1;
  const fieldset = document.createElement('fieldset');
  fieldset.innerHTML = `
    <legend>Prepayment Option ${count}</legend>
    <label>Type:
      <select class="prepaymentType">
        <option value="amount">Money</option>
        <option value="interest">Interest</option>
      </select>
    </label>
    <label>Value: <input type="number" step="0.01" class="prepaymentValue"></label>
    <label>Frequency:
      <select class="frequency">
        <option value="once">Once</option>
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
        <option value="halfyearly">Half-yearly</option>
        <option value="yearly">Yearly</option>
      </select>
    </label>
    <label>Start (Month): <input type="number" class="prepayStart"></label>
    <label>End (Month): <input type="number" class="prepayEnd"></label>
  `;
  container.appendChild(fieldset);
}

document.getElementById('emiForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const P = parseFloat(document.getElementById('loanAmount').value);
  const initialRate = parseFloat(document.getElementById('interestRate').value);
  let R = initialRate / 12 / 100;
  const N = parseInt(document.getElementById('loanTenure').value);
  const adjust = document.getElementById('adjustType').value;

  const prepayOptions = Array.from(document.querySelectorAll('#prepaymentsContainer fieldset')).map(fs => ({
    type: fs.querySelector('.prepaymentType').value,
    value: parseFloat(fs.querySelector('.prepaymentValue').value) || 0,
    frequency: fs.querySelector('.frequency').value,
    start: parseInt(fs.querySelector('.prepayStart').value) || 0,
    end: parseInt(fs.querySelector('.prepayEnd').value) || 0
  }));

  let emi = P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1);
  let balance = P;
  let totalInterest = 0;
  let schedule = "<table id='schedule'><tr><th>Month</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr>";

  for (let month = 1; month <= N && balance > 0; month++) {
    let interest = balance * R;
    let principal = emi - interest;

    for (let pre of prepayOptions) {
      const doPrepay = (month >= pre.start && month <= pre.end) && (
        (pre.frequency === "monthly") ||
        (pre.frequency === "quarterly" && month % 3 === 0) ||
        (pre.frequency === "halfyearly" && month % 6 === 0) ||
        (pre.frequency === "yearly" && month % 12 === 0) ||
        (pre.frequency === "once" && month === pre.start)
      );
      if (doPrepay) {
        if (pre.type === "amount") balance -= pre.value;
        else if (pre.type === "interest") {
          let newAnnual = initialRate - pre.value;
          R = newAnnual / 12 / 100;
          emi = balance * R * Math.pow(1 + R, N - month) / (Math.pow(1 + R, N - month) - 1);
        }
      }
    }

    balance -= principal;
    if (balance < 0) balance = 0;
    totalInterest += interest;
    schedule += `<tr><td>${month}</td><td>${emi.toFixed(2)}</td><td>${principal.toFixed(2)}</td><td>${interest.toFixed(2)}</td><td>${balance.toFixed(2)}</td></tr>`;
  }

  schedule += "</table>";
  document.getElementById('result').innerHTML = `
    <p><strong>Monthly EMI:</strong> ₹${emi.toFixed(2)}</p>
    <p><strong>Total Interest:</strong> ₹${totalInterest.toFixed(2)}</p>
  `;
  document.getElementById('scheduleTable').innerHTML = schedule;
});

function exportToExcel() {
  const wb = XLSX.utils.table_to_book(document.getElementById('schedule'), {sheet:"EMI Schedule"});
  XLSX.writeFile(wb, "EMI_Schedule.xlsx");
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text("EMI Schedule", 10, 10);
  pdf.autoTable({ html: '#schedule', startY: 20 });
  pdf.save("EMI_Schedule.pdf");
}

function handlePrepaymentTypeChange(select) {
  const fs = select.closest("fieldset");
  const freqWrapper = fs.querySelector(".frequencyWrapper");
  if (select.value === "interest") {
    freqWrapper.style.display = "none";
  } else {
    freqWrapper.style.display = "block";
  }
}
