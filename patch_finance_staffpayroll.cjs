const fs = require('fs');

let finance = fs.readFileSync('src/pages/Finance.jsx', 'utf8');

// 1. Add import StaffPayroll
if (!finance.includes('import StaffPayroll')) {
  finance = finance.replace(
    `import PageHeader from "@/components/shared/PageHeader";`,
    `import PageHeader from "@/components/shared/PageHeader";\nimport StaffPayroll from "@/pages/StaffPayroll";`
  );
}

// 2. Add payroll to expenseSubTab
finance = finance.replace(
`              <button
                onClick={() => setExpenseSubTab("salaries")}
                className={\`px-6 py-2 rounded-lg text-sm font-bold transition-all \${expenseSubTab === "salaries" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}\`}
              >
                الرواتب والأجور
              </button>
            </div>`,
`              <button
                onClick={() => setExpenseSubTab("salaries")}
                className={\`px-6 py-2 rounded-lg text-sm font-bold transition-all \${expenseSubTab === "salaries" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}\`}
              >
                الرواتب والأجور
              </button>
              <button
                onClick={() => setExpenseSubTab("payroll")}
                className={\`px-6 py-2 rounded-lg text-sm font-bold transition-all \${expenseSubTab === "payroll" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}\`}
              >
                المسير الشامل
              </button>
            </div>`
);

// 3. Render StaffPayroll when expenseSubTab === "payroll"
finance = finance.replace(
`          {expenseSubTab === "salaries" && (`,
`          {expenseSubTab === "payroll" && (
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm mb-6">
              <StaffPayroll isEmbedded={true} />
            </div>
          )}

          {expenseSubTab === "salaries" && (`
);

fs.writeFileSync('src/pages/Finance.jsx', finance);
console.log('Finance.jsx updated to include StaffPayroll');
