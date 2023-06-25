import sys
import json
import requests

arguments = sys.argv[1:]  # Exclude the script name
name = arguments[0];
url = f"https://api.genderize.io?name={name}";
r= requests.get(url)
data = r.json()

resp = {
    "Response":200,
    "Message":"Data from python file",
    "Data":data
}
print(json.dumps(resp))
sys.stdout.flush()