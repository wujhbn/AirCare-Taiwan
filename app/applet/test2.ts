const url = "https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=ce04b123-c5eb-42f0-97d8-111451f28681&limit=2&format=JSON";
fetch(url).then(r=>r.text()).then(t => console.log("TEXT: ", t.substring(0, 100))).catch(console.error);
