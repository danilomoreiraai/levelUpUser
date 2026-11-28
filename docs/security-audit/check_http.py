from pathlib import Path
import os, shutil
ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
import subprocess,os,time,http.client,json
p=subprocess.Popen([os.environ.get('AUDIT_NODE', shutil.which('node')),'scripts/serve.mjs'],env={**os.environ,'PORT':'43197'},stdout=subprocess.DEVNULL)
results=[]
try:
 time.sleep(.5)
 for method,path,expected in [('GET','/',200),('HEAD','/',200),('POST','/links',405),('PATCH','/links/example/access',405),('DELETE','/links/example',405),('GET','/assets/missing.js',404),('GET','/%2e%2e%2fpackage.json',400),('GET','/%ZZ',404),('GET','/unknown?x=%3Cscript%3Ealert(1)%3C/script%3E',200)]:
  c=http.client.HTTPConnection('127.0.0.1',43197);c.request(method,path);r=c.getresponse();body=r.read();results.append({'method':method,'path':path,'expected':expected,'actual':r.status,'pass':r.status==expected,'payload_reflected':b'<script>alert(1)</script>' in body});c.close()
finally:p.terminate();p.wait()
open('docs/security-audit/http-checks.json','w').write(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
