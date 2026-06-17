const fs = require('fs');

let finance = fs.readFileSync('src/pages/Finance.jsx', 'utf8');

// 1. Add state for advances
finance = finance.replace(
`  const [allowances, setAllowances] = useState("0");
  const [deductions, setDeductions] = useState("0");`,
`  const [allowances, setAllowances] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [advances, setAdvances] = useState("0");`
);

// 2. Update computedNetSalary
finance = finance.replace(
`  const computedNetSalary = useMemo(() => {
    const base = parseFloat(baseSal || '0');
    const allow = parseFloat(allowances || '0');
    const ded = parseFloat(deductions || '0');
    return Math.max(0, base + allow - ded);
  }, [baseSal, allowances, deductions]);`,
`  const computedNetSalary = useMemo(() => {
    const base = parseFloat(baseSal || '0');
    const allow = parseFloat(allowances || '0');
    const ded = parseFloat(deductions || '0');
    const adv = parseFloat(advances || '0');
    return Math.max(0, base + allow - ded - adv);
  }, [baseSal, allowances, deductions, advances]);`
);

// 3. Update createSalaryMutation payload
finance = finance.replace(
`      base_salary: parseFloat(baseSal),
      allowances: parseFloat(allowances || '0'),
      deductions: parseFloat(deductions || '0'),
      net_salary: computedNetSalary,`,
`      base_salary: parseFloat(baseSal),
      allowances: parseFloat(allowances || '0'),
      deductions: parseFloat(deductions || '0'),
      advances: parseFloat(advances || '0'),
      net_salary: computedNetSalary,`
);

// 4. Reset advances on successful salary creation
finance = finance.replace(
`      setBaseSal("");
      setAllowances("0");
      setDeductions("0");
      setSelectedEmpId("");`,
`      setBaseSal("");
      setAllowances("0");
      setDeductions("0");
      setAdvances("0");
      setSelectedEmpId("");`
);

// 5. Update Table Headers
finance = finance.replace(
`                      <th className="pb-3">الراتب الأساسي</th>
                      <th className="pb-3">البدلات (+)</th>
                      <th className="pb-3">الخصومات (-)</th>
                      <th className="pb-3">صافي الراتب</th>`,
`                      <th className="pb-3">الأساسي</th>
                      <th className="pb-3">البدلات (+)</th>
                      <th className="pb-3">استقطاع (-)</th>
                      <th className="pb-3">سلفية (-)</th>
                      <th className="pb-3">صافي الراتب</th>`
);

// 6. Update Table Cells
finance = finance.replace(
`                        <td className="py-4 num-en text-emerald-600">\${parseFloat(s.allowances || 0).toFixed(2)}</td>
                        <td className="py-4 num-en text-rose-600">\${parseFloat(s.deductions || 0).toFixed(2)}</td>
                        <td className="py-4 num-en font-black text-stone-900">\${parseFloat(s.net_salary).toFixed(2)}</td>`,
`                        <td className="py-4 num-en text-emerald-600">\${parseFloat(s.allowances || 0).toFixed(2)}</td>
                        <td className="py-4 num-en text-rose-600">\${parseFloat(s.deductions || 0).toFixed(2)}</td>
                        <td className="py-4 num-en text-amber-600">\${parseFloat(s.advances || 0).toFixed(2)}</td>
                        <td className="py-4 num-en font-black text-stone-900">\${parseFloat(s.net_salary).toFixed(2)}</td>`
);

// 7. Update form inputs to include advances
finance = finance.replace(
`                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>الأساسي</Label>
                    <Input type="number" value={baseSal} onChange={e => setBaseSal(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>البدلات (+)</Label>
                    <Input type="number" value={allowances} onChange={e => setAllowances(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الخصومات (-)</Label>
                    <Input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} />
                  </div>
                </div>`,
`                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label>الأساسي</Label>
                    <Input type="number" value={baseSal} onChange={e => setBaseSal(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>البدلات (+)</Label>
                    <Input type="number" value={allowances} onChange={e => setAllowances(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>خصومات (-)</Label>
                    <Input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>سلف مستردة (-)</Label>
                    <Input type="number" value={advances} onChange={e => setAdvances(e.target.value)} />
                  </div>
                </div>`
);

// 8. Rename the button to mention "مسير الراتب" instead of "كشف راتب جديد" to match user's term
finance = finance.replace(
`                  <Plus size={14} /> كشف راتب جديد`,
`                  <Plus size={14} /> مسير راتب جديد`
);
finance = finance.replace(
`                <DialogTitle className="font-serif text-lg">كشف راتب موظف</DialogTitle>`,
`                <DialogTitle className="font-serif text-lg">مسير راتب موظف</DialogTitle>`
);


fs.writeFileSync('src/pages/Finance.jsx', finance);
console.log('Finance.jsx updated successfully');
