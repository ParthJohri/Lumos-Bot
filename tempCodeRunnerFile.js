// * To downlod the youtube video from the URL
const fs = require("fs");
const ytdl = require("ytdl-core");
const axios = require("axios");
const path = require("path");
const cheerio = require("cheerio");
const spawn = require("child_process").spawn;
const sharp = require("sharp");
const linkedIn = require("linkedin-jobs-api");
const { freshMeme } = require("./meme.js");
const { getRandomCompany } = require("./company.js");
const cron = require("node-cron");

// *! To fetch answers from OPEN AI
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
dotenv.config();

class OpenAI {
  constructor(apiKey) {
    // Create the Configuration and OpenAIApi instances
    this.openai = new OpenAIApi(new Configuration({ apiKey }));
  }

  // Asynchronous function to generate text from the OpenAI API
  async generateText(prompt, model, max_tokens, temperature = 0.85) {
    try {
      // Send a request to the OpenAI API to generate text
      const response = await this.openai.createCompletion({
        model,
        prompt,
        max_tokens,
        n: 1,
        temperature,
      });

      console.log(`request cost: ${response.data.usage.total_tokens} tokens`);
      // Return the text of the response
      return response.data.choices[0].text;
    } catch (error) {
      throw error;
    }
  }
}

// *! Open Ai
const OPENAPI_KEY = process.env.OPEN_API_KEY;

const openAI = new OpenAI(OPENAPI_KEY);
const topic = "NodeJs";
const model = "text-davinci-003";

// *!whatsbot
const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  DisconnectReason,
  useMultiFileAuthState,
  MessageType,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");

const store = {};
const getMessage = (key) => {
  const { id } = key;
  if (store[id]) return store[id].message;
};

