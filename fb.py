import youtube_dl
import sys

arguments = sys.argv[1:]  # Exclude the script name
# Provide the Facebook video URL
video_url = arguments[0];

# Set the options for downloading
options = {
    'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    'outtmpl': 'downloads/fbvideo.mp4'
}

# Create a youtube_dl.YoutubeDL instance and download the video
with youtube_dl.YoutubeDL(options) as ydl:
    ydl.download([video_url])
