import json,base64,sys
from pathlib import Path
r=json.loads(Path('test-results/results.json').read_text());out=[]
for s in r['suites']:
 for spec in s['specs']:
  for test in spec['tests']:
   for result in test['results']:
    out.append({'test':spec['title'],'status':result['status'],'durationMs':result['duration'],'attachments':[{ 'name':a['name'],'text':base64.b64decode(a['body']).decode()} for a in result['attachments'] if 'body' in a], 'errors':result.get('errors',[])})
Path(sys.argv[1]).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
