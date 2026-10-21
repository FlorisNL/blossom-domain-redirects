import json
import pathlib
import re
from urllib.parse import quote

root = pathlib.Path(__file__).parent
source = root.joinpath('worker.mjs').read_text(encoding='utf-8')
exact = json.loads(re.search(r'const exact = new Map\((.*?)\);\n', source, re.S).group(1))
fallback = json.loads(re.search(r'const fallback = (.*?)\.map', source, re.S).group(1))
rules = [('^' + re.escape(path) + '/?$', target) for path, target in exact] + fallback
items = {}

def add(path, target, subpath=False, suffix=False):
    source = 'blossomanalysis.com' + quote(path, safe='/%:@-._~!$&\'()*+,;=')
    value = {'source_url': source, 'target_url': quote(target, safe=':/%?=&@-._~!$\'()*+,;'), 'status_code': 301,
             'include_subdomains': True, 'subpath_matching': subpath, 'preserve_path_suffix': suffix, 'preserve_query_string': True}
    if source in items:
        # Exact legacy destinations take precedence over section fallbacks.
        return
    items[source] = {'redirect': value}

for pattern, target in rules[:4681]:
    path = re.sub(r'\\(.)', r'\1', pattern[1:-3])
    add(path, target)
    add(path+'/', target)

for pattern, target in rules[4681:]:
    if pattern in ('^/(.+)/feed/?$', '^/(.+)/page/[0-9]+/?$'):
        continue
    if pattern in ('^/$', '^/.+$'):
        add('/', 'https://www.moreblossom.com/', True)
    elif '(.*)' in pattern:
        add(pattern[1:pattern.index('(.*)')], target.replace('$1', ''), True, True)
    elif pattern.endswith('/?$'):
        path = pattern[1:-3]
        add(path, target)
        add(path+'/', target)
    else:
        add(pattern[1:], target, True)

host = '(http.host eq "blossomanalysis.com" or ends_with(http.host, ".blossomanalysis.com"))'
prior = ['topic','companies','people','patents','podcasts','product','product_cat','author']
exclude = 'not ('+' or '.join('starts_with(http.request.uri.path, "/'+p+'/")' for p in prior)+')'
single = []
def single_rule(ref, expression, target, dynamic=False):
    single.append({'ref':ref,'description':ref.replace('_',' '),'expression':host+' and '+expression,'action':'redirect',
      'action_parameters':{'from_value':{'target_url':{('expression' if dynamic else 'value'):target},'status_code':301,'preserve_query_string':True}}})

# Retired executable endpoints redirect to the current homepage; no PHP or Worker is involved.
wp = ' or '.join('(lower(http.request.uri.path) eq "/'+p+'" or starts_with(lower(http.request.uri.path), "/'+p+'/"))' for p in ['wp-admin','wp-login.php','wp-includes','wp-content','wp-cron.php','xmlrpc.php'])
single_rule('retired_wordpress_endpoints', '('+wp+')', 'https://www.moreblossom.com/')
single_rule('legacy_search', '(http.request.uri.path eq "/" and starts_with(http.request.uri.query, "s=") and not (http.request.uri.query contains "&") and len(http.request.uri.query) gt 2)', 'https://www.moreblossom.com/database')
for trailing in [True, False]:
    pattern = '/*/feed'+('/' if trailing else '')
    single_rule('legacy_feed'+('_slash' if trailing else ''), exclude+' and http.request.uri.path strict wildcard '+json.dumps(pattern),
        'wildcard_replace(http.request.uri.path, '+json.dumps(pattern)+', "https://www.moreblossom.com/${1}")', True)
for trailing in [True, False]:
    pattern = '/*/page/*'+('/' if trailing else '')
    single_rule('legacy_pagination'+('_slash' if trailing else ''), exclude+' and not (http.request.uri.path strict wildcard "/*/feed" or http.request.uri.path strict wildcard "/*/feed/") and http.request.uri.path strict wildcard '+json.dumps(pattern),
        'wildcard_replace(http.request.uri.path, '+json.dumps(pattern)+', "https://www.moreblossom.com/${1}")', True)

plan = {'items':list(items.values()),'singleRules':single}
assert len(items) <= 10000
root.joinpath('native-redirect-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'bulkItems':len(items),'singleRules':len(single)}))
