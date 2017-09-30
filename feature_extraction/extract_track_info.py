import json

with open('track_info.json') as json_file:
  print()
  json_str = json_file.read()
  json_dict = json.loads(json_str)
  for item in json_dict.items():
  	print(item[1])
  print()