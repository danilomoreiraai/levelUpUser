from pathlib import Path
import os, shutil
ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
import subprocess,re,json,pathlib,hashlib
G=os.environ.get('AUDIT_GIT', shutil.which('git'))
def git(*a):return subprocess.check_output([G,*a])
patterns={
'private-key':r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
'provider-token':r'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{35,}|AKIA[0-9A-Z]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{15,}|[0-9]{8,12}:[A-Za-z0-9_-]{35})',
'jwt':r'eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}',
'credential-url':r'[a-z]+://[^\s/:@]+:[^\s/@]+@',
'assigned-secret':r'(?i)(?:password|passwd|api[_-]?key|auth[_-]?token|client[_-]?secret|signing[_-]?secret|webhook[_-]?secret)\s*[=:]\s*[\x22\x27][^\x22\x27\n]{4,}[\x22\x27]',
'shell-default':r'\$\{[^}\n]+:-[^}\n]+\}',
}
objects=git('rev-list','--objects','--all').decode().splitlines(); candidates=[]; n=0
for entry in objects:
 oid,_,path=entry.partition(' ')
 if not path:continue
 if git('cat-file','-t',oid).strip()!=b'blob':continue
 data=git('cat-file','blob',oid)
 if b'\x00' in data:continue
 n+=1
 text=data.decode('utf8',errors='replace')
 for label,pat in patterns.items():
  for m in re.finditer(pat,text):candidates.append({'object':oid,'file':path,'line':text[:m.start()].count('\n')+1,'rule':label,'fingerprint':hashlib.sha256(m.group().encode()).hexdigest()[:12]})
bundle=[]
for p in pathlib.Path('dist').rglob('*'):
 if p.is_file() and p.suffix in ['.js','.html','.json','.css']:
  text=p.read_text(errors='replace');hits=[]
  for label,pat in patterns.items():
   if re.search(pat,text):hits.append(label)
  bundle.append({'file':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'rules':hits})
result={'commit':git('rev-parse','HEAD').decode().strip(),'commits':len(git('rev-list','--all').splitlines()),'shallow':git('rev-parse','--is-shallow-repository').decode().strip(),'text_blobs':n,'candidates':candidates,'bundle':bundle}
pathlib.Path('docs/security-audit/scan-results.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='bundle'},indent=2));print('bundle files',len(bundle),'hits',[(x['file'],x['rules']) for x in bundle if x['rules']])
