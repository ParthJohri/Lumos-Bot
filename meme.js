const axios = require("axios");

async function freshMeme() {
  let subReddit = await getSubReddit();
  let meme = await getMeme(subReddit);
  console.log(meme);
  async function getSubReddit() {
    let memeSubs = [
      "blackpeopletwitter",
      "metal_me_irl",
      "bee_irl",
      "coaxedintoasnafu",
      "195",
      "shittyadviceanimals",
      "wholesomememes",
      "dankmemes",
      "memes",
      "Dogfort",
      "vertical",
      "AdviceAnimals",
      "fffffffuuuuuuuuuuuu",
      "treecomics",
    ];

    let randomSub = randomNumber(memeSubs.length);
    let subReddit = memeSubs[randomSub];
    return subReddit;
  }

  async function getMeme(subReddit) {
    try {
      const options = {
        method: "GET",
        url: `https://www.reddit.com/r/${subReddit}/hot.json?limit=100`,
      };
      const response = await axios.request(options);
      let randomMeme = randomNumber(100);
      let post = response.data.data.children[randomMeme].data;
      let link = post.url;
      let checkUrl = linkChecker(link);
      let memeLink = checkUrl ? "image" : "not an image";

      let nsfw = nsfwChecker(post);
      let memeNsfw = nsfw ? "nsfw" : "sfw";

      let memeTitle = post.title;
      let memeImg = post.url;

      return {
        title: memeTitle,
        img: memeImg,
        nsfw: memeNsfw,
        link: memeLink,
      };
    } catch (error) {
      console.error(error);
    }
  }

  function linkChecker(link) {
    return link.match(/\.(jpeg|jpg|gif|png)$/) !== null;
  }

  function nsfwChecker(post) {
    return post.over_18;
  }

  function randomNumber(num) {
    return Math.floor(Math.random() * num);
  }
  return meme;
}

module.exports = {
  freshMeme: freshMeme,
};
