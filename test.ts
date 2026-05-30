const url = "https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=e8dd42e6-9b8b-43f8-991e-b3dee723a52d&limit=2&format=JSON";
fetch(url).then(r=>r.json()).then(console.log).catch(console.error);
