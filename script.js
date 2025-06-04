
document.getElementById('emiForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const P = parseFloat(document.getElementById('loanAmount').value);
  const annualRate = parseFloat(document.getElementById('interestRate').value);
  const N = parseInt(document.getElementById('loanTenure').value);
  const prepaymentAmount = parseFloat(document.getElementById('prepaymentAmount').value) || 0;
  const prepaymentMonth = parseInt(document.getElementById('prepaymentMonth').value) || 0;

  const r = annualRate / 12 / 100;
  let emi = P * r * Math.pow(1 + r, N) / (Math.pow(1 + r, N) - 1);
  let totalPayment = 0;
  let remainingPrincipal = P;

  for (let month = 1; month <= N; month++) {
    const interestComponent = remainingPrincipal * r;
    const principalComponent = emi - interestComponent;
    remainingPrincipal -= principalComponent;

    if (month === prepaymentMonth && prepaymentAmount > 0) {
      remainingPrincipal -= prepaymentAmount;
    }

    totalPayment += emi;

    if (remainingPrincipal <= 0) {
      break;
    }
  }

  document.getElementById('result').innerHTML = `
    <p><strong>Monthly EMI:</strong> ₹${emi.toFixed(2)}</p>
    <p><strong>Total Payment:</strong> ₹${totalPayment.toFixed(2)}</p>
    <p><strong>Remaining Principal after prepayment:</strong> ₹${remainingPrincipal > 0 ? remainingPrincipal.toFixed(2) : 0}</p>
  `;
});
