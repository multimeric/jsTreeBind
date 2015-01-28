# -*- coding: utf-8 -*-
import json

dict = {
	"NE": [],
	"NW": [],
	"SE": [],
	"SW": []
}

with open("Moon.csv", "r") as file, open("moon.out.csv", "wb") as out:
	for line in file:
		if "°E" in line:
			if "°N" in line:
				dict["NE"].append(line.split("\t")[0])
			elif "°S" in line:
				dict["SE"].append(line.split("\t")[0])
		elif "°W" in line:
			if "°N" in line:
				dict["NW"].append(line.split("\t")[0])
			elif "°S" in line:
				dict["SW"].append(line.split("\t")[0])
				
	out.write(unicode(json.dumps(dict)))