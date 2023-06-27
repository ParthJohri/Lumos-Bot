const fs = require("fs");
const path = require("path");
const axios = require("axios").default;
const downloadFile = async (fileUrl, downloadFolder) => {
  const fileExtension = path.extname(fileUrl) || ".jpg";
  const fullFileName = "test" + fileExtension;

  const localFilePath = path.resolve(__dirname, downloadFolder, fullFileName);
  try {
    const response = await axios({
      method: "GET",
      url: fileUrl,
      responseType: "stream",
    });

    const w = response.data.pipe(fs.createWriteStream(localFilePath));
    w.on("finish", () => {
      console.log("Successfully downloaded file!");
    });
  } catch (err) {
    throw new Error(err);
  }
};

// Testing
const IMAGE_URL = "https://images.unsplash.com/photo-1560807707-8cc77767d783";
downloadFile(IMAGE_URL, "downloads");

const VIDEO_URL =
  "https://www.kindacode.com/wp-content/uploads/2021/01/example.mp4";
downloadFile(VIDEO_URL, "download");