async function WABot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    getMessage,
  });
  const getText = (message) => {
    try {
      return (
        message.conversation ||
        message.extendedTextMessage.text ||
        message.imageMessage.caption
      );
    } catch {
      return "";
    }
  };
  const sendMessage = async (jid, content) => {
    try {
      const sent = await sock.sendMessage(jid, content);
      store[sent.key.id] = sent;
    } catch (err) {
      console.error("Error sending message: ", err);
    }
  };
  // Store reminders in an array (can be replaced with a database)
  const reminders = [];

  // Add a reminder to the array
  function addReminder(userId, message, reminderTime) {
    reminders.push({ userId, message, reminderTime });
  }

  // Send a reminder message
  function sendReminder(userId, message) {
    const chat = client.getChatById(userId);
    chat.sendMessage(message);
  }

  // Check reminders and send if due
  function checkReminders() {
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour12: false,
    });
    for (const reminder of reminders) {
      if (reminder.reminderTime === currentTime) {
        sendReminder(reminder.userId, reminder.message);
        reminders.splice(reminders.indexOf(reminder), 1);
      }
    }
  }

  // Schedule the checkReminders function to run every minute
  cron.schedule("* * * * *", checkReminders);

  const handleYTDownload = async (msg) => {
    const { key, message } = msg;
    const ss = getText(message);
    const text = ss.trim();
    const s = "@ytd";
    if (!text.toLowerCase().startsWith(s)) return;
    const str = text.slice(s.length + 1);
    const videoURL = str.trim();
    const downloadStream = ytdl(videoURL, { quality: 18 });
    downloadStream
      .pipe(fs.createWriteStream("downloads/video.m4v"))
      .on("finish", () => {
        // File download completed
        console.log("Video downloaded successfully");
        // Read the downloaded video file
        const videoBuffer = fs.readFileSync("downloads/video.m4v");

        // Send the message
        sendMessage(key.remoteJid, {
          video: videoBuffer,
          caption: "Unveiling your cinematic creation, now.",
          mimetype: "video/mp4", // Set the mimetype to specify the video format
        });
      });
  };
  const downloadFile = (fileUrl, downloadFolder) => {
    // Get the file name
    const fileExtension = path.extname(fileUrl) || ".jpg";
    const fullFileName = "groupPic" + fileExtension;

    // The path of the downloaded file on our machine
    const localFilePath = path.resolve(__dirname, downloadFolder, fullFileName);

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(localFilePath);

      const request = axios({
        method: "GET",
        url: fileUrl,
        responseType: "stream",
      });

      request
        .then((response) => {
          response.data.pipe(writeStream);

          writeStream.on("finish", () => {
            console.log("Successfully downloaded file!");
            resolve(localFilePath);
          });

          writeStream.on("error", (error) => {
            console.error("Error occurred while writing the file:", error);
            reject(error);
          });
        })
        .catch((error) => {
          console.error("Error occurred while downloading the file:", error);
          reject(error);
        });
    });
  };

  const handleFbImg = async (msg) => {
    const { key, message } = msg;
    const ss = getText(message);
    const text = ss.trim();
    if (!text.toLowerCase().includes("@fbi")) return;
    const str = text.slice(4);
    const imgURL = str.trim();
    const outputFilePath = "downloads/fbimage.jpeg";
    await downloadImage(imgURL, outputFilePath);
    sendMessage(key.remoteJid, {
      caption: "Unveiling your cinematic creation, now.",
      mimetype: "image/jpeg", // Set the mimetype to specify the video format
    });
  };

  const handleFbVideos = async (msg) => {
    const { key, message } = msg;
    const ss = getText(message);
    const text = ss.trim();
    if (!text.toLowerCase().startsWith("@fb")) return;
    const str = text.slice(3);
    const videoURL = str.trim();
    const pythonProcess = spawn("python3", ["fb.py", videoURL]);
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        // Python process completed successfully
        console.log("Python process completed successfully");
        // Perform further actions here
        const videoBuffer = fs.readFileSync("downloads/fbvideo.mp4");
        // Send the message
        sendMessage(key.remoteJid, {
          video: videoBuffer,
          caption: "Unveiling your cinematic creation, now.",
          mimetype: "video/mp4", // Set the mimetype to specify the video format
        });
      } else {
        // Python process failed
        console.log("Python process failed");
        // Handle the failure case here
      }
    });
  };

  const handleIG = async (msg) => {
    const { key, message } = msg;
    const str = getText(message);
    const text = str.trim();
    if (!text.toLowerCase().startsWith("@igp")) return;
    const URl = text.slice(4);
    const URL = await downloadAndSaveImage(URl);
    const buttonMessage = {
      image: { url: URL },
    };
    const sendMsg = await sock.sendMessage(key.remoteJid, buttonMessage);
  };

  const handleAi = async (msg) => {
    const { key, message } = msg;
    const str = getText(message);
    const text = str.trim();
    if (!text.toLowerCase().startsWith("@ask")) return;
    const topic = text.slice(5);
    // Function to generate the prompt for the OpenAI API
    // In the future, it will be moved to a helper class in the next code review
    const generatePrompt = (topic) => {
      return `Write an blog post about "${topic}", it should in Well Whatsapp formatted format, include 5 unique points, using informative tone.`;
    };
    // Use the generateText method to generate text from the OpenAI API and passing the generated prompt, the model and max token value
    await openAI
      .generateText(generatePrompt(topic), model, 800)
      .then((textOutput) => {
        // Logging the generated text to the console
        // In the future, this will be replaced to upload the returned blog text to a WordPress site using the WordPress REST API
        const trimmedText = textOutput.trimStart().replace(/^\n/, "");
        sendMessage(key.remoteJid, { text: trimmedText }, { quoted: msg });
        console.log(textOutput);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const handleCommand = async (msg) => {
    const { key, message } = msg;
    const str = getText(message);
    const text = str.trim();
    if (!text.toLowerCase().startsWith("@commands")) return;
    const command = `👋 Welcome to the Parth-WBot\n🤖 Your Multi-Purpose Assistant\nThis bot can assist you with various commands. Here are some available commands:

*@commands* - To List all commands

*General Commands*
-----------------------------
*@mirror* - Mirror your text
*@ask* - Ask a question
*@meme* - Get a random meme 
*@company* - Get a MAANG alternative company
*@jobs* - Write the jobType like @jobs software after the command to get the latest job listings 
*@ytd* - Download a YouTube video (provide the video link after the command)
*@fbd* - Download a Facebook video (provide the video link after the command)

*Coding Commands*
-----------------------------
*@lc* - Use this command to get information about upcoming LeetCode contests.
*@cf* - Use this command to access Codeforces, a popular competitive programming platform.
*@cc* - Use this command to access Codechef, an online platform for competitive programming and coding challenges.
*@at* - Use this command to access Atcoder, a Japanese programming contest platform.
*@contests* - Use this command to get information about upcoming coding contests from various platforms.
*@hackathon* - Use this command to get information about ongoing or upcoming hackathons.

*Group Commands*
---------------------------
*@all* - Tag all users
*@gname* - To change the Group Name by writing Name after the command
*@gcreate* - To create the group, add a number after it as well
*@gdes* - To change the Group Description by writing Description after the command
*@leave* - To leave the group
*@gset a* - To allow only admins to send messages
*@gset na* - To allow everyone in the group to send messages
*@gset l* - To allow only admins to change group settings 
*@gset u* - To allow anyone to change group settings
*@gcode* - To get the Group Code 
*@rcode* - To remove the Group Code
*@rpic* - To remove the Group Pic

Please enter a command to get started. If you need any assistance, type *@commands* to see the full list of available commands.`;
    sendMessage(key.remoteJid, { text: command }, { quoted: msg });
  };

  const handleMirror = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const prefix = "@mirror";
    if (!text.startsWith(prefix)) return;
    const reply = text.slice(prefix.length);
    console.log(reply);
    sendMessage(key.remoteJid, { text: reply });
  };
  const myMap = new Map();
  myMap.set("a", "announcement");
  myMap.set("na", "not_announcement");
  myMap.set("u", "unlocked");
  myMap.set("l", "locked");

  const handleMeme = async (msg) => {
    // Meme Function
    const { key, message } = msg;
    const text = getText(message);
    const str = text.slice(5);
    const trimmedStr = str.trim();
    const subreddit = trimmedStr;
    try {
      let memeUrl = "";
      let memeCaption = "";
      let mcaption = "";
      let img = "";
      let nsf = "";
      do {
        const response = await freshMeme();
        console.log(response);
        memeUrl = response.img;
        memeCaption = response.title;
        mcaption = memeCaption || "";
        img = response.link;
        nsf = response.nsfw;
      } while (img !== "image" || nsf === "nsfw");
      const buttonMessage = {
        image: { url: memeUrl },
        caption: mcaption,
        headerType: 4,
      };
      sendMessage(key.remoteJid, buttonMessage);
    } catch (error) {
      console.error(error);
      sendMessage(key.remoteJid, { text: "Try Again Later!" });
    }
  };
  const handleSticker = async (msg) => {
    const { key, message } = msg;
    console.log(msg);
    const filePath = "downloads/sticker.jpeg";
    const outputFilePath = "downloads/output.jpeg";
    if (message && message.imageMessage) {
      const caption = message.imageMessage.caption;
      try {
        // Download the media message
        const response = await axios.get(message.imageMessage.url, {
          responseType: "arraybuffer",
        });
        const mediaBuffer = response.data;

        // Save the media message to a file
        fs.writeFileSync(filePath, mediaBuffer);

        // Resize the image using Sharp
        await sharp(filePath).resize(200, 200).toFile(outputFilePath);

        // Send the resized image as a message
        const media = MessageMedia.fromFilePath(outputFilePath);
        await sendMessage(key.remoteJid, media);
      } catch (error) {
        console.error("Error occurred while processing the image:", error);
      }
    }
  };
  const handleCompany = async (msg) => {
    const { key, message } = msg;
    const str = getText(message);
    const text = str.trim();
    if (!text.toLowerCase().startsWith("@company")) return;
    const response = await getRandomCompany();
    const reply = `*Company Name:* ${response.name}\n*Carrer Portal Link:* ${response.carrer_url}`;
    sendMessage(key.remoteJid, { text: reply });
  };
  const handleJobs = async (msg) => {
    const { key, message } = msg;
    const str = getText(message);
    const text = str.trim();
    if (!text.toLowerCase().startsWith("@jobs")) return;
    const jType = text.slice(5);
    const jobSearch = jType.trim();
    const queryOptions = {
      keyword: jobSearch,
      location: "India",
      dateSincePosted: "past Week",
      jobType:
        "full time, part time, contract, temporary, volunteer, internship",
      remoteFilter: "remote",
      salary: "100000",
      experienceLevel:
        "internship, entry level, associate, senior, director, executive",
      limit: "10",
    };

    linkedIn.query(queryOptions).then((response) => {
      const data = response;
      let reply = "";
      let serialNumber = 1;
      console.log(data);
      const horizontalLineEmoji = "─".repeat(20);
      const horizontalLine = "*".repeat(20);
      for (const job of data) {
        const position = job.position;
        const company = job.company;
        const location = job.location;
        const date = job.date;
        const salary = job.salary;
        const jobUrl = job.jobUrl;
        const txt = "Jobs";
        const Position =
          position === "" ? "" : "*Position:* " + position + "\n";
        const Company = company === "" ? "" : "*Company:* " + company + "\n";
        const Location =
          location === "" ? "" : "*Location:* " + location + "\n";
        const Date = date === "" ? "" : "*Date:* " + date + "\n";
        const Salary = salary === "" ? "" : "*Salary:* " + salary + "\n";
        const URL = jobUrl === "" ? "" : "*Job URL:* " + jobUrl + "\n";
        const dataToBeStored = `*Job ${serialNumber}*\n${horizontalLineEmoji}\n${Position}${Company}${Location}${Date}${Salary}${URL}\n`;
        reply = reply === "" ? dataToBeStored : reply + dataToBeStored;
        serialNumber++;
      }
      const sorryMessage = "Sorry, No Jobs Are Found Right Now";
      reply =
        reply === ""
          ? sorryMessage
          : reply + horizontalLine + "\n\t\t *All The Best*\n" + horizontalLine;
      sendMessage(key.remoteJid, { text: reply });
    });
  };
  const handleAddName = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const tag = "@gname";
    const str = text.slice(tag.length);
    const title = str.trim();
    await sock.groupUpdateSubject(key.remoteJid, title);
  };
  const handleGroupSubject = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const tag = "@gsub";
    const str = text.slice(tag.length);
    const title = str.trim();
    await sock.groupUpdateDescription(key.remoteJid, title);
  };
  const handleAddDescription = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const tag = "@gdes";
    const str = text.slice(tag.length);
    const title = str.trim();
    await sock.groupUpdateDescription(key.remoteJid, title);
  };
  const handleGroupLeave = async (msg) => {
    const { key, message } = msg;
    try {
      await sock.groupLeave(key.remoteJid);
    } catch (e) {
      // (will throw error if it fails)
      console.log("Error occured");
    }
  };
  const handleGroupSettings = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const tag = "@gset";
    const str = text.slice(tag.length);
    const title = str.trim();
    try {
      await sock.groupSettingUpdate(key.remoteJid, String(myMap.get(title)));
    } catch (e) {
      // (will throw error if it fails)
      sendMessage(key.remoteJid, {
        text: "Sorry, You don't have admin rights",
      });
    }
  };
  const handleGetGroupCode = async (msg) => {
    const { key, message } = msg;
    const code = await sock.groupInviteCode(key.remoteJid);
    sendMessage(key.remoteJid, { text: `Your *Group Code* Is: ${code}` });
  };
  const handleRevokeGroupCode = async (msg) => {
    const { key, message } = msg;
    const code = await sock.groupRevokeInvite(key.remoteJid);
    sendMessage(key.remoteJid, { text: `Your *Group Code* Is Revoked!` });
  };
  const handleCreateGroup = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const tag = "@gcreate";
    const str = text.slice(tag.length);
    const number = str.trim();
    try {
      const group = await sock.groupCreate("New Group", [
        `${number}@s.whatsapp.net`,
      ]);
      sock.sendMessage(group.id, {
        text: `Your Group Is Created, You Can Change The Group Name By The *@gname* Command`,
      }); // say hello to everyone on the group
    } catch (e) {
      sock.sendMessage(key.remoteJid, {
        text: "Please Enter Valid Number With Country Code[No + sign needed]",
      }); // say hello to everyone on the group
    }
  };

  const handleGroupAdd = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const tag = "@gadd";
    const str = text.slice(tag.length);
    const number = str.trim();
    console.log(number);
    const group = await sock.groupParticipantsUpdate(
      key.remoteJid,
      [`+${number}@s.whatsapp.net`],
      "add" // replace this parameter with "remove", "demote" or "promote"
    );
  };
  const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };
  const handleGroupDisplayPicture = async (msg) => {
    const { key, message } = msg;
    const text = getText(message);
    const tag = "@gpic";
    const str = text.slice(tag.length);
    const URL = str.trim();
    console.log(URL);
    try {
      // Use the imported functions as needed
      const imagePath = await downloadAndSaveImage(URL);
      if (imagePath) {
        console.log("ho");
        await sock.updateProfilePicture(key.remoteJid, {
          url: "downloads/groupPic.jpg",
        });
      }
    } catch (e) {
      sendMessage(key.remoteJid, { text: `Please Enter Valid URL` });
    }
  };
  const handleRemoveDisplayPicture = async (msg) => {
    const { key, message } = msg;
    await sock.removeProfilePicture(key.remoteJid);
  };
  const handleCommonReply = (obj) => {
    let reply = "";
    let len = Math.min(obj.length, 10);
    for (let i = 0; i < len; i++) {
      let contest = obj[i];
      let name = `*Name:* ${contest.name}`;
      let url = `*Contest Link:* ${contest.url}`;
      let startTime = new Date(contest.start_time);
      let endTime = new Date(contest.end_time);
      // Convert to Indian Standard Time (IST)
      let startTimeIST = startTime.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      let endTimeIST = endTime.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      let date = startTimeIST.split(",")[0];
      let time = startTimeIST.split(",")[1].trim();
      let stime = `*Start Time:* ${date} ${time}`;
      date = endTimeIST.split(",")[0];
      time = endTimeIST.split(",")[1].trim();
      let etime = `*End Time:* ${date} ${time}`;
      reply += name + "\n" + url + "\n" + stime + "\n" + etime;
      if (i !== len - 1) reply += "\n\n";
    }
    return reply;
  };
  const handleLeetCode = async (msg) => {
    const { key, message } = msg;
    const response = await axios.get("https://kontests.net/api/v1/leet_code");
    const obj = response.data;
    let reply = "*LeetCode Contests*\n";
    reply += "---------------------\n";
    reply += handleCommonReply(obj);
    if (obj.length === 0) {
      reply = "*No Upcoming LeetCode Contests Available*";
    }
    sendMessage(key.remoteJid, { text: reply });
  };
  const handleCodeforces = async (msg) => {
    const { key, message } = msg;
    const response = await axios.get("https://kontests.net/api/v1/codeforces");
    const obj = response.data;
    let reply = "*Codeforces Contests*\n";
    reply += "-----------------------\n";
    reply += handleCommonReply(obj);
    if (obj.length === 0) {
      reply = "*No Upcoming Codeforces Contests Available*";
    }
    sendMessage(key.remoteJid, { text: reply });
  };
  const handleCodechef = async (msg) => {
    const { key, message } = msg;
    const response = await axios.get("https://kontests.net/api/v1/code_chef");
    const obj = response.data;
    let reply = "*Codechef Contests*\n";
    reply += "-----------------------\n";
    reply += handleCommonReply(obj);
    if (obj.length === 0) {
      reply = "*No Upcoming Codechef Contests Available*";
    }
    sendMessage(key.remoteJid, { text: reply });
  };
  const handleAtcoder = async (msg) => {
    const { key, message } = msg;
    const response = await axios.get("https://kontests.net/api/v1/at_coder");
    const obj = response.data;
    let reply = "*Atcoder Contests*\n";
    reply += "-------------------\n";
    reply += handleCommonReply(obj);
    if (obj.length === 0) {
      reply = "*No Upcoming Atcoder Contests Available*";
    }
    sendMessage(key.remoteJid, { text: reply });
  };
  const handleContests = async (msg) => {
    const { key, message } = msg;
    const response = await axios.get("https://kontests.net/api/v1/all");
    const obj = response.data;
    let reply = "*All Contests*\n";
    reply += "-------------------\n";
    reply += handleCommonReply(obj);
    if (obj.length === 0) {
      reply = "*No Upcoming Contests Available*";
    }
    sendMessage(key.remoteJid, { text: reply });
  };
  const handleHackathons = async (msg) => {
    const { key, message } = msg;
    try {
      const response = await axios.get(
        "https://devpost.com/api/hackathons?status[]=upcoming"
      );
      const hackathons = response.data.hackathons;
      let reply = "*Hackathons*\n";
      reply += "--------------\n";
      for (let i = 0; i < hackathons.length; i++) {
        let hackathon = hackathons[i];
        const title = hackathon.title || "N/A";
        const startDate =
          hackathon.submission_period_dates.split(" - ")[0] || "N/A";
        const endDate =
          hackathon.submission_period_dates.split(" - ")[1] || "N/A";
        const location = hackathon.displayed_location.location || "N/A";
        const url = hackathon.url || "N/A";
        const themes =
          hackathon.themes.map((theme) => theme.name).join(", ") || "N/A";
        const prizeAmount =
          hackathon.prize_amount.replace(/<\/?[^>]+(>|$)/g, "") || "N/A";
        reply += `*Title:* ${title}\n`;
        reply += `*Start Date:* ${startDate}\n`;
        reply += `*End Date:* ${endDate}\n`;
        reply += `*Location:* ${location}\n`;
        reply += `*URL:* ${url}\n`;
        reply += `*Themes:* ${themes}\n`;
        reply += `*Prize Amount:* ${prizeAmount}`;
        if (i !== hackathons.length - 1) reply += "\n\n";
      }
      if (hackathons.length === 0) {
        reply = "*No Upcoming Hackathons Available*";
      }
      sendMessage(key.remoteJid, { text: reply });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAll = async (msg) => {
    const { key, message } = msg;
    const str = getText(message);
    const text = str.trim();
    // @all @All
    if (!text.toLowerCase().startsWith("@all")) return;
    // 1. Get All Group Members
    // 2. Tag Them And Reply
    const group = await sock.groupMetadata(key.remoteJid);
    const members = group.participants;

    // Creating two arrays
    const mentions = [];
    const items = [];
    members.forEach(({ id, admin }) => {
      mentions.push(id);
      items.push(`@${id.slice(0, 12)}${admin ? "👑" : ""}`);
    });
    sendMessage(
      key.remoteJid,
      { text: "Hey\n" + items.join(", "), mentions },
      { quoted: msg }
    );
  };
  sock.ev.process(async (events) => {
    if (events["connection.update"]) {
      const { connection, lastDisconnect } = events["connection.update"];
      if (connection === "close") {
        if (
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut
        ) {
          WABot();
        } else {
          console.log("Disconnected because you logged out");
        }
      }
    }
    if (events["creds.update"]) {
      await saveCreds();
    }
    if (events["messages.upsert"]) {
      const { messages } = events["messages.upsert"];
      messages.forEach((msg) => {
        if (!msg.message) return;
        // !mirror hello
        // processing
        if (getText(msg.message).startsWith("@commands")) handleCommand(msg);
        else if (getText(msg.message).startsWith("@meme")) handleMeme(msg);
        else if (getText(msg.message).startsWith("@mirror")) handleMirror(msg);
        else if (getText(msg.message).startsWith("@all")) handleAll(msg);
        else if (getText(msg.message).startsWith("@ask")) handleAi(msg);
        else if (getText(msg.message).startsWith("@ytd")) handleYTDownload(msg);
        else if (getText(msg.message).startsWith("@fb")) handleFbVideos(msg);
        else if (getText(msg.message).startsWith("@jobs")) handleJobs(msg);
        else if (getText(msg.message).startsWith("@company"))
          handleCompany(msg);
        else if (getText(msg.message).startsWith("@gname")) handleAddName(msg);
        else if (getText(msg.message).startsWith("@gdes"))
          handleAddDescription(msg);
        else if (getText(msg.message).startsWith("@leave"))
          handleGroupLeave(msg);
        else if (getText(msg.message).startsWith("@gset"))
          handleGroupSettings(msg);
        else if (getText(msg.message).startsWith("@gcode"))
          handleGetGroupCode(msg);
        else if (getText(msg.message).startsWith("@rcode"))
          handleRevokeGroupCode(msg);
        else if (getText(msg.message).startsWith("@gpic"))
          // Not Working Correctly
          handleGroupDisplayPicture(msg);
        else if (getText(msg.message).startsWith("@rpic"))
          handleRemoveDisplayPicture(msg);
        else if (getText(msg.message).startsWith("@gcreate"))
          handleCreateGroup(msg);
        else if (getText(msg.message).startsWith("@lc")) handleLeetCode(msg);
        else if (getText(msg.message).startsWith("@cf")) handleCodeforces(msg);
        else if (getText(msg.message).startsWith("@cc")) handleCodechef(msg);
        else if (getText(msg.message).startsWith("@at")) handleAtcoder(msg);
        else if (getText(msg.message).startsWith("@contests"))
          handleContests(msg);
        else if (getText(msg.message).startsWith("@hackathon"))
          handleHackathons(msg);
        // else if (getText(msg.message).startsWith("@gadd")) handleGroupAdd(msg); // Not Working
        // handleSticker(msg); // Not Working
        handleIG(msg); // Not Working
        // handleFbImg(msg); //Not Working
      });
    }
  });
}

WABot();
