
document.getElementById('emiForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const P = parseFloat(document.getElementById('loanAmount').value);
  const R = parseFloat(document.getElementById('interestRate').value) / 12 / 100;
  const N = parseInt(document.getElementById('loanTenure').value);
  const prepayType = document.getElementById('prepaymentType').value;
  const prepayValue = parseFloat(document.getElementById('prepaymentValue').value) || 0;
  const frequency = document.getElementById('frequency').value;
  const prepayStart = parseInt(document.getElementById('prepayStart').value) || 0;
  const prepayEnd = parseInt(document.getElementById('prepayEnd').value) || 0;
  const adjust = document.getElementById('adjustType').value;

  let emi = P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1);
  let balance = P;
  let totalInterest = 0;
  let schedule = "";

  schedule += '<table><tr><th>Month</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr>';

  for (let month = 1; month <= N; month++) {
    let interest = balance * R;
    let principal = emi - interest;

    if (month >= prepayStart && month <= prepayEnd) {
      if (frequency === "monthly" || 
         (frequency === "quarterly" && month % 3 === 0) ||
         (frequency === "halfyearly" && month % 6 === 0) ||
         (frequency === "yearly" && month % 12 === 0) ||
         (frequency === "once" && month === prepayStart)) {
        if (prepayType === "amount") balance -= prepayValue;
        if (prepayType === "interest") {
          let newRate = R * 12 * 100 - prepayValue;
          R = newRate / 12 / 100;
          emi = balance * R * Math.pow(1 + R, N - month) / (Math.pow(1 + R, N - month) - 1);
        }
      }
    }

    balance -= principal;
    totalInterest += interest;
    if (balance <= 0) break;

    schedule += `<tr><td>${month}</td><td>₹${emi.toFixed(2)}</td><td>₹${principal.toFixed(2)}</td><td>₹${interest.toFixed(2)}</td><td>₹${balance.toFixed(2)}</td></tr>`;
  }

  schedule += "</table>";

  document.getElementById('result').innerHTML = `
    <p><strong>Monthly EMI:</strong> ₹${emi.toFixed(2)}</p>
    <p><strong>Total Interest:</strong> ₹${totalInterest.toFixed(2)}</p>
  `;
  document.getElementById('scheduleTable').innerHTML = schedule;
});
