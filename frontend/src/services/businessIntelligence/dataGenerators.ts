// Data Generation Utilities for BI Service
export class DataGenerators {
  generateFinancialData(): Array<Record<string, unknown>> {
    return [
      { month: 'Jan', revenue: 100000, expenses: 80000, profit: 20000 },
      { month: 'Feb', revenue: 120000, expenses: 90000, profit: 30000 },
      { month: 'Mar', revenue: 110000, expenses: 85000, profit: 25000 },
      { month: 'Apr', revenue: 130000, expenses: 95000, profit: 35000 },
      { month: 'May', revenue: 125000, expenses: 88000, profit: 37000 },
      { month: 'Jun', revenue: 140000, expenses: 100000, profit: 40000 },
    ];
  }

  generateOperationalData(): Array<Record<string, unknown>> {
    return [
      { department: 'Sales', employees: 25, productivity: 85, satisfaction: 4.2 },
      { department: 'Marketing', employees: 15, productivity: 90, satisfaction: 4.5 },
      { department: 'Development', employees: 40, productivity: 88, satisfaction: 4.3 },
      { department: 'Support', employees: 20, productivity: 82, satisfaction: 4.1 },
    ];
  }

  generateComplianceData(): Array<Record<string, unknown>> {
    return [
      { category: 'Security', compliance: 95, violations: 2, lastAudit: '2024-01-15' },
      { category: 'Privacy', compliance: 98, violations: 1, lastAudit: '2024-01-20' },
      { category: 'Financial', compliance: 92, violations: 3, lastAudit: '2024-01-10' },
      { category: 'Operational', compliance: 96, violations: 1, lastAudit: '2024-01-25' },
    ];
  }

  generateSampleData(): Array<Record<string, unknown>> {
    return [
      { id: 1, name: 'Item 1', value: 100, category: 'A' },
      { id: 2, name: 'Item 2', value: 200, category: 'B' },
      { id: 3, name: 'Item 3', value: 150, category: 'A' },
      { id: 4, name: 'Item 4', value: 300, category: 'C' },
      { id: 5, name: 'Item 5', value: 250, category: 'B' },
    ];
  }

  generateChartData(): Record<string, unknown> {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue',
          data: [100000, 120000, 110000, 130000, 125000, 140000],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  }

  generateKPIData(): Record<string, unknown> {
    return {
      value: 85.5,
      target: 90,
      trend: 'up',
      change: 5.2,
      unit: '%',
    };
  }

  generateTableData(): Array<Record<string, unknown>> {
    return [
      { id: 1, name: 'Project A', status: 'Active', progress: 75 },
      { id: 2, name: 'Project B', status: 'Completed', progress: 100 },
      { id: 3, name: 'Project C', status: 'Pending', progress: 25 },
    ];
  }
}
