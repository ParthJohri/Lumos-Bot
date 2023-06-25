import sys
import json
from moviepy.editor import VideoFileClip

print("hi");
video_path = "/Users/parthjohri/Dropbox/My Mac (Parths-MacBook-Air.local)/Documents/GitHub/whatsapp-bot/downloads/video.mp4"
whatsapp_video_path = "downloads/ytvideo.mp4"
video_clip = VideoFileClip(video_path)
video_clip.write_videofile(whatsapp_video_path, codec="libx264", audio_codec="aac")

# Print success message
print("Video downloaded and converted successfully!")

resp = {
    "Response":200,
    "Message":"Data from python file",
}
print(json.dumps(resp))
sys.stdout.flush()
