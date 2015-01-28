# -*- coding: utf-8 -*-
import json
import codecs

dict = {}

with codecs.open("earth.txt", "r", encoding='utf-8') as infile, codecs.open("earth.out.csv", "wb", encoding='utf-8') as out:
	for line in infile:
		name, country = line.split("\t")
		if country not in dict:
			dict[country] = []
		dict[country].append(name)
				
	out.write(unicode(json.dumps(dict, ensure_ascii=False)))