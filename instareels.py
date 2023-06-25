from instascrape import Reel

import datetime

# session id
SESSIONID = "58161769268%3APVKGsXXTs1S83i%3A3%3AAYe5LcJ0po7tbLxCJylJH4kByP6BCxpTZG2tvU-YWA"
# Header with session id
headers = {
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)\
	AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.74 \
	Safari/537.36 Edg/79.0.309.43",
	"cookie": f'sessionid={SESSIONID};'
}

# Passing Instagram reel link as argument in Reel Module
insta_reel = Reel(
	'https://www.instagram.com/reel/CtCASKZpoIw/?utm_source=ig_web_copy_link&igshid=MzRlODBiNWFlZA==')

# Using scrape function and passing the headers
insta_reel.scrape(headers=headers)

insta_reel.download(fp=f"/Users/parthjohri/Dropbox/My Mac (Parths-MacBook-Air.local)/Documents/GitHub/whatsapp-bot/downloads/ig.mp4")

upload_date = datetime.datetime.fromtimestamp(insta_reel.timestamp)

# printing success Message
print('Downloaded Successfully.')
