/**
 * WCC Finance Management & Accounting System
 * Chart.js Visualization Engine
 */

class ChartEngine {
  constructor() {
    this.chartInstances = {};
  }

  destroyChart(canvasId) {
    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
      delete this.chartInstances[canvasId];
    }
  }

  renderIncomeExpenseChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    this.destroyChart(canvasId);

    const kpis = window.store.getFinancialKPIs();

    const ctx = canvas.getContext('2d');
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total Income', 'Incurred Expense', 'Directly Paid', 'Pending Reimbursement'],
        datasets: [{
          label: 'Amount (BDT)',
          data: [
            kpis.totalIncome,
            kpis.totalIncurredExpenses,
            kpis.totalPaidExpenses,
            kpis.pendingReimbursements
          ],
          backgroundColor: [
            'rgba(22, 144, 83, 0.85)',
            'rgba(182, 42, 53, 0.85)',
            'rgba(29, 53, 87, 0.85)',
            'rgba(241, 173, 26, 0.85)'
          ],
          borderRadius: 6,
          barThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ৳ ${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '৳' + (value >= 1000 ? (value / 1000) + 'k' : value)
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  renderCategoryExpenseChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    this.destroyChart(canvasId);

    const expenses = window.store.data.expenses;
    const catMap = {};
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0);
    });

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);

    const colors = [
      '#B62A35', '#1D3557', '#F1AD1A', '#169053',
      '#BE464F', '#457B9D', '#A6772A', '#026AA2',
      '#E08A00', '#9E1F2A', '#6366F1', '#EC4899',
      '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4'
    ];
    const chartColors = labels.length 
      ? labels.map((_, i) => colors[i % colors.length]) 
      : ['#B62A35'];

    const ctx = canvas.getContext('2d');
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: chartColors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ৳${ctx.raw.toLocaleString()}`
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  renderActivityTypeChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    this.destroyChart(canvasId);

    const activities = window.store.data.activities;
    const typeMap = {};
    activities.forEach(a => {
      typeMap[a.type] = (typeMap[a.type] || 0) + Number(a.actualExpense || 0);
    });

    const labels = Object.keys(typeMap);
    const data = Object.values(typeMap);

    const ctx = canvas.getContext('2d');
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: labels.length ? labels : ['General'],
        datasets: [{
          data: data.length ? data : [0],
          backgroundColor: [
            'rgba(182, 42, 53, 0.75)',
            'rgba(241, 173, 26, 0.75)',
            'rgba(29, 53, 87, 0.75)',
            'rgba(22, 144, 83, 0.75)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
        }
      }
    });
  }
}

window.chartEngine = new ChartEngine();
