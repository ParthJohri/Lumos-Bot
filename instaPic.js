const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function downloadImageFromUrl(imageUrl, destinationPath) {
  const response = await axios({
    method: "GET",
    url: imageUrl,
    responseType: "stream",
  });

  const writer = fs.createWriteStream(destinationPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function getImageUrlFromInstagramPost(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const imageUrl = $('meta[property="og:image"]').attr("content");
    return imageUrl;
  } catch (error) {
    console.error("Error retrieving image URL:", error);
    return null;
  }
}

async function downloadAndSaveImage(url) {
  try {
    const imageUrl = await getImageUrlFromInstagramPost(url);
    if (imageUrl) {
      await downloadImageFromUrl(imageUrl, "downloads/groupPic.jpg");
      console.log("Image downloaded successfully!");
      return "downloads/groupPic.jpg"; // Return the path of the downloaded image
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = {
  downloadAndSaveImage,
  getImageUrlFromInstagramPost,
};
