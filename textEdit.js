document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("nameInput");
  const saveBtn = document.getElementById("saveBtn");
  const alertElem = document.getElementById("alert");
  
  // Obscured banned words list using Base64 encoding.
  // Each entry here is the Base64 encoded version of a banned word.
  const encodedBannedWords = [
    "ZnVjaw==",
    "c2hpdA==",
    "Yml0Y2g=", 
    "Y3VudA==", 
    "ZGljayA=", 
    "cHVzc3k=",
    "Tm9ydGU=",
    "dHJvaWQ=",
    "d2lsbHk=",
    "cHVk",
    "cHViaWNsaWNl",
    "d2hpdGV3YXNoaW5n",
    "QnJpdA==",
    "YypudA==",
    "Zipjaw==",
    "ZDFjaw==",
    "RDFjaw==",
    "RGljaw==",
    "RGlDaw==",
    "bmlnZ2Vy",
    "TmlnZ2Vy",
    "bjFnR2Vy",
    "ZEljaw==",
    "ZGljSw==",
    "ZCFjaw==",
    "ZCpjaw==",
    "cHNzeQ==",
    "cHVzeQ==",
    "cHVzeXk=",
    "cHVzc3N5",
    "cHB1c3N5",
    "IHJldGFyZA==",
    "cjN0YXJk",
    "UjN0YXJk",
    "cjNUYXJk",
    "biFnZ2E=",
    "bmdnZXI=",
    "bmdy",
    "a2lsbA==",
    "ayFsbA==",
    "SzFsbA==",
    "a0lsbA==",
    "SzFMbA==",
    "a2lMbA==",
    "S2lsbA==",
    "ZDNhdGg=",
    "RGVhdGg=",
    "ZEVhdGg=",
    "RGVBdGg=",
    "REVBVEg=",
    "TklHR0VS",
    "TklHR0E=",
    "UkVUQVJERUQ=",
    "UkVUQVJE",
    "cjNUYXJk",
    "UjN0YXJkM2Q=",
    "ZG9wZQ==",
    "ZCpwZQ==",
    "YXNzZnVjaw==",
    "Y3VudGZ1Y2tlcg==",
    "bmlnZ2Vycw==",
    "bmlnZ2VyaG9sZQ==",
    "bmlnZ2Vy",
    "YmFsbGxpY2tlcg==",
    "bmxnZ2Vy",
    "cG9yY2htb25rZXk=",
    "UG9yY2gtbW9ua2V5",
    "Y3VudA==",
    "YXNzd2hvcmU=",
    "ZnVjaw==",
    "YXNzam9ja2V5",
    "RG90aGVhZA==",
    "YmxhY2tz",
    "Y3VtcXVlZW4=",
    "ZmF0ZnVja2Vy",
    "SmlnYWJvbw==",
    "amlnZ2Fibw==",
    "bmxnZ29y",
    "c25vd25pZ2dlcg==",
    "U3BlYXJjaHVja2Vy",
    "VGltYmVyLW5pZ2dlcg==",
    "c2hpdG5pZ2dlcg==",
    "YXNzbGljaw==",
    "c2hpdGhlYWQ=",
    "YXNzaG9sZQ==",
    "YXNzaG9sZQ==",
    "Y3VudGxpY2tlcg==",
    "a3VudA==",
    "c3BhZ2hldHRpbmlnZ2Vy",
    "VG93ZWwtaGVhZA==",
    "Q2hlcm5vemhvcHk=",
    "YXNzbGlja2Vy",
    "Qmx1ZWd1bQ==",
    "dHdhdA==",
    "QUJDRA==",
    "Yml0Y2hzbGFw",
    "YnVsbGR5a2U=",
    "Y2hvYWQ=",
    "Y3Vtc2hvdA==",
    "ZmF0YXNz",
    "amlnZ2Vy",
    "a3lrZQ==",
    "Y3Vtc2tpbg==",
    "YXNpYW4=",
    "YXNzY293Ym95",
    "YXNzbXVuY2hlcg==",
    "YmFuZ2luZw==",
    "QnVycmhlYWQ=",
    "Q2FtZWwtSm9ja2V5",
    "Y29vbg==",
    "Y3JvdGNocm90",
    "Y3VtZmVzdA==",
    "ZGlja2xpY2tlcg==",
    "ZmFn",
    "ZmFnb3Q=",
    "ZmVsYXRpbw==",
    "ZmF0ZnVjaw==",
    "Z29sZGVuc2hvd2Vy",
    "aG9yZQ==",
    "amFja29mZg==",
    "amlnZw==",
    "amlnZ2E=",
    "aml6anVpY2U=",
    "aml6bQ==",
    "aml6",
    "amlnZ2Vy",
    "aml6emlt",
    "a3VtbWluZw==",
    "a3VuaWxpbmd1cw==",
    "TW9vbGlueWFu",
    "bW90aGVyZnVja2luZw==",
    "bW90aGVyZnVja2luZ3M=",
    "cGh1aw==",
    "U2hlYm9vbg==",
    "c2hpdGZvcmJyYWlucw==",
    "c2xhbnRleWU=",
    "c3BpY2s=",
    "ZnV1Y2s=",
    "YW50aW5pZ2dlcg==",
    "YXBlcmVzdA==",
    "QW1lcmljb29u",
    "QUJD",
    "QXVudC1KZW1pbWE=",
    "cXVlZXI=",
    "YW5hbA==",
    "YXNzcGlyYXRl",
    "YWRkaWN0",
    "Yml0Y2g=",
    "YXNz",
    "QnVkZGhhaGVhZA==",
    "Y2hvZGU=",
    "cGh1a2luZw==",
    "cGh1a2tpbmc=",
    "YmFzdGFyZA==",
    "YnVsbGRpa2U=",
    "ZHJpcGRpY2s=",
    "YXNzYXNzaW5hdGlvbg==",
    "QS1yYWI=",
    "QnVja3Jh",
    "Ym9vdHljYWxs",
    "YXNzaG9sZXM=",
    "YXNzYmFnZ2Vy",
    "Y2hlZXNlZGljaw==",
    "Y29vdGVy",
    "Y3Vt",
    "Y3VtcXVhdA==",
    "Y3VubmlsaW5ndXM=",
    "ZGF0bmlnZ2E=",
    "ZGVlcHRocm9hdA==",
    "ZGljaw==",
    "ZGlja2ZvcmJyYWlucw==",
    "ZGlja2JyYWlu",
    "ZGlja2xlc3M=",
    "ZGlrZQ==",
    "ZGlkZGxl",
    "ZGl4aWVkeWtl",
    "RXNraW1v",
    "ZmFubnlmdWNrZXI=",
    "ZmF0c28=",
    "ZmNrY3Vt",
    "R29sbGl3b2c=",
    "R295aW0=",
    "aG9tb2JhbmdlcnM=",
    "aG9vdGVycw==",
    "SW5kb2duZXNpYWw=",
    "SW5kb25lc2lhbA==",
    "amV3",
    "amlqamlib28=",
    "a25vY2tlcnM=",
    "a3VtbWVy",
    "bW90aGFmdWNrYQ==",
    "bW9vbmNyaWNrZXQ=",
    "TW9vbi1Dcmlja2V0",
    "T3Zlbi1Eb2RnZXI=",
    "UGVja2Vyd29vZA==",
    "cGh1a2Vk",
    "cGljY2FuaW5ueQ==",
    "cGljYW5pbm55",
    "cGh1cQ==",
    "UG9sb2Nr",
    "cG9vcndoaXRldHJhc2g=",
    "cHJpY2s=",
    "cHU1NXk=",
    "UHNoZWs=",
    "c2x1dA==",
    "aml6enVt",
    "Y3VudGV5ZWQ=",
    "U3BpYw==",
    "U3dhbXAtR3VpbmVh",
    "c3R1cGlkZnVja2Vy",
    "c3R1cGlkZnVjaw==",
    "dGl0ZnVjaw==",
    "VHdpbmtpZQ==",
    "Y29jaw==",
    "QWJlZWQ=",
    "YW5hbGFubmll",
    "YXNzaG9yZQ==",
    "QmVhbmVy",
    "Qm9vdGxpcA==",
    "QnVyci1oZWFk",
    "YnV0dGZ1Y2tlcg==",
    "YnV0dC1mdWNrZXI=",
    "VW5jbGUtVG9t",
    "Y29ja3Ntb2tlcg==",
    "QWZyaWNvb24=",
    "QW1lcmlLS0t1bnQ=",
    "YW50aWZhZ2dvdA==",
    "YXNza2xvd24=",
    "YXNzcHVwcGllcw==",
    "YmxhY2ttYW4=",
    "amlzbQ==",
    "Ymx1bXBraW4=",
    "cmV0YXJk",
    "R3Jpbmdv",
    "ZG91Y2hlYmFn",
    "UGllZmtl",
    "YXJlb2xh",
    "YmFja2Rvb3JtYW4=",
    "QWJiaWU=",
    "YmlnYnV0dA==",
    "YnV0dGZhY2U=",
    "Y3VtYnViYmxl",
    "Y3VtbWluZw==",
    "RGVnbw==",
    "ZG9uZw==",
    "ZG9nZ3lzdHlsZQ==",
    "ZG9nZ2llc3R5bGU=",
    "ZXJlY3Rpb24=",
    "ZmVjZXM=",
    "Z29kZGFtbmVk",
    "Z29uemFnYXM=",
    "R3JlYXNlcg==",
    "R3JlYXNlYmFsbA==",
    "aGFuZGpvYg==",
    "SGFsZi1icmVlZA==",
    "aG9ybmV5",
    "amloYWQ=",
    "a3VtcXVhdA==",
    "TGVibw==",
    "TW9za2Fs",
    "TW91bnRhaW4tVHVyaw==",
    "bm9mdWNraW5nd2F5",
    "b3JnaWVz",
    "b3JneQ==",
    "cGVja2Vy",
    "cG9vbnRhbmc=",
    "cG9vbg==",
    "UG9sZW50b25l",
    "cHU1NWk=",
    "c2hpdGZ1Y2s=",
    "c2hpdGVhdGVy",
    "c2hpdGRpY2s=",
    "c2x1dHM=",
    "c2x1dHQ=",
    "TWFuZ2Fs",
    "SHltaWU=",
    "c3RpZmZ5",
    "dGl0ZnVja2Vy",
    "dHdpbms=",
    "YXNzcGFja2Vy",
    "YmFyZWx5bGVnYWw=",
    "YmVhbmVy",
    "Qm96Z29y",
    "YnVtZnVjaw==",
    "c2hpdCBmb3IgYnJhaW5z",
    "YnV0Y2hkeWtl",
    "YnV0dC1mdWNrZXJz",
    "YnV0dHBpcmF0ZQ==",
    "Y2FtZWxqb2NrZXk=",
    "Q2FyY2FtYW5v",
    "Q2hhbmtvcm8=",
    "Q2hvYy1pY2U=",
    "Q2h1Zw==",
    "Q2lhcGF0eS1vci1jaWFwYWs=",
    "Q2luYQ==",
    "Y29ja3N1Y2Vy",
    "Y3JhY2t3aG9yZQ==",
    "Qm91Z25vdWxl",
    "dW5mdWNrYWJsZQ==",
    "QWZyaWNvb24tQW1lcmljb29u",
    "QWZyaWNvb25pYQ==",
    "QW1lcmljdW50",
    "YXBlc2F1bHQ=",
    "QXNzYnVyZ2Vycw==",
    "ZnVja3RhcmRlZG5lc3M=",
    "c2hlZXBmdWNrZXI=",
    "V3VoYW4tdmlydXM=",
    "V2V0YmFjaw==",
    "QXNlbmc=",
    "YnVtYmxlZnVjaw==",
    "ZmFzdGZ1Y2s=",
    "aXRjaA==",
    "bml6emxl",
    "T3JpZW50YWw=",
    "Y2lzZ2VuZGVy",
    "YmFsbHNhY2s=",
    "cGVuaXM=",
    "emlnYWJv",
    "QnVsZQ==",
    "YnJlYXN0bWFu",
    "Ym91bnR5YmFy",
    "Qm91bnR5LWJhcg==",
    "Ym9uZGFnZQ==",
    "Ym9tYmluZw==",
    "YnVsbHNoaXQ=",
    "YXNzZXM=",
    "Y2FuY2Vy",
    "Y3VuaWxpbmd1cw==",
    "Y3VtbWVy",
    "ZGlja2xpY2s=",
    "ZWphY3VsYXRpb24=",
    "ZmFlY2Vz",
    "ZmFpcnk=",
    "aG9lcw==",
    "aWRpb3Q=",
    "TGFvd2Fp",
    "TGVi",
    "bXVmZg==",
    "bXVmZmRpdmU=",
    "T3Jlbw==",
    "b3JnYXNt",
    "b3JnYXNpbQ==",
    "b3NhbWE=",
    "cGVlcHNob3c=",
    "UGV0cm9sLXNuaWZmZXI=",
    "cGVydg==",
    "cHJpY2toZWFk",
    "c2hpdGZpdA==",
    "c3Blcm1iYWc=",
    "c3Vja215dGl0",
    "c3Vja215ZGljaw==",
    "c3Vja215YXNz",
    "c3Vja21l",
    "c3Vja2RpY2s=",
    "WXVvbg==",
    "bW90aGVyZnVja2Vy",
    "Z3JvZQ==",
    "QWxpIEJhYmE=",
    "cmV0YXJkZWQ=",
    "YXNzZnVja2Vy",
    "YXNzbXVuY2g=",
    "YXNzcmFuZ2Vy",
    "QXlyYWI=",
    "YXNzY2xvd24=",
    "YnV0dGZ1Y2s=",
    "YnV0dC1mdWNr",
    "YnV0dG1hbg==",
    "Q2hpbms=",
    "Y29ja3N1Y2tlcg==",
    "Y29vbHk=",
    "Q29vbi1hc3M=",
    "Y3JvdGNobW9ua2V5",
    "Qm9odW5r",
    "Y29ja2Nvd2JveQ==",
    "Y29ja3NtaXRo",
    "Y2F0ZnVja2Vy",
    "ZnVja3RhcmRlZGx5",
    "dHJhbnMtdGVzdGljbGU=",
    "V2lnZ2Vy",
    "d2hpc2tleWRpY2s=",
    "YWJvcmlnaW5hbA==",
    "YXNza2lzc2Vy",
    "d2hpdGVsaXN0",
    "TGF0aW54",
    "eWFtYmFn",
    "Ym9vYg==",
    "YmVlZiBjdXJ0YWlucw==",
    "Y2x1bmdl",
    "YWY=",
    "d29rZW5lc3M=",
    "Yml0Y2hleg==",
    "SWNlYmVyZyBGdWNrZXJz",
    "Wmh5ZA==",
    "YmVsbGVuZA==",
    "YXJzZWhvbGU=",
    "dGF0YXM=",
    "YXNzYXNzaW5hdGU=",
    "Ym9vbmdh",
    "Ym9vYnk=",
    "YnVsbGNyYXA=",
    "ZGVmZWNhdGU=",
    "RGhvdGk=",
    "ZG9wZQ==",
    "aG9ibw==",
    "YmlnYXNz",
    "aHVzc3k=",
    "aWxsZWdhbA==",
    "a3k=",
    "bW9uZXlzaG90",
    "bW9sZXN0b3I=",
    "bm9vbmVy",
    "bm9va2ll",
    "bm9va2V5",
    "UGFsZWZhY2U=",
    "cGFuc3k=",
    "cGVlaG9sZQ==",
    "cGhvbmVzZXg=",
    "cGVyaW9k",
    "cG9ybmtpbmc=",
    "cG9ybmZsaWNr",
    "cG9ybg==",
    "cG9vcGVy",
    "c2V4d2hvcmU=",
    "c2hpdGZhY2U=",
    "c2hpdA==",
    "c2xhdg==",
    "c2xpbWViYWxs",
    "c25pZ2dlcnM=",
    "c25vd2JhY2s=",
    "c3Blcm1oZXJkZXI=",
    "c3Bhbmt0aGVtb25rZXk=",
    "c3BpdHRlcg==",
    "c3RyYXBvbg==",
    "VGFjb2hlYWQ=",
    "c3Vja29mZg==",
    "dGl0Yml0bmlwcGx5",
    "VHVyY28tQWxiYW5pYW4=",
    "dHJhbm55",
    "dHJhbm5pZQ==",
    "emhpZG92a2E=",
    "emhpZA==",
    "QmFrcmE=",
    "QWZybyBlbmdpbmVlcmluZw==",
    "QWggQ2hhaA==",
    "YWxsaWdhdG9yYmFpdA==",
    "YXJhYnM=",
    "QXJhYnVzaA==",
    "QXNoa2UtTmF6aQ==",
    "YXNzYmxhc3Rlcg==",
    "YXNzbW9ua2V5",
    "YmFkZnVjaw==",
    "YmF6b25nYXM=",
    "YmVhdG9mZg==",
    "YmF6b29tcw==",
    "QmFsaWph",
    "YnVuZ2hvbGU=",
    "YnV0Y2hkaWtl",
    "YnV0dGZhY2tlcnM=",
    "Qm9jaGU=",
    "YnV0dGJhbmc=",
    "YnV0dC1iYW5n",
    "YnV0dG11bmNo",
    "Q2hhcmxpZQ==",
    "Y2hhdg==",
    "Q2hpbmFtYW4=",
    "Y29sb3VyZWQ=",
    "Ym9vbmc=",
    "YnV0Y2hiYWJlcw==",
    "Y2xpdA==",
    "Y29ja2tub2I=",
    "Y29ja3N1Y2tpbmc=",
    "Y29ja3RlYXNl",
    "Q29raW4=",
    "YW5jaG9yLWJhYnk=",
    "Y3Vtc29jaw==",
    "ZmlzdGluZw==",
    "ZnVjay15b3U=",
    "RnJpdHppZQ==",
    "dHJhbnNnZW5kZXJlZA==",
    "V2hpdGUtdHJhc2g=",
    "d2hpdGV0cmFzaA==",
    "d2hvcA==",
    "d3Rm",
    "VmF0bmlr",
    "d2VsZmFyZSBxdWVlbg==",
    "YXNzbWFu",
    "YmxhY2s=",
    "R3lvcG8=",
    "Z29kZGFt",
    "bWluZ2U=",
    "cHVuYW5p",
    "ZG91Y2hl",
    "ZG9vZnVz",
    "bXVudGVy",
    "bW9yb24=",
    "YmFsbGdhZw==",
    "ZmVtc3BsYWluaW5n",
    "YXNzbG92ZXI=",
    "bG9vbmV5",
    "Qm9vbmdh",
    "ZmF0",
    "aG9tb3NleHVhbA==",
    "dHVyZA==",
    "emh5ZG92a2E=",
    "ZWZmaW5n",
    "bWluZ2Vy",
    "ZHVsbGFyZA==",
    "YnVnZ2VyeQ==",
    "YnJlYTV0",
    "Ym9vbmc=",
    "YWRkaWN0ZWQ=",
    "ZGVtb24=",
    "ZGV2aWx3b3JzaGlwcGVy",
    "ZGV0aA==",
    "ZGVzdHJveQ==",
    "ZG9vLWRvbw==",
    "ZG9vZG9v",
    "ZXNjb3J0",
    "ZmFydGluZw==",
    "ZmFpcmllcw==",
    "aHVza3k=",
    "aW5jZXN0",
    "SHVua3k=",
    "amlnZ3k=",
    "bGFpZA==",
    "bW9sZXN0ZXI=",
    "TXp1bmd1",
    "bmlnZ2xpbmdz",
    "bmlnZ2xpbmc=",
    "bmlnZ2xlcw==",
    "cGVlLXBlZQ==",
    "cGk1NQ==",
    "cGh1bmdreQ==",
    "cG9ybm8=",
    "cG9vcGluZw==",
    "cHJvc3RpdHV0ZQ==",
    "cHJvcw==",
    "c2V4c2xhdmU=",
    "c2V4dG9nbw==",
    "c2hhZw==",
    "c2hpdGhhcHBlbnM=",
    "c2hpdGhhcGVucw==",
    "c2hpdGZ1bGw=",
    "c2hpdGNhbg==",
    "c2hpbm9sYQ==",
    "c2xhdmVkcml2ZXI=",
    "c2xlZXplYmFsbA==",
    "c3Blcm1oZWFyZGVy",
    "c3dhc3Rpa2E=",
    "c2hpdHM=",
    "dHJvdHM=",
    "dHJpc2V4dWFs",
    "dHdvYml0d2hvcmU=",
    "TXVudA==",
    "Z2FuZ3N0YQ==",
    "QWJv",
    "YWRkaWN0cw==",
    "QWxsaWdhdG9yIGJhaXQ=",
    "YW5hbHNleA==",
    "UmVkc2tpbg==",
    "R3lwc3k=",
    "QW5nIG1v",
    "QXBl",
    "YXJhYg==",
    "QXJhdnVzaA==",
    "QXJtbw==",
    "YXJzZQ==",
    "YXNzY2xvd24=",
    "YXNzd2lwZQ==",
    "QmVhbmV5",
    "YmVhdHlvdXJtZWF0",
    "YmlnYmFzdGFyZA==",
    "Yml0Y2hlcw==",
    "Qm9ndHJvdHRlcg==",
    "YnVuZw==",
    "YmVhdmVy",
    "YmVzdGlhbA==",
    "Ym9nYW4=",
    "Q2FiYmFnZS1FYXRlcg==",
    "Y2FycGV0bXVuY2hlcg==",
    "Y2FycnV0aA==",
    "Y29ja2xvdmVy",
    "Y29ja3JpZGVy",
    "Y29ybmhvbGU=",
    "Ym9sbG9jaw==",
    "Qm9nLUlyaXNo",
    "Y2hpbmFtZW4=",
    "Y2xhbWRpZ2dlcg==",
    "Y2xhbWRpdmVy",
    "ZHdhcmY=",
    "Y2FrZXdhbGs=",
    "ZnR3",
    "Zm1s",
    "aGFuZGljYXBwZWQ=",
    "Y2F3aw==",
    "Y2FycGV0LW11bmNoZXI=",
    "ZnV6enktaGVhZGVk",
    "ZnVsbC1ibG9vZA==",
    "ZnVja2l0eS1ieWU=",
    "ZnJvZ2Vzcw=="

  ];
  
  // Decode the list at runtime to get the actual banned words
  const bannedWords = encodedBannedWords.map(word => atob(word));
  
  // Function to check for banned words in the input text
  function containsBannedWord(text) {
    const lowerText = text.toLowerCase();
    return bannedWords.some(word => lowerText.includes(word));
  }

  
  
  // Load saved name if it exists
  chrome.storage.local.get("username", (data) => {
    if (data.username) {
      input.value = data.username;
    }
  });
  
  // Save name on button click with filtering
  saveBtn.addEventListener("click", () => {
    const name = input.value;
  
    // Check if the input contains any banned words
    if (containsBannedWord(name)) {
      alertElem.textContent = "The name you entered is prohibited or contains explicit material.";
      alertElem.style.color = "red";
      setTimeout(() => {
        alertElem.textContent = "";
        alertElem.style.color = "lightGreen";
      }, 3500);
      return; // Stop further processing
    }
  
    // Save the name if it passes the filter
    chrome.storage.local.set({ username: name }, () => {
      if(name === "Ms. Madrid" || name === "Victor" || name === "victor" || name === "Niso" || name === "niso") {
        alertElem.textContent = "Hi " + name + ". - From Devin :)";
        setTimeout(() => {
          alertElem.textContent = "";
        }, 3500);
      } else {
      alertElem.textContent = "Name saved. Hello, " + name + "!";
      setTimeout(() => {
        alertElem.textContent = "";
      }, 3500);
    }
    });
  });
  

    const open = document.querySelector("#openPersonalInfo"); 
    const div = document.querySelector("#PersonalInfo");
    const img = document.querySelector("#PersonalInfoImg");

    if (!open || !div) {
        console.error("Button or div not found!");
        return;
    }

    open.addEventListener("click", () => {
      if (div.classList.contains("PersonalInfoHidden")) {

        img.classList.add("PIIOpen");
        img.classList.remove("PIIClosed");

        div.classList.remove("PersonalInfoHidden");
        div.classList.add("PersonalInfoShowing");
      } else {
        img.classList.add("PIIClosed");
        img.classList.remove("PIIOpen");

        div.classList.remove("PersonalInfoShowing");
        div.classList.add("PersonalInfoHidden");
      }
    });
  });

  // END OF TEXT EDIT --

  // START OF HOVER SCRIPT (APPEARANCE) --
  const par = document.getElementById("AppearanceH");
  const info = document.getElementById("AppearanceP");