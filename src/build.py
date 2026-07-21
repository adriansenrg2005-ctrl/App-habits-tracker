# -*- coding: utf-8 -*-
"""Construye index.html a partir de src/. Se ejecuta solo en GitHub Actions."""
import glob, os
base = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(base,'template.html'), encoding='utf-8').read()
css = ''.join(open(p, encoding='utf-8').read() for p in sorted(glob.glob(os.path.join(base,'styles','*.css'))))
js  = ''.join(open(p, encoding='utf-8').read() for p in sorted(glob.glob(os.path.join(base,'js','*.js'))))
out = tpl.replace('/*__CSS__*/', css.rstrip('\n')).replace('//__JS__', js.rstrip('\n'))
open(os.path.join(base,'..','index.html'),'w',encoding='utf-8').write(out)
print('index.html generado:', len(out), 'caracteres')
