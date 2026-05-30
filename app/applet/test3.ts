fetch('https://data.gov.tw/dataset/40448').then(r=>r.text()).then(t=>{ 
    const m = t.match(/https?:\/\/[^\s"'<>\\]+/ig); 
    if(m) console.log(m.filter(u => u.includes('json') || u.includes('moenv')).join('\n')); 
})
